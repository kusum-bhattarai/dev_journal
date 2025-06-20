import React, { useState, useEffect, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-dark.css';
import { getJournalEntries, deleteJournalEntry } from '../utils/api';

interface Journal {
  journal_id: number;
  content: string;
  created_at: string;
}

const JournalList: React.FC = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchJournals = useCallback(async () => {
    try {
      const data = await getJournalEntries();
      setJournals(data);
    } catch (error) {
      setError('Error fetching journals.');
      console.error('Error fetching journals:', error);
    }
  }, []);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  useEffect(() => {
    if (selectedJournal) {
      Prism.highlightAll();
    }
  }, [selectedJournal]);

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
      <div className="max-w-md w-full">
        {journals.length === 0 ? (
          <p className="text-center">No entries yet. Start logging your thoughts on the Home page!</p>
        ) : (
          journals.map((journal: any) => (
            <div
              key={journal.journal_id}
              className="mb-4 p-4 bg-matrix-gray rounded-lg animate-fadeIn cursor-pointer hover:bg-matrix-gray-dark"
              onClick={() => setSelectedJournal(journal)}
            >
              <p className="truncate">{journal.content}</p>
              <p className="text-sm text-matrix-green mt-2">
                Created: {new Date(journal.created_at).toLocaleString()}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(journal.journal_id); }}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete Entry"
              >
                &times;
              </button>
            </div>
          ))
        )}
      </div>
      {selectedJournal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-matrix-gray p-6 rounded-lg max-w-2xl w-full border border-matrix-green">
            <h2 className="text-xl mb-4">{`Entry - ${new Date(selectedJournal.created_at).toLocaleDateString()}`}</h2>
            <pre className="bg-matrix-black p-4 rounded overflow-x-auto max-h-96">
              <code className="language-markdown">{selectedJournal.content}</code>
            </pre>
            <div className="text-center">
              <button
                className="mt-4 bg-matrix-green text-matrix-black px-4 py-1 rounded hover:bg-green-500"
                onClick={() => setSelectedJournal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalList;