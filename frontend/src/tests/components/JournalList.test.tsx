import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JournalList from '../../components/JournalList';
import * as api from '../../utils/api';

// Mock API calls
jest.mock('../../utils/api', () => ({
  getJournalEntries: jest.fn(),
  deleteJournalEntry: jest.fn(),
}));

// Mock ShareJournalModal
jest.mock('../../components/ShareJournalModal', () => {
    return {
        __esModule: true,
        default: () => <div data-testid="share-modal">Mock Share Modal</div>,
    };
});


// Mock Input
jest.mock('../../components/Input', () => {
    const MockInput = React.forwardRef((props: any, ref: any) => <input data-testid="mock-input" {...props} ref={ref} />);
    return {
        __esModule: true,
        default: MockInput,
    };
});


// Mock FaShareSquare
jest.mock('react-icons/fa', () => ({
  FaShareSquare: () => <span data-testid="fa-share-square">Share</span>,
}));

// Mock Prism
jest.mock('prismjs', () => ({
  highlightAll: jest.fn(),
}));

interface Journal {
  journal_id: number;
  content: string;
  created_at: string;
}

describe('JournalList', () => {
  const mockJournals: Journal[] = [
    { journal_id: 1, content: 'Test entry 1', created_at: '2023-01-01T00:00:00Z' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.getJournalEntries as jest.Mock).mockResolvedValue(mockJournals);
  });

  test('renders journal list component', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <JournalList />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Your Journal Entries/i)).toBeInTheDocument();
      expect(screen.getByTestId('mock-input')).toBeInTheDocument();
      expect(screen.getByTestId('share-modal')).toBeInTheDocument();
    });
  });
});