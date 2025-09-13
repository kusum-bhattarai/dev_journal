import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Prism from 'prismjs';
import 'prismjs/themes/prism-dark.css';
import { debounce } from 'lodash';
import Button from '../components/Button';
import Input from '../components/Input';
import { getJournalEntry, updateJournalEntry } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../utils/auth';
import io, { Socket } from 'socket.io-client';

interface Journal {
  journal_id: number;
  content: string;
  created_at: string;
  permission: 'viewer' | 'editor';
}

const JournalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [journal, setJournal] = React.useState<Journal | null>(null);
  const [content, setContent] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const socketRef = React.useRef<Socket | null>(null);

  React.useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getJournalEntry(Number(id));
        setJournal(data);
        setContent(data.content);
      } catch (err) {
        setError('Failed to load entry. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchEntry();
  }, [id]);

  React.useEffect(() => {
    if (!token || !id) return;

    if (!socketRef.current) {
      const socket = io('http://localhost:3003', {
        auth: { token },
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log(`Socket connected: ${socket.id}`);
        socket.emit('joinJournal', Number(id));
      });

      socket.on('journalUpdate', (data: { content: string }) => {
        setContent(data.content);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });
    }

    return () => {
      if (socketRef.current) {
        console.log('Component unmounting: Disconnecting socket.');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [id, token]);


  React.useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.style.setProperty('height', 'auto');
      textareaRef.current?.style.setProperty('height', `${textareaRef.current.scrollHeight}px`);
    } else {
      // We still use Prism to highlight code blocks within the rendered markdown
      Prism.highlightAll();
    }
  }, [content, isEditing]);

  const emitEdit = React.useCallback(
    debounce((newContent: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('journalEdit', {
          journalId: Number(id),
          content: newContent,
          token: token,
        });
      }
    }, 500),
    [id, token]
  );

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    emitEdit(newContent);
  };

  const handleUpdate = async () => {
    if (!content.trim()) {
      setError('Entry cannot be empty.');
      return;
    }
    setError(null);
    try {
      await updateJournalEntry(Number(id), content);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save final changes.');
    }
  };

  if (loading) return <p className="text-center">Loading entry...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (!journal) return <p className="text-center">Entry not found.</p>;
  
  const canEdit = journal.permission === 'editor';

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
              onChange={(e) => handleContentChange(e.target.value)}
              className="h-auto overflow-hidden mb-4"
              readOnly={!canEdit}
            />
            {canEdit && (
              <>
                <Button onClick={handleUpdate}>Save Changes</Button>
                <Button onClick={() => setIsEditing(false)} className="ml-2">Cancel</Button>
              </>
            )}
          </>
        ) : (
          <>
            {/* --- UPDATED MARKDOWN RENDERING --- */}
            <div className="p-4 prose prose-invert prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
            {canEdit && <Button onClick={() => setIsEditing(true)}>Edit</Button>}
          </>
        )}
      </div>
      <Button onClick={() => navigate('/journal')} className="mt-4">Back to List</Button>
    </div>
  );
};

export default JournalDetail;