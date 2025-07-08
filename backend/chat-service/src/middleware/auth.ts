import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io'; 
import { ExtendedError } from 'socket.io/dist/namespace'; 

declare module 'socket.io' {
    interface Socket {
        userId: number;
    }
}

export const socketAuthMiddleware = (socket: Socket, next: (err?: ExtendedError) => void) => {
    const token = socket.handshake.auth.token as string; // Get token from handshake auth

    if (!token) {
        console.warn('Chat Service Auth: No token provided in handshake');
        return next(new Error('Authentication token required'));
    }

    try {
        const JWT_SECRET = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, JWT_SECRET as string) as { userId: number };

        socket.userId = decoded.userId;
        console.log(`Chat Service Auth: User ${decoded.userId} authenticated for socket ${socket.id}`);
        next(); 
    } catch (error) {
        console.error('Chat Service Auth: Invalid or expired token', error);
        return next(new Error('Invalid or expired token'));
    }
};