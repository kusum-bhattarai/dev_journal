import express from 'express';
import { Pool } from 'pg';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import jwt from 'jsonwebtoken';
import cors from 'cors';

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(passport.initialize());

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

// Passport GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: 'http://localhost:3001/auth/github/callback',
    },
    async (accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
      try {
        const result = await pool.query('SELECT * FROM users WHERE github_id = $1', [profile.id]);
        const user = result.rows[0];
        if (user) {
          // User exists, return the user
          return done(null, user);
        }
        // User doesn't exist, create a new one
        const newUser = await pool.query(
          'INSERT INTO users (username, email, github_id) VALUES ($1, $2, $3) RETURNING *',
          [profile.username, profile.emails?.[0]?.value || '', profile.id]
        );
        return done(null, newUser.rows[0]);
      } catch (err: any) {
        return done(err);
      }
    }
  )
);

// GitHub OAuth routes
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get(
  '/auth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: 'http://localhost:3000/login' }),
  (req: any, res) => {
    // Generate JWT token
    const token = jwt.sign({ userId: req.user.user_id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    // Redirect to frontend with token
    res.redirect(`http://localhost:3000/?token=${token}`);
  }
);

// Link GitHub account route
app.get('/auth/link-github', passport.authenticate('github', { scope: ['user:email'] }));

app.get(
  '/auth/link-github/callback',
  passport.authenticate('github', { session: false, failureRedirect: 'http://localhost:3000/link' }),
  async (req: any, res) => {
    try {
      // Assuming the user is already logged in and req.user contains their info
      await pool.query('UPDATE users SET github_id = $1 WHERE user_id = $2', [
        req.user.github_id,
        req.user.user_id,
      ]);
      res.redirect('http://localhost:3000/profile');
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));