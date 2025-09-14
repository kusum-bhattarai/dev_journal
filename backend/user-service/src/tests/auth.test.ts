import { Express } from 'express';
import request from 'supertest';
import { Pool } from 'pg';
import bcrypt from 'bcrypt'; 
import jwt from 'jsonwebtoken';
import passport from 'passport';

// Mock the Pool from 'pg' so we don't need a real database
jest.mock('pg', () => {
  const mPool = { query: jest.fn() };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('bcrypt', () => ({
  ...jest.requireActual('bcrypt'),
  genSalt: jest.fn(() => Promise.resolve('somesalt')),
  hash: jest.fn(() => Promise.resolve('hashedpassword')),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  sign: jest.fn(() => 'test-jwt-token'),
}));

// Mock passport
jest.mock('passport', () => ({
  initialize: jest.fn(() => (req: any, res: any, next: any) => next()),
  use: jest.fn(),
  authenticate: jest.fn(),
}));

let app: Express;
let mockPool: jest.Mocked<Pool>;

import appModule from '../index';
app = appModule;

describe('User Service API', () => {
  beforeEach(() => {
    // Before each test, get a fresh instance of the mocked pool
    // and clear all mock function history
    mockPool = new Pool() as jest.Mocked<Pool>;
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); 
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ user_id: 1, username: 'testuser', email: 'test@example.com' }] });

      const response = await request(app)
        .post('/auth/register')
        .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body.user).toEqual({ user_id: 1, username: 'testuser', email: 'test@example.com' });
    });

    it('should return 409 if user exists', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const response = await request(app)
        .post('/auth/register')
        .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });
      expect(response.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully and return a token', async () => {
        const user = { user_id: 1, email: 'test@example.com', password: 'hashedpassword' };
        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [user] });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const response = await request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(response.status).toBe(200);
        expect(response.body.token).toBe('test-jwt-token');
    });

    it('should return 401 for invalid credentials', async () => {
        const user = { user_id: 1, email: 'test@example.com', password: 'hashedpassword' };
        (mockPool.query as jest.Mock).mockResolvedValue({ rows: [user] });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        const response = await request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'wrongpassword' });
        
        expect(response.status).toBe(401);
    });
  });

  describe('GitHub OAuth Endpoints', () => {
    const mockPassportAuth = (user: any, info: any) => {
        (passport.authenticate as jest.Mock).mockImplementation(
            (strategy, options, callback) => {
                return (req: any, res: any, next: any) => {
                    if (callback) {
                        callback(null, user, info);
                    }
                };
            }
        );
    };

    it('should redirect with a token on successful login', async () => {
        const mockUser = { user_id: 1, username: 'github-user' };
        mockPassportAuth(mockUser, { message: 'login-successful' });

        const response = await request(app).get('/auth/github/callback');
        
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('http://localhost:3000/auth/callback?token=test-jwt-token');
    });

    it('should redirect to login with "registered" status on successful registration', async () => {
        const mockUser = { user_id: 2, username: 'new-github-user' };
        mockPassportAuth(mockUser, { message: 'registration-successful' });

        const response = await request(app).get('/auth/github/callback');
        
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('http://localhost:3000/login?status=registered');
    });

    it('should redirect to login with "not-registered" status if user is not found', async () => {
        mockPassportAuth(false, { message: 'not-registered' });

        const response = await request(app).get('/auth/github/callback');
        
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('http://localhost:3000/login?status=not-registered');
    });
  });

  describe('GET /users', () => {
    it('should return a list of users matching the search query', async () => {
        // Arrange
        const mockUsers = [
            { user_id: 1, username: 'testuser', email: 'test@example.com' },
            { user_id: 2, username: 'another test', email: 'anothertest@example.com' },
        ];
        (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockUsers });
        const searchQuery = 'test';

        // Act
        const response = await request(app).get(`/users?search=${searchQuery}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUsers);
        expect(mockPool.query).toHaveBeenCalledWith(
            'SELECT user_id, username, email FROM users WHERE username ILIKE $1 OR email ILIKE $1',
            [`%${searchQuery}%`]
        );
    });
  });
});
