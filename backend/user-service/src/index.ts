import express from 'express';
import { Pool } from 'pg';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import jwt from 'jsonwebtoken';
import cors from 'cors';

interface User {
  user_id: number;
  github_id: string;
  username: string;
  email: string;
}

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
      passReqToCallback: true, //passing the request object to the callback
    },
    async (req:any, accessToken: string, refreshToken: string, profile: any, done: (err: any, user: User | false, info?: { message: string }) => void) => {

      const state = req.query.state;  //register or login
      //debugging: console.log('GitHub Profile:', profile);
      const githubId = profile.id.toString();
      const username = profile.username || profile.displayName || 'Unknown';
      const email = profile.emails?.[0]?.value || ''; // Fallback if email is missing
      try {
        const result = await pool.query('SELECT * FROM users WHERE github_id = $1', [githubId]);
        const user = result.rows[0];

        if(state==='register'){
          if (user) {
            // User trying to register, but already exists
            return done(null, false, { message: 'already-registered' });
        }
        // New user registering
          const newUser = await pool.query(
            'INSERT INTO users (username, email, github_id) VALUES ($1, $2, $3) RETURNING *',
            [profile.username, profile.emails?.[0]?.value || '', profile.id]
          );
          return done(null, newUser.rows[0], { message: 'registration-successful' });
        }
        
        if (state === 'login') {
          if (user) {
            // Existing user logging in
            return done(null, user, { message: 'login-successful' });
          }
          // User trying to log in, but doesn't exist
          return done(null, false, { message: 'not-registered' });
        }
        // Default fallback
        return done(new Error('Invalid state for authentication'), false);
      } catch (err: any) {
        return done(err, false);
      }
    }
  )
);

// GitHub OAuth routes
app.get('/auth/github', (req, res, next) => {
  const state = req.query.state === 'register' ? 'register' : 'login';
  passport.authenticate('github', { scope: ['user:email'], state})(req, res, next);
});

app.get(
  '/auth/github/callback',
  (req, res, next) => {
    passport.authenticate('github', { session: false, failureRedirect: 'http://localhost:3000/login' }, (err: { message: any; }, user: { user_id: any; }, info: { message: any; }) => {
        if (err) {
            return res.redirect(`http://localhost:3000/login?error=${err.message}`);
        }

        const { message } = info;

        if (message === 'registration-successful') {
            return res.redirect('http://localhost:3000/login?status=registered');
        }
        if (message === 'already-registered') {
            return res.redirect('http://localhost:3000/login?status=already-registered');
        }
        if (message === 'not-registered') {
            return res.redirect('http://localhost:3000/login?status=not-registered');
        }
        if (message === 'login-successful' && user) {
            const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
            return res.redirect(`http://localhost:3000/?token=${token}`);
        }

        // Fallback for any other case
        return res.redirect('http://localhost:3000/login');

    })(req, res, next);
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