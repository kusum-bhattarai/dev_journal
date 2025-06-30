import express, {Request, Response, NextFunction} from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './db'; 
import { socketAuthMiddleware } from './middleware/auth'; 

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"],
    credentials: true
  },
});

io.use(socketAuthMiddleware);   

// Express middleware
app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true
}));
app.use(express.json());

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => 
    Promise.resolve(fn(req, res, next)).catch((err: unknown) => {
      const error = err as Error;
      console.error('Chat Service: Error caught:', error.stack || error);
      next(error);
    });
    
// Basic health check endpoint
app.get('/health', asyncHandler(async (req: Request, res: Response) => {
    try {
        await db.query('SELECT 1'); 
        res.status(200).send('Chat service is healthy and connected to DB.');
    } catch (error) {
        console.error('Chat Service: DB health check failed:', error);
        res.status(500).send('Chat service is unhealthy (DB connection error).');
    }
}));

// conversation endpoint
app.post('/conversations', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { user1Id, user2Id } = req.body;
    if (!user1Id || !user2Id) {
        return res.status(400).json({ error: 'user1Id and user2Id are required' });
    }
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authorization token required' });
    }

    await db.query('SELECT 1 FROM users WHERE user_id = $1', [user1Id]); // Validate user1
    await db.query('SELECT 1 FROM users WHERE user_id = $2', [user2Id]); // Validate user2
    const [orderedUser1Id, orderedUser2Id] = [user1Id, user2Id].sort((a, b) => a - b);
    const result = await db.query(
        'INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT unique_ordered_conversation_pair DO UPDATE SET last_message_id = EXCLUDED.last_message_id RETURNING conversation_id',
        [orderedUser1Id, orderedUser2Id]
    );
    if (result.rows.length === 0) {
        throw new Error('No conversation created or updated');
    }
    res.status(201).json({ conversation_id: result.rows[0].conversation_id });
}));

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
  console.log(`Chat Service: User ${socket.userId} connected with socket ID: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Chat Service: User ${socket.userId} disconnected with socket ID: ${socket.id}`);
  });

  // more event listeners to be added later on
});

const PORT = process.env.CHAT_SERVICE_PORT || 3003;
server.listen(PORT, () => {
  console.log(`Chat Service: HTTP/WebSocket server running on port ${PORT}`);
  console.log(`Chat Service: WebSocket accessible at ws://localhost:${PORT}`);
});