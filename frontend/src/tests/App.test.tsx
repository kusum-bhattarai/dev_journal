import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider, useAuth } from '../utils/auth';

// Mock logged-in state
jest.mock('../utils/auth', () => ({
  ...jest.requireActual('../utils/auth'),
  useAuth: () => ({
    token: 'mock-token', // Provide a mock token
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

test('renders welcome message on home page', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
  const welcomeMessage = screen.getByText(/Welcome to DevJournal/i);
  expect(welcomeMessage).toBeInTheDocument();
});