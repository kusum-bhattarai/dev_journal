import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
});

const journalApi = axios.create({
    baseURL: 'http://localhost:3002/api',
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

export const getJournalEntries = async () => {
  const response = await journalApi.get('/journals');
  return response.data;
};

export const createJournalEntry = async (content: string) => {
  const response = await journalApi.post('/journals', { content });
  return response.data;
};

export const deleteJournalEntry = async (journalId: number) => {
  const response = await journalApi.delete(`/journals/${journalId}`);
  return response.data;
};

export default api;