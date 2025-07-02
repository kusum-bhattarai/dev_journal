import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../utils/auth';
import Input from './Input';
import Button from './Button';
import { searchUsers, createConversation } from '../utils/api';
import io, { Socket } from 'socket.io-client';
import { User, Conversation } from '../types';

const ChatWindow = ({ isChatOpen, setIsChatOpen }: { isChatOpen: boolean; setIsChatOpen: (open: boolean) => void }) => {
    const { token } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null); 
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [message, setMessage] = useState('');
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!isChatOpen || !token) return;

        // Connect to Socket.IO server
        socketRef.current = io('http://localhost:3003', {
            auth: { token }, // Pass JWT token in handshake
        });

        // Handle connection
        socketRef.current.on('connect', () => {
            console.log('ChatWindow: Connected to Socket.IO server');
        });

        // Handle connection errors
        socketRef.current.on('connect_error', (error) => {
            console.error('ChatWindow: Socket connection error:', error.message);
        });

        // Handle disconnection
        socketRef.current.on('disconnect', () => {
            console.log('ChatWindow: Disconnected from Socket.IO server');
        });

        socketRef.current.on('receiveMessage', (data) => {
            console.log('Received message:', data); // Placeholder for now
        });

        // Cleanup on unmount or when chat closes
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isChatOpen, token]); // Re-run if isChatOpen or token changes

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (searchQuery.trim()) {
          timeoutId = setTimeout(async () => {
            try {
              const results = await searchUsers(searchQuery);
              setSearchResults(results);
            } catch (error) {
                console.error('Search failed:', error);
                setSearchResults([]);
                setSelectedUser(null);
              }
        }, 300); // Debounce 300ms
        } else {
          setSearchResults([]);
        }
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedUser]);

    const handleUserSelect = async (user: User) => {
        try {
            const tokenData = JSON.parse(atob(token!.split('.')[1])); // Decode JWT to get userId
            console.log('Decoded token data:', tokenData); 
            const user1Id = tokenData.userId;
            const user2Id = user.user_id;
            if (user1Id === user2Id) {
                alert('Cannot start a conversation with yourself');
                return;
            }
            const conversationData = await createConversation(user1Id, user2Id);
            setConversation(conversationData);
            setSelectedUser(user);
            setSearchQuery(''); // Clear search
            setSearchResults([]); // Clear results
        } catch (error) {
            console.error('Failed to create conversation:', error); // Log full error
            if (error instanceof Error) {
                alert(`Failed to start conversation: ${error.message}`);
            } else {
                alert('Failed to start conversation: Unknown error');
            }
        }
    };

    const handleBackToSearch = () => {
        setSelectedUser(null);
        setConversation(null);
        setSearchQuery('');
    };

    const handleSendMessage = () => {
        if (socketRef.current && conversation && message.trim()) {
            const tokenData = JSON.parse(atob(token!.split('.')[1]));
            const senderId = tokenData.userId;
            socketRef.current.emit('sendMessage', {
                conversationId: conversation.conversation_id,
                senderId,
                content: message,
            });
            setMessage(''); // Clear input
        }
    };

    if (!isChatOpen) return null;

    return (
        <div className="fixed right-6 top-6 w-92 h-full bg-matrix-gray text-matrix-green font-mono shadow-lg rounded-lg p-4 z-40 mb-4">
          {selectedUser && conversation ? (
                // Conversation View
                <div className="flex flex-col h-full mb-4">
                    <div className="flex items-center mb-4">
                        <button onClick={handleBackToSearch} className="text-matrix-green hover:text-matrix-green-light mr-2 text-bold text-xl">
                            ←
                        </button>
                        <h2 className="text-xl flex-1 ml-2">{selectedUser.username}</h2>
                        <button onClick={() => setIsChatOpen(false)} className="px-2 py-1 text-bold">x</button>
                    </div>
                    <div className="flex-1 overflow-y-auto mb-4 bg-matrix-gray-dark border border-matrix-green rounded p-2">
                        <p>No messages yet</p> {/* Placeholder for message history */}
                    </div>
                    <div className="flex gap-2 mb-4">
                        <Input
                            value={message} // Placeholder for message input
                            onChange={(e) => setMessage(e.target.value)} // Placeholder for message handling
                            placeholder="Type a message..."
                            className="flex-1 border border-matrix-green rounded p-2"
                        />
                        <Button onClick={handleSendMessage} className="px-4 py-2">Send</Button>
                    </div>
                </div>
            ):(
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl">Chat</h2>
                  <button onClick={() => setIsChatOpen(false)} className="px-2 py-1 font-bold">
                    x
                  </button>
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
              onClick={() => handleUserSelect(user)}
            >
              {user.username}
            </li>
          ))}
        </ul>
        )}
          <div className="flex-1 overflow-y-auto">
              <p>Search for a user to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;