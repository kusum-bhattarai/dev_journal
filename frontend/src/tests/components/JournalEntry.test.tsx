import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import JournalEntry from '../../components/JournalEntry';
import * as api from '../../utils/api';

// Mock Prism
jest.mock('prismjs', () => ({
  highlightAll: jest.fn(),
}));

// Mock api
jest.mock('../../utils/api', () => ({
  createJournalEntry: jest.fn(),
}));

describe('JournalEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders journal entry form', () => {
    render(
      <MemoryRouter>
        <JournalEntry />
      </MemoryRouter>
    );

    expect(screen.getByText(/Log your thoughts/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your thoughts/i)).toBeInTheDocument();
    expect(screen.getByText(/Preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Commit Entry/i)).toBeInTheDocument();
  });

  test('shows error for empty content', async () => {
    render(
      <MemoryRouter>
        <JournalEntry />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Commit Entry/i));
    expect(await screen.findByText(/Journal entry cannot be empty/i)).toBeInTheDocument();
  });

  test('toggles preview mode', async () => {
    render(
      <MemoryRouter>
        <JournalEntry />
      </MemoryRouter>
    );

    const previewButton = screen.getByText(/Preview/i);
    fireEvent.change(screen.getByPlaceholderText(/Enter your thoughts/i), {
      target: { value: 'Test content' },
    });
    fireEvent.click(previewButton);

    expect(await screen.findByTestId('markdown-preview')).toHaveTextContent(/Test content/i);
    expect(screen.getByText(/Edit/i)).toBeInTheDocument();
  });

  test('submits journal entry successfully', async () => {
    (api.createJournalEntry as jest.Mock).mockResolvedValue({});
    const navigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(navigate);

    render(
      <MemoryRouter>
        <JournalEntry />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your thoughts/i), {
      target: { value: 'Test content' },
    });
    fireEvent.click(screen.getByText(/Commit Entry/i));

    await waitFor(() => {
      expect(api.createJournalEntry).toHaveBeenCalledWith('Test content');
      expect(navigate).toHaveBeenCalledWith('/journal');
    });
  });
});