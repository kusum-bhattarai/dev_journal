import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Prism from 'prismjs';
import 'prismjs/themes/prism-dark.css';
import Button from '../components/Button';
import Input from '../components/Input';
import { getJournalEntry, updateJournalEntry } from '../utils/api';
import { simpleMarkdown } from '../utils/markdown'; // Assume utils/markdown.ts

interface Journal {
  journal_id: number;
  content: string;
  created_at: string;
}

const JournalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getJournalEntry(Number(id));
        setJournal(data);
        setContent(data.content);
      } catch (err) {
        setError('Failed to load entry. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEntry();
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    } else {
      Prism.highlightAll();
    }
  }, [content, isEditing]);

  const handleUpdate = async () => {
    if (!content.trim()) {
      setError('Entry cannot be empty.');
      return;
    }
    setError(null);
    try {
      await updateJournalEntry(Number(id), content);
      setIsEditing(false);
      navigate('/journal');
    } catch (err) {
      setError('Failed to update.');
      console.error(err);
    }
  };

  if (loading) return <p className="text-center">Loading entry...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (!journal) return <p className="text-center">Entry not found.</p>;

  return (
    <div className="min-h-screen bg-matrix-black text-matrix-green font-mono p-6 flex flex-col items-center">
      <h1 className="text-4xl mb-6 animate-glitch">Journal Entry</h1>
      <p className="text-sm mb-4">Created: {new Date(journal.created_at).toLocaleString()}</p>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="max-w-xl w-full border border-matrix-green p-4 rounded-lg bg-matrix-gray shadow-lg animate-fadeIn">
        {isEditing ? (
          <>
            <Input
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-auto overflow-hidden mb-4"
            />
            <Button onClick={handleUpdate}>Save Changes</Button>
            <Button onClick={() => setIsEditing(false)} className="ml-2">Cancel</Button>
          </>
        ) : (
          <>
            <div className="p-4 prose prose-invert prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: simpleMarkdown(content) }} />
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          </>
        )}
      </div>
      <Button onClick={() => navigate('/journal')} className="mt-4">Back to List</Button>
    </div>
  );
};

export default JournalDetail;