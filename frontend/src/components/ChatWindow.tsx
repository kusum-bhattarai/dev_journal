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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null); // Current user ID
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

    // Extract current user ID from token on mount
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    setCurrentUserId(tokenData.userId);

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

    socketRef.current.on('messageUpdated', (data: { messageIds: number[]; read_status: boolean }) => {
      console.log('Received messageUpdated event for messages:', data.messageIds);
      setMessages((prevMessages) =>
        // Map through existing messages
        prevMessages.map((msg) =>
          // If a message's ID is in the updated list, update its read_status
          data.messageIds.includes(msg.message_id)
            ? { ...msg, read_status: data.read_status }
            : msg
        )
      );
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

  const handleConversationSelect = (conv: Conversation) => {
    // We need the other user's info to display in the chat header
    if (!conv.other_user_id || !conv.other_username) {
      console.error("Conversation item is missing other user's data", conv);
      return;
    }

    // Create a minimal User object for the chat header
    const userToChatWith: User = {
      user_id: conv.other_user_id,
      username: conv.other_username,
      email: '', // Not needed for this view
    };

    setSelectedUser(userToChatWith);
    setConversation(conv); // Set the full conversation object
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    if (conversation && currentUserId) {
      // This function now also handles marking messages as read after fetching
      const loadAndReadMessages = async () => {
        await fetchMessages(); // Wait for messages to be fetched and set in state

        setTimeout(() => {
          setMessages(prevMessages => {
            // Find unread messages where the current user was the receiver
            const unreadMessageIds = prevMessages
              .filter(msg => !msg.read_status && msg.receiver_id === currentUserId)
              .map(msg => msg.message_id);

            // If there are any, and the socket is connected, emit the event
            if (unreadMessageIds.length > 0 && socketRef.current?.connected) {
              console.log('Emitting markAsRead for messages:', unreadMessageIds);
              socketRef.current.emit('markAsRead', {
                conversationId: conversation.conversation_id,
                messageIds: unreadMessageIds,
              });
            }
            return prevMessages;
          });
        }, 100); 
      };

      loadAndReadMessages();
    }
  }, [conversation, fetchMessages, currentUserId]);

  const handleBackToSearch = () => {
    setSelectedUser(null);
    setConversation(null);
    setMessages([]);
    setSearchQuery('');
  };

  const handleSendMessage = () => {
    if (socketRef.current && conversation && message.trim() && currentUserId) {
      console.log('handleSendMessage: Sending message', { conversationId: conversation.conversation_id, content: message });
      socketRef.current.emit('sendMessage', {
        conversationId: conversation.conversation_id,
        senderId: currentUserId,
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
                  <div key={msg.message_id} className={`flex w-full my-2 ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 border shadow-md flex flex-col ${
                        msg.sender_id === currentUserId
                          ? 'bg-green-800/50 border-matrix-green rounded-br-none' // Sender's bubble
                          : 'bg-matrix-gray-light border-gray-600 rounded-bl-none' // Receiver's bubble
                      }`}
                    >
                      <p className="text-left break-words">{msg.content}</p>
                      <div className="text-right text-xs mt-1 opacity-70">
                        <span>{new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        {msg.sender_id === currentUserId && (
                          <span className="text-xs ml-1 opacity-80">{msg.read_status ? '✓✓' : '✓'}</span>
                        )}
                      </div>
                    </div>
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
          <div className="flex-1 overflow-y-auto mt-4">
            {/* If there are search results, show them*/}
            {searchResults.length > 0 ? (
              <div className="p-px bg-gradient-to-b from-matrix-green/40 to-matrix-gray-dark/10 rounded-lg">
                <div className="bg-matrix-gray-dark rounded-lg">
                  {searchResults.map((user, index) => (
                    <div
                      key={user.user_id}
                      className={`p-3 cursor-pointer hover:bg-matrix-gray transition-colors duration-200 ${
                        index < searchResults.length - 1 ? 'border-b border-matrix-green-dark' : ''
                      }`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <span className="truncate" title={user.username}>
                        {user.username}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Otherwise, show the conversation list*/
              <div>
                {conversations.length > 0 ? (
                  <div className="p-px bg-gradient-to-b from-matrix-green/40 to-matrix-gray-dark/10 rounded-lg">
                    <div className="bg-matrix-gray-dark rounded-lg">
                      {conversations.map((conv, index) => {
                        const isUnread = !conv.read_status && conv.last_message_sender_id !== currentUserId;
                        return (
                          <div
                            key={conv.conversation_id}
                            className={index < conversations.length - 1 ? 'border-b border-matrix-green-dark' : ''}
                          >
                            <div
                              className="p-3 cursor-pointer hover:bg-matrix-gray transition-colors duration-200"
                              onClick={() => handleConversationSelect(conv)}
                            >
                              <p className={`font-bold truncate ${isUnread ? 'text-matrix-green' : 'text-matrix-green/70'}`}>
                                {conv.other_username || 'Unknown User'}
                              </p>
                              <p className={`text-sm truncate ${isUnread ? 'text-matrix-green/90' : 'text-matrix-green/60'}`}>
                                {conv.last_message_content || 'No messages yet'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-center p-4 text-matrix-green/50">No recent conversations.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;