import React, { useState, useEffect, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-dark.css';
import { getJournalEntries, deleteJournalEntry } from '../utils/api';
import { Link } from 'react-router-dom';
import Input from './Input';
import { FaShareSquare } from 'react-icons/fa'; // Icon for the share button
import ShareJournalModal from './ShareJournalModal'; 

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedJournalId, setSelectedJournalId] = useState<number | null>(null);

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

  const handleOpenShareModal = (journalId: number) => {
    setSelectedJournalId(journalId);
    setIsShareModalOpen(true);
  };

  return (
    <> 
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
                  className="group mb-4 p-4 bg-matrix-gray rounded-lg animate-fadeIn hover:bg-matrix-green-dark relative w-full flex items-center justify-between"
                >
                  <Link to={`/journal/${journal.journal_id}`} className="block w-full overflow-hidden">
                    <p className="truncate">{journal.content}</p>
                    <p className="text-sm text-matrix-green-dark group-hover:text-matrix-green mt-2">
                      Created: {new Date(journal.created_at).toLocaleString()}
                    </p>
                  </Link>
                  <div className="flex items-center space-x-2 pl-4">
                    {/* --- NEW SHARE BUTTON --- */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenShareModal(journal.journal_id);
                      }}
                      className="text-gray-400 hover:text-green-400 transition-opacity duration-300 z-10"
                      title="Share Entry"
                    >
                      <FaShareSquare size={18} />
                    </button>
                    {/* --- Existing Delete Button --- */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(journal.journal_id);
                      }}
                      className="text-gray-400 hover:text-red-600 font-bold transition-opacity duration-300 z-10"
                      title="Delete Entry"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <ShareJournalModal
        journalId={selectedJournalId}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
};

export default JournalList;
