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
    const { rows } = await db.query(
      'SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
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

// GET single journal entry
app.get('/api/journals/:id', authMiddleware, async (req, res) => {
  const userId = res.locals.user?.id;
  const journalId = parseInt(req.params.id, 10);
  try {
    const { rows } = await db.query(
      'SELECT * FROM journal_entries WHERE journal_id = $1 AND user_id = $2',
      [journalId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Journal entry not found or user not authorized' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ message: 'Server error fetching journal entry' });
  }
});

// PUT update journal entry
app.put('/api/journals/:id', authMiddleware, async (req, res) => {
  const userId = res.locals.user?.id;
  const journalId = parseInt(req.params.id, 10);
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Content cannot be empty' });
  }
  try {
    const { rows } = await db.query(
      'UPDATE journal_entries SET content = $1 WHERE journal_id = $2 AND user_id = $3 RETURNING *',
      [content, journalId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Journal entry not found or user not authorized' });
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