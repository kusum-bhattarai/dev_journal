import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { BsChatFill } from 'react-icons/bs';
import { FaUser } from 'react-icons/fa';
import ChatWindow from './ChatWindow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
interface NavbarProps {
  variant?: 'full' | 'chatOnly';
}

const Navbar: React.FC<NavbarProps> = ({ variant = 'full' }) => {
  const { token, logout } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  // The chat window is always rendered, just controlled by isChatOpen state
  const chatComponent = <ChatWindow isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />;

  // Conditionally render the "chatOnly" variant
  if (variant === 'chatOnly') {
    return (
      <>
        <button
          onClick={handleChatToggle}
          className="fixed bottom-6 right-6 z-50 bg-matrix-green text-matrix-black h-14 w-14 rounded-full flex items-center justify-center shadow-lg hover:bg-green-500 transition-transform hover:scale-110"
          title="Open Chat"
        >
          <BsChatFill size={24} />
        </button>
        {chatComponent}
      </>
    );
  }

  // --- Default 'full' variant ---
  return (
    <nav className="flex justify-between items-center p-4 bg-matrix-gray text-matrix-green border-b border-matrix-green">
      <div className="text-2xl font-bold animate-pulse">
        <Link to="/">DevJournal</Link>
      </div>
      <div className="flex items-center gap-4">
        {token ? (
          <>
            <button
              onClick={handleChatToggle}
              className="flex items-center text-matrix-green hover:text-green-300 animate-pulse font-mono text-lg"
              title="Open Chat"
            >
              <BsChatFill size={18} className="mr-2" />
              Chat
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer h-9 w-9 border-2 border-matrix-green hover:border-green-300">
                  <AvatarFallback className="bg-matrix-gray">
                    <FaUser />
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-matrix-gray border-matrix-green text-matrix-green"
                align="end"
              >
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/journal">Journal</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-matrix-green-dark" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer focus:bg-matrix-green-dark focus:text-red-500"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-green-300 text-lg">
              Login
            </Link>
            <Link to="/register" className="hover:text-green-300 text-lg">
              Register
            </Link>
          </>
        )}
      </div>
      {chatComponent}
    </nav>
  );
};

export default Navbar;