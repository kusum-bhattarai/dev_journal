import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './db'; 
import { socketAuthMiddleware } from './middleware/auth'; 

dotenv.config();

const app = express();
app.use(express.json());
console.log('Chat Service: express.json middleware registered');
app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"],
    credentials: true
  },
});

io.use(socketAuthMiddleware);   

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => 
    Promise.resolve(fn(req, res, next)).catch((err: unknown) => {
      const error = err as Error;
      console.error('Chat Service: Error caught:', error.stack || error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
      next(error);
    });
    
app.post('/test-body', asyncHandler(async (req: Request, res: Response) => {
    console.log('Test endpoint - Received request headers:', req.headers);
    console.log('Test endpoint - Received request body:', req.body);
    res.status(200).json({ message: 'Body received', body: req.body });
}));

app.post('/conversations', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    console.log('Raw request headers:', req.headers);
    console.log('Received request body:', req.body);
    const { user1Id, user2Id } = req.body;
    if (!user1Id || !user2Id) {
        return res.status(400).json({ error: 'user1Id and user2Id are required' });
    }
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authorization token required' });
    }

    const userCheck = await db.query(
        'SELECT 1 FROM users WHERE user_id = ANY($1::int[])',
        [[parseInt(user1Id), parseInt(user2Id)]]
    );
    if (userCheck.rows.length !== 2) {
        return res.status(404).json({ error: 'One or both users not found' });
    }

    const [orderedUser1Id, orderedUser2Id] = [parseInt(user1Id), parseInt(user2Id)].sort((a, b) => a - b);
    const result = await db.query(
        'INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT unique_ordered_conversation_pair DO UPDATE SET last_message_id = EXCLUDED.last_message_id RETURNING conversation_id',
        [orderedUser1Id, orderedUser2Id]
    );
    if (result.rows.length === 0) {
        throw new Error('No conversation created or updated');
    }
    res.status(201).json({ conversation_id: result.rows[0].conversation_id });
}));

// Message endpoint (placeholder for now)
app.post('/messages', asyncHandler(async (req: Request, res: Response) => {
    const { conversationId, senderId, content } = req.body;
    if (!conversationId || !senderId || !content) {
        return res.status(400).json({ error: 'conversationId, senderId, and content are required' });
    }
    const result = await db.query(
        'INSERT INTO messages (sender_id, receiver_id, content, conversation_id) VALUES ($1, $2, $3, $4) RETURNING message_id',
        [parseInt(senderId), -1, content, parseInt(conversationId)] // Placeholder receiver_id, to be updated with Socket.IO
    );
    res.status(201).json({ message_id: result.rows[0].message_id });
}));

io.on('connection', (socket) => {
  console.log(`Chat Service: User ${socket.userId} connected with socket ID: ${socket.id}`);

    socket.on('sendMessage', (data) => {
      console.log('Received sendMessage:', data);
      io.emit('receiveMessage', data); // Broadcast to all for now, will refine later
    });

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