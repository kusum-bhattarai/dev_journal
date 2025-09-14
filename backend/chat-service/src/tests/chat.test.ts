import 'dotenv/config';
import { Server as HttpServer } from 'http';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import request from 'supertest';
import { app, server, io } from '../index'; // Import app, server, and io
import db from '../db';
import jwt from 'jsonwebtoken';

// Mock the db module
jest.mock('../db', () => ({
  query: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

const mockedDbQuery = db.query as jest.Mock;
const mockedJwtVerify = jwt.verify as jest.Mock;

interface MessagePayload {
    message_id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
}

describe('Chat Service', () => {
  let clientSocket: ClientSocket;
  const mockUserId = 1;
  const mockOtherUserId = 2;
  const conversationId = 101;

  beforeAll((done) => {
    mockedJwtVerify.mockReturnValue({ userId: mockUserId });
    const httpServer = server as HttpServer;
    httpServer.listen(() => {
        const port = (httpServer.address() as any).port;
        clientSocket = ioc(`http://localhost:${port}`, {
            auth: { token: 'fake-token' },
        });
        clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    (server as HttpServer).close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('REST API', () => {
    it('POST /conversations should create a new conversation', async () => {
      mockedDbQuery
        .mockResolvedValueOnce({ rows: [{}, {}] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ conversation_id: conversationId }] });

      const res = await request(app)
        .post('/conversations')
        .send({ user1Id: mockUserId, user2Id: mockOtherUserId });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ conversation_id: conversationId });
    });

    it('GET /conversations should retrieve user conversations', async () => {
      global.atob = jest.fn().mockReturnValue(JSON.stringify({ userId: mockUserId }));
      const mockConversations = [{ conversation_id: conversationId, other_username: 'test' }];
      mockedDbQuery.mockResolvedValue({ rows: mockConversations });

      const res = await request(app)
        .get('/conversations')
        .set('Authorization', 'Bearer fake.token.data');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockConversations);
    });

    it('GET /messages/:conversationId should retrieve messages', async () => {
        global.atob = jest.fn().mockReturnValue(JSON.stringify({ userId: mockUserId }));
        const mockMessages = [{ message_id: 1, content: 'Hello!' }];
        mockedDbQuery
            .mockResolvedValueOnce({ rows: [{ id: conversationId }]})
            .mockResolvedValueOnce({ rows: mockMessages });

        const res = await request(app)
            .get(`/messages/${conversationId}`)
            .set('Authorization', 'Bearer fake.token.data');
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockMessages);
    });
  });

  describe('Socket.io Events', () => {
    it('should handle sendMessage event, save message, and broadcast it', (done) => {
      const messageData = { conversationId: String(conversationId), senderId: mockUserId, content: 'Hello from client' };
      const savedMessageShape = { 
        message_id: 123, 
        content: messageData.content,
      };

      mockedDbQuery
        .mockResolvedValueOnce({ rows: [{ user1_id: mockUserId, user2_id: mockOtherUserId }]})
        .mockResolvedValueOnce({ rows: [{ message_id: 123, timestamp: new Date(), read_status: false }]})
        .mockResolvedValueOnce({ rows: [] });

      // Listen for the broadcasted message
      clientSocket.on('receiveMessage', (msg: MessagePayload) => {
        expect(msg.content).toBe(messageData.content);
        done();
      });
      clientSocket.emit('joinRoom', String(conversationId));

      // emit the message from the client
      clientSocket.emit('sendMessage', messageData);
    });
  });
});