import React, { useState, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-dark.css';
import Button from './Button';
import Input from './Input';
import { useNavigate } from 'react-router-dom';
import { createJournalEntry } from '../utils/api';

function simpleMarkdown(mdText: string) {
  mdText = mdText.replace(/\r\n/g, '\n')
  mdText = mdText.replace(/\n~~~ *(.*?)\n([\s\S]*?)\n~~~/g, '<pre><code title="$1">$2</code></pre>')
  mdText = mdText.replace(/\n``` *(.*?)\n([\s\S]*?)\n```/g, '<pre><code title="$1">$2</code></pre>')
  var mdHTML = ''
  var mdCode = mdText.split('pre>')
  for (var i=0; i<mdCode.length; i++) {
    if (mdCode[i].substr(-2) == '</') {
      mdHTML += '<pre>' + mdCode[i] + 'pre>'
    } else {
      mdHTML += mdCode[i].replace(/(.*)<$/, '$1')
        .replace(/^##### (.*?)\s*#*$/gm, '<h5>$1</h5>')
        .replace(/^#### (.*?)\s*#*$/gm, '<h4 id="$1">$1</h4>')
        .replace(/^### (.*?)\s*#*$/gm, '<h3 id="$1">$1</h3>')
        .replace(/^## (.*?)\s*#*$/gm, '<h2 id="$1">$1</h2>')
        .replace(/^# (.*?)\s*#*$/gm, '<h1 id="$1">$1</h1>')    
        .replace(/^-{3,}|^\_{3,}|^\*{3,}/gm, '<hr/>')    
        .replace(/``(.*?)``/gm, '<code>$1</code>')
        .replace(/`(.*?)`/gm, '<code>$1</code>')
        .replace(/^\>> (.*$)/gm, '<blockquote><blockquote>$1</blockquote></blockquote>')
        .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')
        .replace(/<\/blockquote\>\n<blockquote\>/g, '\n<br>')
        .replace(/<\/blockquote\>\n<br\><blockquote\>/g, '\n<br>')
        .replace(/!\[(.*?)\]\((.*?) "(.*?)"\)/gm, '<img alt="$1" src="$2" $3 />')
        .replace(/!\[(.*?)\]\((.*?)\)/gm, '<img alt="$1" src="$2" />')
        .replace(/\[(.*?)\]\((.*?) "(.*?)"\)/gm, '<a href="$2" title="$3">$1</a>')
        .replace(/<http(.*?)\>/gm, '<a href="http$1">http$1</a>')
        .replace(/\[(.*?)\]\(\)/gm, '<a href="$1">$1</a>')
        .replace(/\[(.*?)\]\((.*?)\)/gm, '<a href="$2">$1</a>')
        .replace(/^[\*|+|-][ |.](.*)/gm, '<ul><li>$1</li></ul>').replace(/<\/ul\>\n<ul\>/g, '\n')
        .replace(/^\d[ |.](.*)/gm, '<ol><li>$1</li></ol>').replace(/<\/ol\>\n<ol\>/g, '\n')
        .replace(/\*\*\*(.*)\*\*\*/gm, '<b><em>$1</em></b>')
        .replace(/\*\*(.*)\*\*/gm, '<b>$1</b>')
        .replace(/\*([\w \d]*)\*/gm, '<em>$1</em>')
        .replace(/___(.*)___/gm, '<b><em>$1</em></b>')
        .replace(/__(.*)__/gm, '<u>$1</u>')
        .replace(/_([\w \d]*)_/gm, '<em>$1</em>')
        .replace(/~~(.*)~~/gm, '<del>$1</del>')
        .replace(/\^\^(.*)\^\^/gm, '<ins>$1</ins>')
        .replace(/ +\n/g, '\n<br/>')
        .replace(/\n\s*\n/g, '\n<p>\n')
        .replace(/^ {4,10}(.*)/gm, '<pre><code>$1</code></pre>')
        .replace(/^\t(.*)/gm, '<pre><code>$1</code></pre>')
        .replace(/<\/code\><\/pre\>\n<pre\><code\>/g, '\n')
        .replace(/\\([`_\\*{}|#+\-.!])/gm, '$1')
    }
  }
  return mdHTML
}

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

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    if (isPreview) {
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
          <div className="mt-4 p-4 bg-matrix-gray border border-matrix-green rounded-lg prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: simpleMarkdown(content) }} />
        )}
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