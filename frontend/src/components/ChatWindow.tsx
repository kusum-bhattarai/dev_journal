import React from 'react';
import { useAuth } from '../utils/auth';
import Input from './Input';
import Button from './Button';

interface ChatWindowProps {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const ChatWindow = ({ isChatOpen, setIsChatOpen }: ChatWindowProps) => {
  const { token } = useAuth();

  if (!isChatOpen) return null;

  return (
    <div className="fixed right-6 top-28 w-92 h-96 bg-matrix-gray text-matrix-green font-mono shadow-lg rounded-lg p-4 z-40">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Chat</h2>
        <Button onClick={() => setIsChatOpen(false)} className="px-2 py-1">
          Close
        </Button>
      </div>
      <Input
        value=""
        onChange={() => {}}
        placeholder="Search users..."
        className="mb-4"
      />
      <div className="h-full overflow-y-auto">
        <p>Chat messages will appear here</p>
      </div>
    </div>
  );
};

export default ChatWindow;