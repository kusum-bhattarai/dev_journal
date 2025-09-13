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

// Mock JournalDetail and JournalEntry to avoid react-markdown issues
jest.mock('../pages/JournalDetail', () => () => <div>Mock JournalDetail</div>);
jest.mock('../components/JournalEntry', () => () => <div>Mock JournalEntry</div>);

// Mock useAuth
jest.mock('../utils/auth', () => ({
  ...jest.requireActual('../utils/auth'),
  useAuth: jest.fn(),
}));

// Mock useSearchParams and useNavigate for AuthCallbackPage
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
  useNavigate: jest.fn(),
}));

import { useAuth } from '../utils/auth';
import { useSearchParams, useNavigate } from 'react-router-dom';

describe('App', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('renders welcome message on home page when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      token: 'mock-token',
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/𝕎𝕖𝕝𝕔𝕠𝕞𝕖 𝕥𝕠 𝕥𝕙𝕖 𝕄𝕒𝕥𝕣𝕚𝕩/i)).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      token: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
  });
  
  test('renders login page without redirect when not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      token: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
  });

  test('renders auth callback page', () => {
    (useAuth as jest.Mock).mockReturnValue({
      token: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    (useSearchParams as jest.Mock).mockReturnValue([new URLSearchParams({ token: 'test-token' }), jest.fn()]);
    (useNavigate as jest.Mock).mockReturnValue(jest.fn());

    render(
      <MemoryRouter initialEntries={['/auth/callback?token=test-token']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Authenticating/i)).toBeInTheDocument();
  });
});