import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db';
import { authMiddleware } from './middleware/auth';
import axios from 'axios'; // Import axios

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// --- API Routes ---

app.get('/api/journals', authMiddleware, async (req, res) => {
  const userId = res.locals.user?.id;
  try {
    const query = `
      SELECT DISTINCT je.*
      FROM journal_entries je
      LEFT JOIN journal_collaborators jc ON je.journal_id = jc.journal_id
      WHERE je.user_id = $1 OR jc.user_id = $1
      ORDER BY je.created_at DESC
    `;
    const { rows } = await db.query(query, [userId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ message: 'Server error fetching journal entries' });
  }
});

app.post('/api/journals', authMiddleware, async (req, res) => {
  const userId = res.locals.user?.id;
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Content cannot be empty' });
  }
  try {
    const { rows } = await db.query(
      'INSERT INTO journal_entries (user_id, content) VALUES ($1, $2) RETURNING *',
      [userId, content]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ message: 'Server error creating journal entry' });
  }
});

app.post('/api/journals/:id/share', authMiddleware, async (req, res) => {
  const owner = res.locals.user;
  const journalId = parseInt(req.params.id, 10);
  const { collaboratorId, permission } = req.body;

  if (!collaboratorId || !permission) {
    return res.status(400).json({ message: 'collaboratorId and permission are required' });
  }
  if (!['viewer', 'editor'].includes(permission)) {
    return res.status(400).json({ message: 'Invalid permission level' });
  }

  try {
    const journalCheck = await db.query(
      'SELECT user_id, (SELECT username FROM users WHERE user_id = je.user_id) as owner_username FROM journal_entries je WHERE journal_id = $1',
      [journalId]
    );

    if (journalCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    const journal = journalCheck.rows[0];
    if (journal.user_id !== owner.id) {
      return res.status(403).json({ message: 'Only the owner can share this journal' });
    }
    
    const insertQuery = `
      INSERT INTO journal_collaborators (journal_id, user_id, permission)
      VALUES ($1, $2, $3)
      ON CONFLICT (journal_id, user_id)
      DO UPDATE SET permission = EXCLUDED.permission
      RETURNING *;
    `;
    const { rows } = await db.query(insertQuery, [journalId, collaboratorId, permission]);

    try {
      await axios.post(
        `${process.env.CHAT_SERVICE_URL}/internal/notifications/journal_share`,
        {
          sharerId: owner.id,
          recipientId: collaboratorId,
          journalId: journalId,
          sharerUsername: journal.owner_username
        },
        {
          headers: {
            'x-internal-api-key': process.env.INTERNAL_API_KEY
          }
        }
      );
      console.log('Successfully sent share notification to Chat Service');
    } catch (notificationError) {
      console.error('Failed to send share notification:', (notificationError as any).message);
    }
    
    res.status(200).json({
      message: 'Journal shared successfully',
      collaboration: rows[0],
    });

  } catch (error) {
    console.error('Error sharing journal:', error);
    if ((error as any).code === '23503') {
        return res.status(404).json({ message: 'Collaborator user not found' });
    }
    res.status(500).json({ message: 'Server error while sharing journal' });
  }
});

app.delete('/api/journals/:id', authMiddleware, async (req, res) => {
  const userId = res.locals.user?.id;
  const journalId = parseInt(req.params.id, 10);
  try {
    // Collaborators cannot delete journals.
    const result = await db.query(
      'DELETE FROM journal_entries WHERE journal_id = $1 AND user_id = $2 RETURNING *',
      [journalId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Journal entry not found or user not authorized' });
    }
    res.status(200).json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ message: 'Server error deleting journal entry' });
  }
});

// GET single journal entry (Owner or Collaborator)
app.get('/api/journals/:id', authMiddleware, async (req, res) => {
  const userId = res.locals.user?.id;
  const journalId = parseInt(req.params.id, 10);
  try {
    // This query now checks if the user is the owner OR a collaborator.
    // It also returns the user's permission level for this specific journal.
    // The frontend will use this 'permission' field to determine if the textarea should be editable.
    const query = `
      SELECT
        je.*,
        CASE
          WHEN je.user_id = $1 THEN 'editor'::permission_level -- The owner is always an editor
          ELSE jc.permission
        END AS permission
      FROM journal_entries je
      LEFT JOIN journal_collaborators jc ON je.journal_id = jc.journal_id
      WHERE je.journal_id = $2 AND (je.user_id = $1 OR jc.user_id = $1)
    `;
    const { rows } = await db.query(query, [userId, journalId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Journal entry not found or user not authorized' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ message: 'Server error fetching journal entry' });
  }
});

// PUT update journal entry (Owner or Collaborator)
app.put('/api/journals/:id', authMiddleware, async (req, res) => {
  const userId = res.locals.user?.id;
  const journalId = parseInt(req.params.id, 10);
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Content cannot be empty' });
  }
  try {
    // Before updating, we perform a subquery to check the user's permission.
    // The update will only proceed if the user is the owner OR an 'editor' in the collaborators table.
    const query = `
      UPDATE journal_entries
      SET content = $1
      WHERE journal_id = $2
      AND (
        user_id = $3
        OR
        EXISTS (
          SELECT 1 FROM journal_collaborators
          WHERE journal_id = $2 AND user_id = $3 AND permission = 'editor'
        )
      )
      RETURNING *
    `;
    const { rows } = await db.query(query, [content, journalId, userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Journal entry not found or user not authorized to edit' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ message: 'Server error updating journal entry' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});