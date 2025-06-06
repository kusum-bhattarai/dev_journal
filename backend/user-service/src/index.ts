import express from 'express';
import { Pool } from 'pg';
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test route to verify server is running
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'journal_entries')
    `);
    const tables = result.rows.map(row => row.table_name);
    res.json({ message: 'Database connected', tables });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));