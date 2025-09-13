import React, { useState, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-dark.css';
import Button from './Button';
import Input from './Input';
import { useNavigate } from 'react-router-dom';
import { createJournalEntry } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const JournalEntry: React.FC = () => {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
      await createJournalEntry(content);      
      // On success, navigate to the journal page
      navigate('/journal');
    } catch (err) {
      setError('Failed to save entry. Please try again.');
      console.error(err);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    if (isPreview) {
      // After markdown is rendered, tell Prism to highlight the code blocks
      Prism.highlightAll();
    }
  }, [isPreview, content]);

  return (
    <div className="min-h-screen bg-matrix-black text-matrix-green font-mono p-6 flex flex-col items-center">
      <h1 className="text-2xl mb-4 animate-glitch">Log your thoughts!</h1>
      <div className="max-w-xl w-full border border-matrix-green p-4 rounded-lg bg-matrix-gray shadow-lg animate-fadeIn">
        <Input
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your thoughts..."
          className="h-auto overflow-hidden"
        />
        <div className="flex justify-center mt-2">
          <Button onClick={() => setIsPreview(!isPreview)} aria-label={isPreview ? 'Edit' : 'Preview'} className="mr-2">
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
        </div>
        {isPreview && (
          <div className="mt-4 p-4 bg-matrix-gray border border-matrix-green rounded-lg prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        )}
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        <div className="flex justify-center mt-4">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Committing...' : 'Commit Entry'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JournalEntry;