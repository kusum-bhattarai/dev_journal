import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShareJournalModal from '../../components/ShareJournalModal';
import * as api from '../../utils/api';
import * as ToastHook from '../../hooks/use-toast';
import { User } from '../../types';

// Mock the API functions
jest.mock('../../utils/api', () => ({
  searchUsers: jest.fn(),
  shareJournalEntry: jest.fn(),
}));

// Mock the useToast hook
jest.mock('../../hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

const mockUsers: User[] = [
  { user_id: 1, username: 'neo', email: 'neo@matrix.com' },
  { user_id: 2, username: 'trinity', email: 'trinity@matrix.com' },
];

describe('ShareJournalModal', () => {
  let mockToast: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockToast = jest.fn();
    (ToastHook.useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (api.searchUsers as jest.Mock).mockResolvedValue(mockUsers);
    (api.shareJournalEntry as jest.Mock).mockResolvedValue({ success: true });
    // Use fake timers to control the debounce timeout in the component
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function searchAndSelectUser(username: 'neo' | 'trinity') {
    const searchInput = screen.getByPlaceholderText(/Search by username or email/i);
    userEvent.type(searchInput, username.substring(0, 2)); // Type first few letters

    // Fast-forward timers to trigger the debounced search
    await act(async () => {
      jest.runAllTimers();
    });

    // Get a handle on an element we expect to disappear
    const otherUser = username === 'neo' ? 'trinity' : 'neo';
    const resultThatWillDisappear = await screen.findByText(otherUser);

    const userToClick = await screen.findByText(username);
    await userEvent.click(userToClick);
    // This confirms the component has fully processed the user selection.
    await waitFor(() => {
      expect(resultThatWillDisappear).not.toBeInTheDocument();
    });
  }

  test('searches for users, allows selection, and updates UI correctly', async () => {
    render(<ShareJournalModal journalId={101} isOpen={true} onClose={jest.fn()} />);
    
    await searchAndSelectUser('neo');

    // Now that we've waited for the UI to settle, we can safely make our assertions.
    expect(screen.getByText('Permissions:')).toBeInTheDocument();
    const shareButton = screen.getByRole('button', { name: 'Share' });
    expect(shareButton).not.toBeDisabled();
  });

  test('calls shareJournalEntry with correct parameters and shows success toast', async () => {
    const mockOnClose = jest.fn();
    render(<ShareJournalModal journalId={101} isOpen={true} onClose={mockOnClose} />);

    await searchAndSelectUser('neo');
    
    const shareButton = screen.getByRole('button', { name: 'Share' });
    await userEvent.click(shareButton);

    await waitFor(() => {
      expect(api.shareJournalEntry).toHaveBeenCalledWith(101, 1, 'viewer');
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Journal Shared!',
      }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('handles API failure on share and shows error toast', async () => {
    (api.shareJournalEntry as jest.Mock).mockRejectedValue(new Error('API Error'));
    const mockOnClose = jest.fn();
    render(<ShareJournalModal journalId={101} isOpen={true} onClose={mockOnClose} />);

    await searchAndSelectUser('trinity');
    
    const shareButton = screen.getByRole('button', { name: 'Share' });
    await userEvent.click(shareButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Sharing Failed',
      }));
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});