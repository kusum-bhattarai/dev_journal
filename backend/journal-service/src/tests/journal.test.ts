import request from 'supertest';
import app from '../index'; 
import db from '../db'; 
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Mock the entire db module
jest.mock('../db', () => ({
  query: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

// Mock axios
jest.mock('axios');

const mockedDbQuery = db.query as jest.Mock;
const mockedJwtVerify = jwt.verify as jest.Mock;
const mockedAxiosPost = axios.post as jest.Mock;

describe('Journal Service API', () => {
  const mockUserId = 1;
  const token = 'fake-token';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock a successful token verification for all authenticated routes
    mockedJwtVerify.mockReturnValue({ userId: mockUserId });
  });

  describe('GET /api/journals', () => {
    it('should return all journals for a user', async () => {
      const mockJournals = [{ id: 1, content: 'My first journal' }];
      mockedDbQuery.mockResolvedValue({ rows: mockJournals });

      const res = await request(app)
        .get('/api/journals')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockJournals);
      expect(mockedDbQuery).toHaveBeenCalled();
    });
  });

  describe('POST /api/journals', () => {
    it('should create a new journal entry', async () => {
      const newJournal = { content: 'A new adventure' };
      const createdJournal = { id: 2, user_id: mockUserId, ...newJournal };
      mockedDbQuery.mockResolvedValue({ rows: [createdJournal] });

      const res = await request(app)
        .post('/api/journals')
        .set('Authorization', `Bearer ${token}`)
        .send(newJournal);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(createdJournal);
    });

    it('should return 400 if content is empty', async () => {
      const res = await request(app)
        .post('/api/journals')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Content cannot be empty');
    });
  });

  describe('GET /api/journals/:id', () => {
    it('should return a single journal if user is authorized', async () => {
      const journal = { id: 1, user_id: mockUserId, content: 'Secret content' };
      mockedDbQuery.mockResolvedValue({ rows: [journal] });

      const res = await request(app)
        .get('/api/journals/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(journal);
    });

    it('should return 404 if journal not found or user not authorized', async () => {
      mockedDbQuery.mockResolvedValue({ rows: [] }); // Simulate no journal found

      const res = await request(app)
        .get('/api/journals/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PUT /api/journals/:id', () => {
    it('should update a journal if user has permission', async () => {
        const updatedContent = { content: 'Updated thoughts' };
        const updatedJournal = { id: 1, user_id: mockUserId, ...updatedContent };
        mockedDbQuery.mockResolvedValue({ rows: [updatedJournal] });

        const res = await request(app)
            .put('/api/journals/1')
            .set('Authorization', `Bearer ${token}`)
            .send(updatedContent);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(updatedJournal);
    });

    it('should return 404 if trying to update a non-existent or unauthorized journal', async () => {
        mockedDbQuery.mockResolvedValue({ rows: [] });

        const res = await request(app)
            .put('/api/journals/999')
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Trying to update' });
        
        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toBe('Journal entry not found or user not authorized to edit');
    });
  });

  describe('DELETE /api/journals/:id', () => {
    it('should delete a journal if user is the owner', async () => {
      mockedDbQuery.mockResolvedValue({ rowCount: 1 }); // Simulate successful deletion

      const res = await request(app)
        .delete('/api/journals/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Journal entry deleted successfully');
    });

    it('should return 404 if journal to delete is not found or user is not owner', async () => {
      mockedDbQuery.mockResolvedValue({ rowCount: 0 }); // Simulate no rows deleted

      const res = await request(app)
        .delete('/api/journals/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('POST /api/journals/:id/share', () => {
    it('should share a journal successfully and notify chat service', async () => {
        // Mock the owner check
        mockedDbQuery.mockResolvedValueOnce({ rows: [{ user_id: mockUserId, owner_username: 'testowner' }] });
        // Mock the collaboration insert
        const mockCollaboration = { journal_id: 1, user_id: 2, permission: 'viewer' };
        mockedDbQuery.mockResolvedValueOnce({ rows: [mockCollaboration] });
        // Mock the axios call
        mockedAxiosPost.mockResolvedValue({ status: 200 });

        const res = await request(app)
            .post('/api/journals/1/share')
            .set('Authorization', `Bearer ${token}`)
            .send({ collaboratorId: 2, permission: 'viewer' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('Journal shared successfully');
        expect(res.body.collaboration).toEqual(mockCollaboration);
        expect(mockedAxiosPost).toHaveBeenCalled();
    });

    it('should return 403 if user is not the owner', async () => {
        // Mock the owner check to return a different owner
        mockedDbQuery.mockResolvedValueOnce({ rows: [{ user_id: 999 }] });

        const res = await request(app)
            .post('/api/journals/1/share')
            .set('Authorization', `Bearer ${token}`)
            .send({ collaboratorId: 2, permission: 'viewer' });
        
        expect(res.statusCode).toEqual(403);
    });
  });
});