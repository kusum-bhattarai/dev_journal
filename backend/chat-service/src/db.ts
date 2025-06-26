import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon 
  }
});

pool.on('connect', () => {
  console.log('Chat Service: Connected to PostgreSQL database');
});

pool.on('error', (err: Error) => {
  console.error('Chat Service: Unexpected error on idle client', err);
  process.exit(-1);
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params || []),
  pool, 
};