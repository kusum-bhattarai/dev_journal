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

const Navbar = () => {
  const { token, logout } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-matrix-gray text-matrix-green border-b border-matrix-green">
      <div className="text-2xl font-bold animate-pulse">
        <Link to="/">DevJournal</Link>
      </div>
      <div className="flex items-center gap-4">
        {token ? (
          // If a token exists, show Chat and the new Dropdown Menu
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
          // If no token, show Login and Register links
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
      <ChatWindow isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />
    </nav>
  );
};

export default Navbar;