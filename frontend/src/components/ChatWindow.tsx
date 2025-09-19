import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../utils/auth';
import Input from './Input';
import Button from './Button';
import { searchUsers, createConversation, getConversations, getMessages } from '../utils/api';
import io, { Socket } from 'socket.io-client';
import { User, Conversation, Message } from '../types';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Link } from 'react-router-dom';
import { FaFileAlt } from 'react-icons/fa';

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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
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

  const loadMessages = useCallback(async (reset = false) => {
    if (!conversation || !token || (isLoading && !reset)) return;
    if (!hasMore && !reset) return;

    setIsLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const prevHeight = chatContainerRef.current?.scrollHeight || 0;
      const prevScrollTop = chatContainerRef.current?.scrollTop || 0;

      const newMessages = await getMessages(conversation.conversation_id, currentPage);
      if (newMessages.length < 20) setHasMore(false);

      // Don't reverse messages; assume API returns oldest first
      setMessages((prev) => reset ? newMessages : [...newMessages, ...prev]);

      if (reset) {
        setPage(2);
      } else {
        setPage((p) => p + 1);
      }

      // Maintain scroll position for infinite scroll
      if (chatContainerRef.current && !reset) {
        const newHeight = chatContainerRef.current.scrollHeight;
        chatContainerRef.current.scrollTop = prevScrollTop + (newHeight - prevHeight);
      }
    } catch (error) {
      console.error('loadMessages: Failed to fetch messages', error);
    } finally {
      setIsLoading(false);
    }
  }, // eslint-disable-next-line
  [conversation, token]);

  useEffect(() => {
    if (!isChatOpen || !token) return;

    const tokenData = JSON.parse(atob(token.split('.')[1]));
    setCurrentUserId(tokenData.userId);
    fetchConversations();

    const chatServiceUrl = process.env.REACT_APP_CHAT_SERVICE_URL || 'http://localhost:3003';

    // Only create a new socket if one doesn't exist or is disconnected
    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io(chatServiceUrl, {
        auth: { token },
        reconnection: true,
      });

      socketRef.current.on('connect', () => {
        if (conversation) socketRef.current?.emit('joinRoom', conversation.conversation_id);
      });

      socketRef.current.on('connect_error', (error) => console.error('Socket: Connection error', error.message));

      socketRef.current.on('receiveMessage', (data: Message) => {
        setMessages((prev) => {
          // Avoid adding duplicate messages
          if (prev.some((msg) => msg.message_id === data.message_id)) {
            return prev;
          }
          const updatedMessages = [...prev, data];
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
          return updatedMessages;
        });
      });

      socketRef.current.on('messageUpdated', (data: { messageIds: number[]; read_status: boolean }) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            data.messageIds.includes(msg.message_id)
              ? { ...msg, read_status: data.read_status }
              : msg
          )
        );
      });

      socketRef.current.on('messageError', (error) => console.error('Socket: Message error', error));
    }

    return () => {
      // Only disconnect if the socket exists and is connected
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
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
    if (!conv.other_user_id || !conv.other_username) {
      console.error("Conversation item is missing other user's data", conv);
      return;
    }
    const userToChatWith: User = {
      user_id: conv.other_user_id,
      username: conv.other_username,
      email: '',
    };
    setSelectedUser(userToChatWith);
    setConversation(conv);
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    if (conversation && currentUserId) {
      // Only reset and load messages if no messages are loaded
      if (messages.length === 0) {
        setMessages([]);
        setPage(1);
        setHasMore(true);
        loadMessages(true);
      }
    }
  }, [conversation, currentUserId, loadMessages, messages.length]);

  useEffect(() => {
    if (sentinelRef.current && observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMessages();
      }
    }, { threshold: 1.0 });

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadMessages]);

  useEffect(() => {
    if (messages.length > 0 && currentUserId) {
      const unreadMessageIds = messages
        .filter(msg => !msg.read_status && msg.receiver_id === currentUserId)
        .map(msg => msg.message_id);
      if (unreadMessageIds.length > 0 && socketRef.current?.connected) {
        socketRef.current.emit('markAsRead', {
          conversationId: conversation?.conversation_id,
          messageIds: unreadMessageIds,
        });
      }
    }
  }, [messages, currentUserId, conversation]);

  const handleBackToSearch = () => {
    setSelectedUser(null);
    setConversation(null);
    setMessages([]);
    setSearchQuery('');
  };

  const handleSendMessage = () => {
    if (socketRef.current && conversation && message.trim() && currentUserId) {
      socketRef.current.emit('sendMessage', {
        conversationId: conversation.conversation_id,
        senderId: currentUserId,
        content: message,
      });
      setMessage('');
    }
  };

  // On initial load, scroll to bottom
  useEffect(() => {
    if (messages.length > 0 && page === 2 && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, page]);

  const groupedMessages = messages.reduce((acc, msg) => {
    const date = new Date(msg.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {} as { [key: string]: Message[] });

  // Sort dates in chronological order
  const sortedDates = Object.keys(groupedMessages).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  if (!isChatOpen) return null;

  return (
    <div className="fixed right-6 top-6 w-96 h-[calc(100%-3rem)] bg-matrix-gray text-matrix-green font-mono shadow-lg rounded-lg p-4 z-40 flex flex-col">
      {selectedUser && conversation ? (
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-4 flex-shrink-0">
            <button onClick={handleBackToSearch} className="text-matrix-green hover:text-matrix-green-light mr-2 text-bold text-xl">
              ←
            </button>
            <h2 className="text-xl flex-1 truncate" title={selectedUser.username}>
              {selectedUser.username}
            </h2>
            <button onClick={() => setIsChatOpen(false)} className="px-2 py-1 text-bold">x</button>
          </div>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 bg-matrix-gray-dark border border-matrix-green rounded p-2 space-y-2">
            <div ref={sentinelRef} />
            {sortedDates.map((date) => (
              <React.Fragment key={date}>
                <h3 className="text-center text-sm text-matrix-green-light my-2">{date}</h3>
                {groupedMessages[date].map((msg) => {
                  if (msg.message_type === 'journal_share' && msg.metadata?.journalId) {
                    return (
                      <div key={msg.message_id} className="flex justify-center my-2">
                        <Link
                          to={`/journal/${msg.metadata.journalId}`}
                          className="flex items-center gap-3 p-3 rounded-lg bg-matrix-gray-light border border-matrix-green-dark hover:border-matrix-green transition-colors w-full"
                        >
                          <FaFileAlt className="text-matrix-green text-xl flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-bold">Journal Shared</p>
                            <p className="text-sm opacity-80">{msg.content}</p>
                          </div>
                        </Link>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.message_id} className={`flex w-full my-2 ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 border shadow-md ${
                        msg.sender_id === currentUserId
                          ? 'bg-green-800/50 border-matrix-green rounded-br-none'
                          : 'bg-matrix-gray-light border-gray-600 rounded-bl-none'
                      }`}>
                        <div className="flex flex-col">
                          <p className="text-left break-words">{msg.content}</p>
                          <div className="text-right text-xs mt-1 opacity-70">
                            <span>{new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                            {msg.sender_id === currentUserId && (
                              <span className="ml-1">{msg.read_status ? '✓✓' : '✓'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div className="flex gap-2 mt-auto flex-shrink-0">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            />
            <Button onClick={handleSendMessage} className="px-4 py-2">Send</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl">Chat</h2>
            <button onClick={() => setIsChatOpen(false)} className="px-2 py-1 font-bold">x</button>
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="mb-4"
          />
          <div className="flex-1 overflow-y-auto mt-4">
            {searchResults.length > 0 ? (
              <div className="p-px bg-gradient-to-b from-matrix-green/40 to-matrix-gray-dark/10 rounded-lg">
                <div className="bg-matrix-gray-dark rounded-lg">
                  {searchResults.map((user, index) => (
                    <div
                      key={user.user_id}
                      className={`p-3 cursor-pointer hover:bg-matrix-gray transition-colors duration-200 flex items-center gap-2 ${index < searchResults.length - 1 ? 'border-b border-matrix-green-dark' : ''}`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <Avatar><AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                      <span className="truncate">{user.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {conversations.length > 0 ? (
                  <div className="p-px bg-gradient-to-b from-matrix-green/40 to-matrix-gray-dark/10 rounded-lg">
                    <div className="bg-matrix-gray-dark rounded-lg">
                      {conversations.map((conv, index) => {
                        const isUnread = !conv.read_status && conv.last_message_sender_id !== currentUserId;
                        const lastMessage = conv.message_type === 'journal_share'
                          ? '[Journal Shared]'
                          : conv.last_message_content || 'No messages yet';

                        return (
                          <div key={conv.conversation_id} className={index < conversations.length - 1 ? 'border-b border-matrix-green-dark' : ''}>
                            <div
                              className="p-3 cursor-pointer hover:bg-matrix-gray transition-colors duration-200 flex items-center gap-2"
                              onClick={() => handleConversationSelect(conv)}
                            >
                              <Avatar><AvatarFallback>{conv.other_username?.slice(0, 2).toUpperCase() || '??'}</AvatarFallback></Avatar>
                              <div className="flex-1 overflow-hidden">
                                <p className={`font-bold truncate ${isUnread ? 'text-matrix-green' : 'text-matrix-green/70'}`}>
                                  {conv.other_username || 'Unknown User'}
                                </p>
                                <p className={`text-sm truncate ${isUnread ? 'text-matrix-green/90' : 'text-matrix-green/60'}`}>
                                  {lastMessage}
                                </p>
                              </div>
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