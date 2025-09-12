import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// --- API Routes ---

app.get('/api/journals', authMiddleware, async (req, res) => {
  const userId = res.locals.user?.id;
  try {
    // This query now fetches journals where the user is the owner OR a collaborator.
    // It uses a LEFT JOIN to check the collaborators table.
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