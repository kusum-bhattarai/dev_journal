import React, {useState, useEffect, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-dark.css';
import axios from 'axios';
import Button from './Button';
import Input from './Input';

const JournalEntry = ({userId}: {userId: string}) => {
    const [content, setContent] = useState('');
    const [journals, setJournals] = useState([]);

    const fetchJournals = useCallback(async () => {
        try {
            const res = await axios.get(`http://localhost:3002/api/journals/${userId}`,{
                headers: {Authorization: `Bearer ${localStorage.getItem('token')}`},
            });
            setJournals(res.data);
        } catch (error) {
            console.error ('Error fetching journals: ', error);
        }
    }, [userId]);

    useEffect(() => {
        Prism.highlightAll();
        fetchJournals();
    }, [fetchJournals]);

    const handleSubmit = async () => {
        try {
            await axios.post(
                'http://localhost:3002/api/journals',
                {userId, content},
                {headers: {Authorization: `Bearer ${localStorage.getItem('token')}`}}
            );
            setContent('');
            await fetchJournals();
        } catch(error) {
            console.error('Error creating journal:', error);
        }
    };

    return (
        <div className="min-h-screen bg-matrix-black text-matrix-green font-mono p-6">
            <h1 className="text-2xl mb-4 animate-glitch">DevJournal: Thoughts dump</h1>
            <div className="border border-matrix-green p-4 rounded-lg bg-matrix-gray shadow-lg animate-fadeIn">
                <Input
                    className="w-full bg-matrix-black text-matrix-green border-none outline-none p-3 resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your thoughts..."
                />
                <Button
                    className="mt-2 bg-matrix-green text-matrix-black px-4 py-2 rounded hover: bg-green-500 transition duration-300"
                    onClick={handleSubmit}
                >
                    Commit Entry
                </Button>
            </div>
            <div className="mt-6">
                {journals.map((journal: any) => (
                    <div key={journal.journal_id} className="mb-4 p-4 bg-matrix-gray rounded-lg animate-fadeIn">
                        <pre>
                            <code className="language-markdown">{journal.content}</code>
                        </pre>
                        <p className="text-sm text-matrix-green">Created: {new Date(journal.created_at).toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JournalEntry;