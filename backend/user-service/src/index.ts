import express, {Request, Response, RequestHandler} from 'express';
import { Pool } from 'pg';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bcrypt from 'bcryptjs'

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

// Manual User Registration
app.post('/auth/register', (async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user into the database
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
    // Find user by email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if the user has a password (they might have registered via GitHub)
    if (!user.password) {
        return res.status(401).json({ error: 'You have previously signed in with GitHub. Please use GitHub to log in.' });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
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
      callbackURL: 'http://localhost:3001/auth/github/callback',
    },
    async (accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: User) => void) => {
      //debugging: console.log('GitHub Profile:', profile);
      const githubId = profile.id.toString();
      const username = profile.username || profile.displayName || 'Unknown';
      const email = profile.emails?.[0]?.value || ''; // Fallback if email is missing
      try {
        const result = await pool.query('SELECT * FROM users WHERE github_id = $1', [githubId]);
        const user = result.rows[0];
        if (!user){
          const newUser = await pool.query(
            'INSERT INTO users (username, email, github_id) VALUES ($1, $2, $3) RETURNING *',
            [username, email, githubId]
          );
          return done(null, newUser.rows[0] as User);
      }
      // Existing user - return existing user
      return done(null, user);
      } catch (err: any) {
        return done(err);
      }
    }
  )
);

// GitHub OAuth routes
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email']}));

app.get(
  '/auth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: 'http://localhost:3000/login' }),
  async (req: any, res) => {
    const profile = req.user as User;
    const githubId = profile.github_id;
    // Generate JWT token
    const token = jwt.sign({ userId: profile.user_id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    const state = req.query.state || 'login'; // Default to 'login' if state is missing

    console.log('Callback State:', state); // Debug the state value

    try{
      const result = await pool.query('SELECT * FROM users WHERE github_id = $1', [githubId]);
      if (result.rows.length > 0) {
        // Existing user
        res.redirect(`http://${state === 'register' ? 'localhost:3000/register' : 'localhost:3000/login'}?token=${token}®istered=true`);
      } else {
        // New user
        res.redirect(`http://${state === 'register' ? 'localhost:3000/register' : 'localhost:3000/login'}?token=${token}`);
      }
    }
    catch(error){
      console.error('Error checking user:', error);
      res.status(500).send('Internal Server Error');
    }
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