import 'dotenv/config';
import express, {Request, Response, RequestHandler} from 'express';
import { Pool } from 'pg';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bcrypt from 'bcrypt';

interface User {
  user_id: number;
  github_id: string;
  username: string;
  email: string;
  password?: string; 
}

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

// Manual User Registration
app.post('/auth/register', (async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING user_id, username, email',
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// Manual User Login
app.post('/auth/login', (async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials or sign-in method' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    res.json({ token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}) as RequestHandler);

// Passport GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: `${process.env.API_URL}/auth/github/callback`,
      passReqToCallback: true,
    },
    async (req: any, accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: User | false, info?: { message: string }) => void) => {
      const state = req.query.state;
      try {
        const userResult = await pool.query('SELECT * FROM users WHERE github_id = $1', [profile.id]);
        const user = userResult.rows[0];
        
        if (state === 'register') {
          if (user) return done(null, false, { message: 'already-registered' });
          const newUser = await pool.query('INSERT INTO users (username, email, github_id) VALUES ($1, $2, $3) RETURNING *', [profile.username, profile.emails?.[0]?.value || '', profile.id]);
          return done(null, newUser.rows[0], { message: 'registration-successful' });
        }
        
        // Default to login behavior
        if (user) return done(null, user, { message: 'login-successful' });
        return done(null, false, { message: 'not-registered' });

      } catch (err) {
        return done(err as Error, false);
      }
    }
  )
);

// GitHub OAuth routes
app.get('/auth/github', (req, res, next) => {
  // Pass the state from the frontend link directly into passport
  passport.authenticate('github', { 
    scope: ['user:email'], 
    session: false,
    state: req.query.state as string 
  })(req, res, next);
});

app.get(
  '/auth/github/callback',
  (req, res, next) => {
    passport.authenticate('github', { session: false, failureRedirect: '/login' }, (err: any, user: User | false, info: any) => {
      if (err) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=${err.message}`);
      }
      
      // Handle cases like 'not-registered' or 'already-registered'
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?status=${info.message || 'error'}`);
      }
      
      // If registration was successful, redirect to login page with a success status
      if (info.message === 'registration-successful') {
        return res.redirect(`${process.env.FRONTEND_URL}/login?status=registered`);
      }
      
      // If login was successful, generate a token and redirect to the frontend with it
      const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

    })(req, res, next);
  }
);

app.get('/users', async (req, res) => {
  const { search } = req.query;
  const result = await pool.query(
    'SELECT user_id, username, email FROM users WHERE username ILIKE $1 OR email ILIKE $1',
    [`%${search}%`]
  );
  res.json(result.rows);
});

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app; // Export the app for testing