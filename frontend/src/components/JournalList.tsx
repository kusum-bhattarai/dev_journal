import React, { useState, useEffect, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-dark.css';
import axios from 'axios';

const JournalList = ({ userId }: { userId: string }) => {
  const [journals, setJournals] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);

  const fetchJournals = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:3002/api/journals/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setJournals(res.data);
    } catch (error) {
      console.error('Error fetching journals:', error);
    }
  }, [userId]);

  useEffect(() => {
    Prism.highlightAll();
    fetchJournals();
  }, [fetchJournals]);

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
              <h2 className="text-lg">{journal.title || `Entry ${journal.journal_id}`}</h2>
              <p className="text-sm text-matrix-green">Created: {new Date(journal.created_at).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
      {selectedJournal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-matrix-gray p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl mb-4">{selectedJournal.title || `Entry ${selectedJournal.journal_id}`}</h2>
            <pre>
              <code className="language-markdown">{selectedJournal.content}</code>
            </pre>
            <p className="text-sm text-matrix-green mt-2">Created: {new Date(selectedJournal.created_at).toLocaleString()}</p>
            <button
              className="mt-4 bg-matrix-green text-matrix-black px-4 py-1 rounded hover:bg-green-500"
              onClick={() => setSelectedJournal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalList;