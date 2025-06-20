import React, {useState, useEffect, useCallback } from 'react';
import 'prismjs/themes/prism-dark.css';
import Button from './Button';
import Input from './Input';
import { useNavigate } from 'react-router-dom';
import { createJournalEntry } from '../utils/api';

const JournalEntry: React.FC = () => {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;

    if (!content.trim()) {
      setError('Journal entry cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // The token is handled by the axios interceptor in api.ts
      await createJournalEntry(content);
      
      // On success, navigate to the journal page
      navigate('/journal');
    } catch (err) {
      setError('Failed to save entry. Please try again.');
      console.error(err);
      setIsSubmitting(false);
    }
  };


    return (
        <div className="min-h-screen bg-matrix-black text-matrix-green font-mono p-6 flex flex-col items-center">
            <h1 className="text-2xl mb-4 animate-glitch">Log your thoughts!</h1>
            <div className="max-w-md w-full border border-matrix-green p-4 rounded-lg bg-matrix-gray shadow-lg animate-fadeIn">
                <Input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your thoughts..."
                    className='h-48'
                />
                {error && <p className="text-red-500 text-center mt-2">{error}</p>}
                <div className="flex justify-center mt-4">
                <Button onClick={handleSubmit} className={isSubmitting ? 'opacity-50' : ''}>
                    {isSubmitting ? 'Committing...' : 'Commit Entry'}
                </Button>
                </div>
            </div>
        </div>
    );
};

export default JournalEntry;