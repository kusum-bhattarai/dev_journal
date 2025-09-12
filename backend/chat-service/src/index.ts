import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './db';
import { socketAuthMiddleware } from './middleware/auth';
import { QueryResult } from 'pg';

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

const internalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-internal-api-key'];
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
        res.status(401).json({ error: 'Unauthorized: Missing or invalid internal API key' });
        return; 
    }
    next();
};

// Simplified asyncHandler that just passes errors to Express's default handler
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

const saveMessage = async (
    conversationId: number,
    senderId: number,
    content: string,
    messageType: 'text' | 'journal_share' = 'text',
    metadata: object | null = null
) => {
    const convResult = await db.query(
        'SELECT user1_id, user2_id FROM conversations WHERE conversation_id = $1',
        [conversationId]
    );

    if (convResult.rows.length === 0) throw new Error('Conversation not found');
    
    const { user1_id, user2_id } = convResult.rows[0];
    const receiverId = senderId === user1_id ? user2_id : senderId === user2_id ? user1_id : null;
    
    if (!receiverId) throw new Error('Sender not part of conversation');

    const result = await db.query(
        `INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING message_id, timestamp, read_status`,
        [conversationId, senderId, receiverId, content, messageType, metadata ? JSON.stringify(metadata) : null]
    );
    
    const savedMessage = {
        message_id: result.rows[0].message_id,
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        timestamp: result.rows[0].timestamp,
        read_status: result.rows[0].read_status,
        message_type: messageType,
        metadata,
    };

    await db.query(
        'UPDATE conversations SET last_message_id = $1 WHERE conversation_id = $2',
        [savedMessage.message_id, conversationId]
    );

    console.log(`Message ${savedMessage.message_id} of type ${messageType} saved`);
    return savedMessage;
};

app.post('/conversations', asyncHandler(async (req, res) => {
    const { user1Id, user2Id } = req.body;
    if (!user1Id || !user2Id) {
        res.status(400).json({ error: 'user1Id and user2Id are required' });
        return;
    }
    const userCheck = await db.query('SELECT 1 FROM users WHERE user_id = ANY($1::int[])',[[parseInt(user1Id), parseInt(user2Id)]]);
    if (userCheck.rows.length !== 2) {
        res.status(404).json({ error: 'One or both users not found' });
        return;
    }

    const [orderedUser1Id, orderedUser2Id] = [parseInt(user1Id), parseInt(user2Id)].sort((a, b) => a - b);
    
    let conversationId: number;
    const existingConvResult: QueryResult<{ conversation_id: number }> = await db.query(
        'SELECT conversation_id FROM conversations WHERE user1_id = $1 AND user2_id = $2',
        [orderedUser1Id, orderedUser2Id]
    );

    if (existingConvResult.rows.length > 0) {
        conversationId = existingConvResult.rows[0].conversation_id;
    } else {
        const newConvResult: QueryResult<{ conversation_id: number }> = await db.query(
            'INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) RETURNING conversation_id',
            [orderedUser1Id, orderedUser2Id]
        );
        conversationId = newConvResult.rows[0].conversation_id;
    }
    
    res.status(201).json({ conversation_id: conversationId });
}));

app.get('/conversations', asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Authorization token required' });
        return;
    }
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const userId = parseInt(tokenData.userId, 10);
    const query = `
        SELECT
            c.conversation_id, c.user1_id, c.user2_id,
            u.user_id as other_user_id, u.username as other_username,
            m.content as last_message_content, m.timestamp as last_message_timestamp,
            m.read_status, m.sender_id as last_message_sender_id,
            m.message_type, m.metadata
        FROM conversations c
        JOIN users u ON u.user_id = (CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END)
        LEFT JOIN messages m ON m.message_id = c.last_message_id
        WHERE c.user1_id = $1 OR c.user2_id = $1
        ORDER BY m.timestamp DESC NULLS LAST;
    `;
    const result = await db.query(query, [userId]);
    res.status(200).json(result.rows);
}));

app.get('/messages/:conversationId', asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Authorization token required' });
        return;
    }
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const userId = parseInt(tokenData.userId);
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const conversationCheck = await db.query('SELECT 1 FROM conversations WHERE conversation_id = $1 AND (user1_id = $2 OR user2_id = $2)', [parseInt(conversationId), userId]);
    if (conversationCheck.rows.length === 0) {
        res.status(403).json({ error: 'User not authorized for this conversation' });
        return;
    }
    const result = await db.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3', [parseInt(conversationId), limit, offset]);
    res.status(200).json(result.rows);
}));

app.post('/internal/notifications/journal_share', internalAuthMiddleware, asyncHandler(async (req, res) => {
    const { sharerId, recipientId, journalId, sharerUsername } = req.body;

    if (!sharerId || !recipientId || !journalId || !sharerUsername) {
        res.status(400).json({ error: 'Missing required fields for notification' });
        return;
    }

    const [user1, user2] = [sharerId, recipientId].sort((a,b) => a - b);
    
    const convResult: QueryResult<{ conversation_id: number }> = await db.query(
        'SELECT conversation_id FROM conversations WHERE user1_id = $1 AND user2_id = $2',
        [user1, user2]
    );
    if (convResult.rows.length === 0) {
        res.status(404).json({ error: 'Conversation not found between these users' });
        return;
    }
    const conversationId = convResult.rows[0].conversation_id;

    const content = `${sharerUsername} shared a journal with you.`;
    const metadata = { journalId };
    const savedMessage = await saveMessage(conversationId, sharerId, content, 'journal_share', metadata);
    
    io.to(`room_${conversationId}`).emit('receiveMessage', savedMessage);
    
    res.status(200).json({ message: 'Notification sent successfully', sentMessage: savedMessage });
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
            const savedMessage = await saveMessage(parseInt(data.conversationId), data.senderId, data.content, 'text', null);
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
            const convCheck = await db.query('SELECT 1 FROM conversations WHERE conversation_id = $1 AND (user1_id = $2 OR user2_id = $2)',[parseInt(conversationId), userId]);
            if (convCheck.rows.length === 0) {
                socket.emit('messageError', { error: 'User not authorized for this conversation' });
                return;
            }
            await db.query('UPDATE messages SET read_status = TRUE WHERE conversation_id = $1 AND message_id = ANY($2::int[]) AND receiver_id = $3',[parseInt(conversationId), messageIds, userId]);
            io.to(`room_${conversationId}`).emit('messageUpdated', { messageIds, read_status: true });
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