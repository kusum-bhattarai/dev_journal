import React, { useState, useEffect, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-dark.css';
import { getJournalEntries, deleteJournalEntry } from '../utils/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface Journal {
  journal_id: number;
  content: string;
  created_at: string;
}

const JournalList: React.FC = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
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
    // This will re-run Prism highlighting whenever the journal list changes
    Prism.highlightAll();
  }, [journals]);

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
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <div className="max-w-md w-full">
        {journals.length === 0 ? (
          <p className="text-center">No entries yet. Start logging your thoughts on the Home page!</p>
        ) : (
          journals.map((journal) => (
            <Dialog key={journal.journal_id}>
              <DialogTrigger asChild>
                <div className="group mb-4 p-4 bg-matrix-gray rounded-lg animate-fadeIn cursor-pointer hover:bg-matrix-green-dark relative">
                  <p className="truncate">{journal.content}</p>
                  <p className="text-sm text-matrix-green-dark group-hover:text-matrix-green mt-2">
                    Created: {new Date(journal.created_at).toLocaleString()}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(journal.journal_id);
                    }}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Entry"
                  >
                    &times;
                  </button>
                </div>
              </DialogTrigger>

              <DialogContent className="bg-matrix-gray border-matrix-green text-matrix-green max-w-4xl w-full h-[80vh] flex flex-col p-6">
                <DialogHeader>
                  <DialogTitle>Entry - {new Date(journal.created_at).toLocaleDateString()}</DialogTitle>
                </DialogHeader>
                <div className="bg-matrix-black p-4 rounded mt-4 flex-grow overflow-y-auto overflow-x-hidden">
                  <pre 
                    className="language-markdown h-full whitespace-pre-wrap break-words"
                    style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                  >
                    <code className="h-full block">
                      {journal.content}
                    </code>
                  </pre>
                </div>
              </DialogContent>
            </Dialog>
          ))
        )}
      </div>
    </div>
  );
};

export default JournalList;