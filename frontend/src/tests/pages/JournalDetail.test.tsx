import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JournalDetail from '../../pages/JournalDetail';
import * as api from '../../utils/api';
import { useAuth } from '../../utils/auth';

// Mock API calls
jest.mock('../../utils/api', () => ({
  getJournalEntry: jest.fn(),
  updateJournalEntry: jest.fn(),
}));

// Mock useAuth hook
jest.mock('../../utils/auth', () => ({
  useAuth: jest.fn(),
}));

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};
jest.mock('socket.io-client', () => jest.fn(() => mockSocket));

const mockJournalEditor = {
  journal_id: 1,
  content: '# Hello World\n\nThis is a test entry.',
  created_at: '2023-01-01T12:00:00Z',
  permission: 'editor' as const,
};

const mockJournalViewer = {
  ...mockJournalEditor,
  permission: 'viewer' as const,
};

// Wrapper component to provide routing context
const renderWithRouter = (journal: any, shouldReject = false) => {
  if (shouldReject) {
    (api.getJournalEntry as jest.Mock).mockRejectedValue(new Error('Failed to load'));
  } else {
    (api.getJournalEntry as jest.Mock).mockResolvedValue(journal);
  }
  (useAuth as jest.Mock).mockReturnValue({ token: 'fake-token' });

  return render(
    <MemoryRouter initialEntries={['/journal/1']}>
      <Routes>
        <Route path="/journal/:id" element={<JournalDetail />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('JournalDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches and displays journal entry for a viewer', async () => {
    renderWithRouter(mockJournalViewer);

    // FIX: Assert on the raw markdown content due to the mock in setupTests.tsx
    expect(await screen.findByText(/# Hello World/)).toBeInTheDocument();
    expect(screen.getByText(/This is a test entry/)).toBeInTheDocument();
    
    expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
  });

  test('displays an "Edit" button for a user with editor permissions', async () => {
    renderWithRouter(mockJournalEditor);

    // FIX: Assert on the raw markdown content
    expect(await screen.findByText(/# Hello World/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
  });

  test('allows an editor to enter edit mode, change content, and save', async () => {
    (api.updateJournalEntry as jest.Mock).mockResolvedValue({});
    renderWithRouter(mockJournalEditor);

    const editButton = await screen.findByRole('button', { name: /Edit/i });
    await userEvent.click(editButton);

    const textarea = await screen.findByRole('textbox');
    expect(textarea).toHaveValue(mockJournalEditor.content);

    await userEvent.clear(textarea);
    await userEvent.type(textarea, '## Updated Content');

    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(saveButton);

    // Wait for the API call to be made
    await waitFor(() => {
      expect(api.updateJournalEntry).toHaveBeenCalledWith(1, '## Updated Content');
    });

    // Wait for the component to exit edit mode and display the new content
    await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
    expect(await screen.findByText(/## Updated Content/)).toBeInTheDocument();
  });

  test('updates content in real-time via WebSocket event', async () => {
    renderWithRouter(mockJournalEditor);

    expect(await screen.findByText(/# Hello World/)).toBeInTheDocument();

    const journalUpdateCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'journalUpdate'
    )[1];
    
    // FIX: Wrap the state-updating callback in act() to avoid warnings
    act(() => {
      journalUpdateCallback({ content: '### Real-time Update!' });
    });

    expect(await screen.findByText(/### Real-time Update!/)).toBeInTheDocument();
    expect(screen.queryByText(/# Hello World/)).not.toBeInTheDocument();
  });

  test('shows an error message if fetching the journal fails', async () => {
    renderWithRouter(null, true);

    expect(await screen.findByText(/Failed to load entry. Please try again./i)).toBeInTheDocument();
  });
});