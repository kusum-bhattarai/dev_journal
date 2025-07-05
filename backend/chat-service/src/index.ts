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
            console.error('Error:', error.message);
            res.status(500).json({ error: 'Internal server error', details: error.message });
            next(error);
        });

const saveMessage = async (conversationId: number, senderId: number, content: string) => {
    const conversationResult = await db.query(
        'SELECT user1_id, user2_id FROM conversations WHERE conversation_id = $1',
        [conversationId]
    );

    if (conversationResult.rows.length === 0) {
        throw new Error('Conversation not found');
    }

    const { user1_id, user2_id } = conversationResult.rows[0];
    const receiverId = senderId === user1_id ? user2_id : user2_id === senderId ? user1_id : null;

    if (!receiverId) {
        throw new Error('Sender not part of conversation');
    }

    try {
        const insertMessageResult = await db.query(
            'INSERT INTO messages (conversation_id, sender_id, receiver_id, content, timestamp, read_status) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, FALSE) RETURNING message_id, timestamp',
            [conversationId, senderId, receiverId, content]
        );

        if (insertMessageResult.rowCount === 0) {
            throw new Error('Failed to save message to database');
        }

        const savedMessage = {
            message_id: insertMessageResult.rows[0].message_id,
            conversation_id: conversationId,
            sender_id: senderId,
            receiver_id: receiverId,
            content,
            timestamp: insertMessageResult.rows[0].timestamp,
            read_status: false,
        };

        await db.query(
            'UPDATE conversations SET last_message_id = $1 WHERE conversation_id = $2',
            [savedMessage.message_id, conversationId]
        );

        console.log(`Message ${savedMessage.message_id} saved`);
        return savedMessage;
    } catch (dbError) {
        console.error('Database error:', (dbError as Error).message);
        throw dbError;
    }
};

app.post('/test-body', asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Body received', body: req.body });
}));

app.post('/conversations', asyncHandler(async (req: Request, res: Response) => {
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
        'INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT unique_ordered_conversation_pair DO NOTHING RETURNING conversation_id',
        [orderedUser1Id, orderedUser2Id]
    );
    const conversationId = result.rows.length > 0 ? result.rows[0].conversation_id : (await db.query(
        'SELECT conversation_id FROM conversations WHERE user1_id = $1 AND user2_id = $2',
        [orderedUser1Id, orderedUser2Id]
    )).rows[0].conversation_id;
    res.status(201).json({ conversation_id: conversationId });
}));

app.get('/conversations', asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authorization token required' });
    }
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const userId = tokenData.userId;
    const result = await db.query(
        'SELECT conversation_id, user1_id, user2_id, last_message_id FROM conversations WHERE user1_id = $1 OR user2_id = $1',
        [parseInt(userId)]
    );
    res.status(200).json(result.rows);
}));

app.get('/messages/:conversationId', asyncHandler(async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authorization token required' });
    }
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const userId = parseInt(tokenData.userId);

    try {
        const conversationCheck = await db.query(
            'SELECT 1 FROM conversations WHERE conversation_id = $1 AND (user1_id = $2 OR user2_id = $2)',
            [parseInt(conversationId), userId]
        );
        if (conversationCheck.rows.length === 0) {
            return res.status(403).json({ error: 'User not authorized for this conversation' });
        }

        const result = await db.query(
            'SELECT message_id, conversation_id, sender_id, receiver_id, content, timestamp, read_status FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC',
            [parseInt(conversationId)]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching messages:', (error as Error).message);
        res.status(500).json({ error: 'Failed to fetch messages', details: (error as Error).message });
    }
}));

app.post('/messages', asyncHandler(async (req: Request, res: Response) => {
    const { conversationId, senderId, content } = req.body;
    if (!conversationId || !senderId || !content) {
        return res.status(400).json({ error: 'conversationId, senderId, and content are required' });
    }

    try {
        const message = await saveMessage(parseInt(conversationId), parseInt(senderId), content);
        io.to(`room_${conversationId}`).emit('receiveMessage', message);
        res.status(201).json({ message_id: message.message_id });
    } catch (error) {
        console.error('Error saving message via HTTP:', (error as Error).message);
        res.status(500).json({ error: 'Failed to save message', details: (error as Error).message });
    }
}));

io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    socket.on('joinRoom', (conversationId: string) => {
        socket.join(`room_${conversationId}`);
        console.log(`User ${socket.userId} joined room_${conversationId}`);
    });

    socket.on('sendMessage', async (data: { conversationId: string; senderId: number; content: string }) => {
        try {
            if (!data.conversationId || !data.senderId || !data.content) {
                socket.emit('messageError', { error: 'Missing message data' });
                return;
            }
            const savedMessage = await saveMessage(parseInt(data.conversationId), data.senderId, data.content);
            io.to(`room_${data.conversationId}`).emit('receiveMessage', savedMessage);
        } catch (error) {
            console.error('Error handling sendMessage:', (error as Error).message);
            socket.emit('messageError', { error: 'Failed to send message', details: (error as Error).message });
        }
    });

    socket.on('markAsRead', async (data: { conversationId: string; messageIds: number[] }) => {
        try {
            const { conversationId, messageIds } = data;
            if (!conversationId || !messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
                socket.emit('messageError', { error: 'Invalid markAsRead data' });
                return;
            }

            const userId = socket.userId;
            const conversationCheck = await db.query(
                'SELECT 1 FROM conversations WHERE conversation_id = $1 AND (user1_id = $2 OR user2_id = $2)',
                [parseInt(conversationId), userId]
            );
            if (conversationCheck.rows.length === 0) {
                socket.emit('messageError', { error: 'User not authorized for this conversation' });
                return;
            }

            await db.query(
                'UPDATE messages SET read_status = TRUE WHERE conversation_id = $1 AND message_id = ANY($2::int[]) AND receiver_id = $3',
                [parseInt(conversationId), messageIds, userId]
            );

            io.to(`room_${conversationId}`).emit('messageUpdated', { messageIds, read_status: true });
            console.log(`Marked messages ${messageIds.join(', ')} as read in conversation ${conversationId}`);
        } catch (error) {
            console.error('Error handling markAsRead:', (error as Error).message);
            socket.emit('messageError', { error: 'Failed to mark messages as read', details: (error as Error).message });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
    });
});

const PORT = process.env.CHAT_SERVICE_PORT || 3003;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});