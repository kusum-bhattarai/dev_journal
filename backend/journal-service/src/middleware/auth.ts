import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    
    // Attach the user to res.locals instead of req.user
    res.locals.user = { id: decoded.userId };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};