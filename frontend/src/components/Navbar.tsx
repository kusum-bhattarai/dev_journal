import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/auth'; 
import Button from './Button';

const Navbar = () => {
  const { token, logout } = useAuth();

  return (
    <nav className="flex justify-between items-center p-4 bg-matrix-gray text-matrix-green border-b border-matrix-green">
      <div className="text-2xl font-bold animate-pulse">
        <Link to="/">DevJournal</Link>
      </div>
      <div>
        {token ? (
          // If a token exists, show Journal and Logout links
          <>
            <Link to="/journal" className="mr-4 hover:text-green-300">
              Journal
            </Link>
            <Button onClick={logout}>
              Logout
            </Button>
          </>
        ) : (
          // If no token, show Login and Register links
          <>
            <Link to="/login" className="mr-4 hover:text-green-300">
              Login
            </Link>
            <Link to="/register" className="hover:text-green-300">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;