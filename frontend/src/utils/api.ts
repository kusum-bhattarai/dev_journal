import axios from 'axios';
import { Conversation } from '../types';

// For user-service (authentication, user search, etc.)
export const userServiceApi = axios.create({
    baseURL: process.env.REACT_APP_USER_SERVICE_URL, 
});

// For journal-service (CRUD operations on journals)
export const journalServiceApi = axios.create({
    baseURL: process.env.REACT_APP_JOURNAL_SERVICE_URL, 
});

// For chat-service (conversations and messages)
export const chatServiceApi = axios.create({
    baseURL: process.env.REACT_APP_CHAT_SERVICE_URL, 
});

const addAuthToken = (config: any) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

userServiceApi.interceptors.request.use(addAuthToken);
journalServiceApi.interceptors.request.use(addAuthToken);
chatServiceApi.interceptors.request.use(addAuthToken);

// --- Journal Functions ---

export const getJournalEntries = async () => {
  const response = await journalServiceApi.get('/journals');
  return response.data;
};

export const getJournalEntry = async (id: number) => {
  const response = await journalServiceApi.get(`/journals/${id}`, {
    headers: { 'Cache-Control': 'no-cache' }
  });
  return response.data;
};

export const createJournalEntry = async (content: string) => {
  const response = await journalServiceApi.post('/journals', { content });
  return response.data;
};

export const updateJournalEntry = async (id: number, content: string) => {
  const response = await journalServiceApi.put(`/journals/${id}`, { content });
  return response.data;
};

export const deleteJournalEntry = async (journalId: number) => {
  const response = await journalServiceApi.delete(`/journals/${journalId}`);
  return response.data;
};

export const shareJournalEntry = async (journalId: number, collaboratorId: number, permission: 'viewer' | 'editor') => {
  const response = await journalServiceApi.post(`/journals/${journalId}/share`, {
    collaboratorId,
    permission,
  });
  return response.data;
};

// --- User Functions ---

export const searchUsers = async (query: string) => {
  const response = await userServiceApi.get(`/users?search=${encodeURIComponent(query)}`);
  return response.data.map((user: any) => ({
    user_id: user.user_id,
    username: user.username,
  }));
};

// --- Chat Functions ---

export const createConversation = async (user1Id: number, user2Id: number) => {
    const response = await chatServiceApi.post('/conversations', { user1Id, user2Id });
    return response.data;
};

export const getConversations = async (): Promise<Conversation[]> => {
    const response = await chatServiceApi.get('/conversations');
    return response.data;
};

export const getMessages = async (conversationId: number, page = 1) => {
  const response = await chatServiceApi.get(`/messages/${conversationId}?page=${page}`);
  const data = response.data;
  return Array.isArray(data) ? data : [];
};