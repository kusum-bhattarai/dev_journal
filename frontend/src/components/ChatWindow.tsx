import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../utils/auth';
import Input from './Input';
import Button from './Button';
import { searchUsers, createConversation, getConversations } from '../utils/api';
import io, { Socket } from 'socket.io-client';
import { User, Conversation, Message } from '../types';

interface ChatWindowProps {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isChatOpen, setIsChatOpen }) => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('fetchConversations: Failed to fetch conversations', error);
      setConversations([]);
    }
  }, [token]);

  const fetchMessages = useCallback(async () => {
    if (!conversation || !token) return;
    try {
      const response = await fetch(`http://localhost:3003/messages/${conversation.conversation_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('fetchMessages: Failed to fetch messages', error);
      setMessages([]);
    }
  }, [conversation, token]);

  useEffect(() => {
    if (!isChatOpen || !token) return;

    fetchConversations();

    socketRef.current = io('http://localhost:3003', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      if (conversation) socketRef.current?.emit('joinRoom', conversation.conversation_id);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket: Connection error', error.message);
    });

    socketRef.current.on('disconnect', () => {});

    socketRef.current.on('receiveMessage', (data: Message) => {
      setMessages((prev) => (Array.isArray(prev) ? [...prev, data] : [data]));
    });

    socketRef.current.on('messageError', (error) => {
      console.error('Socket: Message error', error);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [isChatOpen, token, conversation, fetchConversations]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (searchQuery.trim()) {
      timeoutId = setTimeout(async () => {
        try {
          const results = await searchUsers(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('useEffect: Search failed', error);
          setSearchResults([]);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleUserSelect = async (user: User) => {
    try {
      const tokenData = JSON.parse(atob(token!.split('.')[1]));
      const user1Id = tokenData.userId;
      const user2Id = user.user_id;
      if (user1Id === user2Id) {
        alert('Cannot start a conversation with yourself');
        return;
      }
      let conversationData: Conversation;
      const existingConv = conversations.find(
        (conv) => (conv.user1_id === user1Id && conv.user2_id === user2Id) || 
                  (conv.user1_id === user2Id && conv.user2_id === user1Id)
      );
      if (existingConv) {
        conversationData = existingConv;
      } else {
        conversationData = await createConversation(user1Id, user2Id);
        setConversations((prev) => [...prev, conversationData]);
      }
      setConversation(conversationData);
      setSelectedUser(user);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('handleUserSelect: Failed to create conversation', error);
      alert(error instanceof Error ? `Failed to start conversation: ${error.message}` : 'Failed to start conversation: Unknown error');
    }
  };

  useEffect(() => {
    if (conversation) fetchMessages();
  }, [conversation, fetchMessages]);

  const handleBackToSearch = () => {
    setSelectedUser(null);
    setConversation(null);
    setMessages([]);
    setSearchQuery('');
  };

  const handleSendMessage = () => {
    if (socketRef.current && conversation && message.trim()) {
      console.log('handleSendMessage: Sending message', { conversationId: conversation.conversation_id, content: message });
      const tokenData = JSON.parse(atob(token!.split('.')[1]));
      const senderId = tokenData.userId;
      socketRef.current.emit('sendMessage', {
        conversationId: conversation.conversation_id,
        senderId,
        content: message,
      });
      setMessage('');
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isChatOpen) return null;

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = new Date(msg.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {} as { [key: string]: Message[] });

  return (
    <div className="fixed right-6 top-6 w-96 h-full bg-matrix-gray text-matrix-green font-mono shadow-lg rounded-lg p-4 z-40 mb-4">
      {selectedUser && conversation ? (
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-4">
            <button onClick={handleBackToSearch} className="text-matrix-green hover:text-matrix-green-light mr-2 text-bold text-xl">
              ←
            </button>
            <h2 className="text-xl flex-1 truncate" title={selectedUser.username}>
              {selectedUser.username.length > 15 ? selectedUser.username.slice(0, 12) + '...' : selectedUser.username}
            </h2>
            <button onClick={() => setIsChatOpen(false)} className="px-2 py-1 text-bold">
              x
            </button>
          </div>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 bg-matrix-gray-dark border border-matrix-green rounded p-2 space-y-2 h-full">
            {Object.entries(groupedMessages).map(([date, dateMessages], index) => (
              <React.Fragment key={index}>
                <h3 className="text-center text-sm text-matrix-green-light mb-2">{date}</h3>
                {dateMessages.map((msg) => (
                  <div key={msg.message_id} className="p-1">
                    <span>{msg.content}</span>
                    <span className="text-xs ml-2">{new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    <span className="text-xs ml-1">{msg.read_status ? '(Read)' : '(Unread)'}</span>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-matrix-green rounded p-2"
            />
            <Button onClick={handleSendMessage} className="px-4 py-2">Send</Button>
          </div>
        </div>
      ) : (
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
                  <span className="truncate" title={user.username}>
                    {user.username.length > 15 ? user.username.slice(0, 12) + '...' : user.username}
                  </span>
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