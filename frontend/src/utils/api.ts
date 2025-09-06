import axios from 'axios';
import { Conversation } from '../types';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
});

const journalApi = axios.create({
    baseURL: 'http://localhost:3002/api',
});

// Chat API instance for chat-service
const chatApi = axios.create({
    baseURL: 'http://localhost:3003',
});

// single interceptor for both instances
const addAuthToken = (config: any) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

api.interceptors.request.use(addAuthToken);
journalApi.interceptors.request.use(addAuthToken);
chatApi.interceptors.request.use(addAuthToken);

export const getJournalEntries = async () => {
  const response = await journalApi.get('/journals');
  return response.data;
};

export const getJournalEntry = async (id: number) => {
  const response = await journalApi.get(`/journals/${id}`, {
    headers: { 'Cache-Control': 'no-cache' }
  });
  return response.data;
};

export const createJournalEntry = async (content: string) => {
  const response = await journalApi.post('/journals', { content });
  return response.data;
};

export const updateJournalEntry = async (id: number, content: string) => {
  const response = await journalApi.put(`/journals/${id}`, { content });
  return response.data;
};

export const deleteJournalEntry = async (journalId: number) => {
  const response = await journalApi.delete(`/journals/${journalId}`);
  return response.data;
};

export const searchUsers = async (query: string) => {
  const response = await api.get(`/users?search=${encodeURIComponent(query)}`);
  return response.data.map((user: any) => ({
    user_id: user.user_id,
    username: user.username,
  })); 
};

export const createConversation = async (user1Id: number, user2Id: number) => {
    const response = await chatApi.post('/conversations', { user1Id, user2Id });
    return response.data;
};

export const getConversations = async (): Promise<Conversation[]> => {
    const response = await chatApi.get('/conversations');
    return response.data;
};

export default api;
export { addAuthToken };