import express from 'express';
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

// Basic health check endpoint
app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1'); 
        res.status(200).send('Chat service is healthy and connected to DB.');
    } catch (error) {
        console.error('Chat Service: DB health check failed:', error);
        res.status(500).send('Chat service is unhealthy (DB connection error).');
    }
});

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