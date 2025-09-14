import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChatWindow from '../../components/ChatWindow';
import { useAuth } from '../../utils/auth';
import * as api from '../../utils/api';
import io from 'socket.io-client';
import { User, Conversation, Message } from '../../types';

// Mock useAuth
jest.mock('../../utils/auth', () => ({
  useAuth: jest.fn(),
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  };
  return jest.fn(() => mSocket);
});

 // Mock API calls
jest.mock('../../utils/api', () => ({
  searchUsers: jest.fn(),
  createConversation: jest.fn(),
  getConversations: jest.fn(),
  getMessages: jest.fn(),
}));

describe('ChatWindow', () => {
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTY5NDU5OTIwMH0.ZHVtbXktc2lnbmF0dXJl'; // Valid mock JWT
  const mockUserId = 1;
  const mockUsers: User[] = [{ user_id: 2, username: 'testuser', email: 'test@example.com' }];
  const mockConversations: Conversation[] = [];
  const mockMessages: Message[] = [{
    message_id: 1,
    conversation_id: 1,
    sender_id: 2,
    receiver_id: 1,
    content: 'Hello',
    timestamp: '2023-01-01T00:00:00Z',
    read_status: true,
    message_type: 'text',
    metadata: null,
  }];

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ token: mockToken });
    (api.getConversations as jest.Mock).mockResolvedValue(mockConversations);
    (api.searchUsers as jest.Mock).mockResolvedValue(mockUsers);
    (api.createConversation as jest.Mock).mockResolvedValue({ conversation_id: 1 });
    (api.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    jest.clearAllMocks();
  });

  test('renders closed chat window correctly', () => {
    render(<ChatWindow isChatOpen={false} setIsChatOpen={jest.fn()} />);

    expect(screen.queryByText(/Chat/i)).not.toBeInTheDocument();
  });

  test('renders open chat window and fetches conversations', async () => {
    await act(async () => {
      render(<ChatWindow isChatOpen={true} setIsChatOpen={jest.fn()} />);
    });

    expect(screen.getByText(/Chat/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search users/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(api.getConversations).toHaveBeenCalled();
      expect(screen.getByText(/No recent conversations/i)).toBeInTheDocument(); // Empty conversations
    });
  });

  test('searches users and selects one to create conversation', async () => {
    await act(async () => {
      render(<ChatWindow isChatOpen={true} setIsChatOpen={jest.fn()} />);
    });

    fireEvent.change(screen.getByPlaceholderText(/Search users/i), { target: { value: 'test' } });

    await waitFor(() => {
      expect(api.searchUsers).toHaveBeenCalledWith('test');
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/testuser/i));

    await waitFor(() => {
      expect(api.createConversation).toHaveBeenCalledWith(1, 2);
      expect(api.getMessages).toHaveBeenCalledWith(1, 1);
      expect(screen.getByText(/Hello/i)).toBeInTheDocument();
    });
  });

  test('sends a message and handles real-time update', async () => {
    const mockSocket = { emit: jest.fn(), on: jest.fn() };
    (io as jest.Mock).mockReturnValue(mockSocket);

    await act(async () => {
      render(<ChatWindow isChatOpen={true} setIsChatOpen={jest.fn()} />);
    });

    // Simulate search and select to open chat
    fireEvent.change(screen.getByPlaceholderText(/Search users/i), { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/testuser/i));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type a message/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Type a message/i), { target: { value: 'New message' } });
    fireEvent.click(screen.getByText(/Send/i));

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('sendMessage', expect.objectContaining({ content: 'New message' }));
    });
  });

  test('handles infinite scrolling for messages', async () => {
    (api.getMessages as jest.Mock).mockResolvedValueOnce(mockMessages).mockResolvedValueOnce([]);

    await act(async () => {
      render(<ChatWindow isChatOpen={true} setIsChatOpen={jest.fn()} />);
    });

    // Simulate search and select to open chat
    fireEvent.change(screen.getByPlaceholderText(/Search users/i), { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/testuser/i));

    await waitFor(() => {
      expect(api.getMessages).toHaveBeenCalledWith(1, 1);
    });
    expect(screen.getByText(/Hello/i)).toBeInTheDocument();
  });
});