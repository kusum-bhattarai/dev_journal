import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/auth'; 
import Button from './Button';
import {BsChatFill} from 'react-icons/bs';
import ChatWindow from './ChatWindow';

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
      <div className="flex items-center">
        {token ? (
          // If a token exists, show Journal and Logout links
          <>
            <button
              onClick={handleChatToggle}
              className="flex items-center text-matrix-green hover:text-green-300 mr-4 animate-pulse font-mono text-lg leading-normal py-1 h-8 pr-3"
              title="Open Chat"
            >
              <BsChatFill size={18} className="mr-1" />
              Chat
            </button>
            <Link to="/journal" className="hover:text-green-300 text-lg animate-pulse leading-normal py-1 h-8 pr-7">
              Journal
            </Link>
            <Button onClick={logout} className="py-1">
              Logout
            </Button>
          </>
        ) : (
          // If no token, show Login and Register links
          <>
            <Link to="/login" className="hover:text-green-300 text-lg leading-normal py-1 pr-5">
              Login
            </Link>
            <Link to="/register" className="hover:text-green-300 text-lg leading-normal py-1">
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