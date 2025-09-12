import React, { useState, useEffect, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-dark.css';
import { getJournalEntries, deleteJournalEntry } from '../utils/api';
import { Link } from 'react-router-dom';
import Input from './Input';

interface Journal {
  journal_id: number;
  content: string;
  created_at: string;
}

const JournalList: React.FC = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [filteredJournals, setFilteredJournals] = useState<Journal[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchJournals = useCallback(async () => {
    try {
      const data = await getJournalEntries();
      setJournals(data);
      setFilteredJournals(data);
    } catch (error) {
      setError('Error fetching journals.');
      console.error('Error fetching journals:', error);
    }
  }, []);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  useEffect(() => {
    Prism.highlightAll();
  }, [filteredJournals]);

  useEffect(() => {
    const lowerFilter = filter.toLowerCase();
    setFilteredJournals(
      journals.filter(j => j.content.toLowerCase().includes(lowerFilter))
    );
  }, [filter, journals]);

  const handleDelete = async (journalId: number) => {
    const originalJournals = [...journals];
    setJournals(journals.filter(j => j.journal_id !== journalId));
    try {
      await deleteJournalEntry(journalId);
    } catch (err) {
      setError('Failed to delete entry. Please refresh.');
      setJournals(originalJournals);
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-matrix-black text-matrix-green font-mono p-6 flex flex-col items-center">
      <h1 className="text-4xl mb-6 animate-glitch">Your Journal Entries</h1>

      <Link
        to="/"
        className="mb-8 bg-matrix-gray px-4 py-2 rounded-lg hover:bg-matrix-green-dark transition-colors"
      >
        &larr; Home
      </Link>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <Input
        placeholder="Filter entries..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 max-w-lg w-full"
        aria-label="Filter journals"
      />
      <div className="w-full max-w-lg mx-auto">
        <div className="h-[60vh] w-full overflow-y-auto border border-matrix-green rounded-lg p-4">
          {filteredJournals.length === 0 ? (
            <p className="text-center">No entries yet. Start logging your thoughts on the Home page!</p>
          ) : (
            filteredJournals.map((journal) => (
              <div
                key={journal.journal_id}
                className="group mb-4 p-4 bg-matrix-gray rounded-lg animate-fadeIn cursor-pointer hover:bg-matrix-green-dark relative w-full"
              >
                <Link to={`/journal/${journal.journal_id}`} className="block w-full overflow-hidden">
                  <p className="truncate">{journal.content}</p>
                  <p className="text-sm text-matrix-green-dark group-hover:text-matrix-green mt-2">
                    Created: {new Date(journal.created_at).toLocaleString()}
                  </p>
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(journal.journal_id);
                  }}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-auto"
                  title="Delete Entry"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalList;