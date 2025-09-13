import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../utils/auth';

// Mock socket.io-client (used in JournalDetail.tsx)
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
  Socket: jest.fn(),
}));

// Mock JournalDetail to avoid react-markdown import issues
jest.mock('../pages/JournalDetail', () => () => <div>Mock JournalDetail</div>);

// Mock JournalEntry to avoid react-markdown import issues
jest.mock('../components/JournalEntry', () => () => <div>Mock JournalEntry</div>);

// Mock useAuth
jest.mock('../utils/auth', () => ({
  ...jest.requireActual('../utils/auth'),
  useAuth: () => ({
    token: 'mock-token',
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

test('renders welcome message on home page', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
  // Match the exact stylized text from Home.tsx
  const welcomeMessage = screen.getByText(/𝕎𝕖𝕝𝕔𝕠𝕞𝕖 𝕥𝕠 𝕥𝕙𝕖 𝕄𝕒𝕥𝕣𝕚𝕩/i);
  expect(welcomeMessage).toBeInTheDocument();
});