import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import Input from './Input';
import Button from './Button';
import { searchUsers } from '../utils/api';

interface User {
  user_id: number;
  username: string;
  email: string;
}

interface ChatWindowProps {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const ChatWindow = ({ isChatOpen, setIsChatOpen }: ChatWindowProps) => {
    const { token } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (searchQuery) {
        timeoutId = setTimeout(async () => {
            try {
            const results = await searchUsers(searchQuery);
            setSearchResults(results);
            if (results.length === 1) setSelectedUserId(results[0].user_id);
            } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
            }
        }, 300); // Debounce 300ms
        } else {
        setSearchResults([]);
        setSelectedUserId(null);
        }
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);


    if (!isChatOpen) return null;

    return (
        <div className="fixed right-6 top-28 w-92 h-96 bg-matrix-gray text-matrix-green font-mono shadow-lg rounded-lg p-4 z-40">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl">Chat</h2>
            <Button onClick={() => setIsChatOpen(false)} className="px-2 py-1">
            X
            </Button>
        </div>
        <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="mb-4 w-full border border-matrix-green rounded p-2"
        />
        {searchResults.length > 0 && (
        <ul className="bg-matrix-gray-dark border border-matrix-green rounded mt-1 max-h-40 overflow-y-auto">
          {searchResults.map((user, index) => (
            <li
              key={user.user_id}
              className={`p-2 cursor-pointer hover:bg-matrix-gray-dark ${index < searchResults.length - 1 ? 'border-b border-matrix-green' : ''}`}
              onClick={() => {
                setSelectedUserId(user.user_id);
                console.log(`Chat with ${user.username} starting in next step`);
              }}
            >
              {user.username}
            </li>
          ))}
        </ul>
        )}
        <div className="h-full overflow-y-auto">
            <p>Chat messages will appear here</p>
        </div>
        </div>
    );
};

export default ChatWindow;