import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();
  return (
    <nav className="bg-matrix-gray p-4">
      <ul className="flex space-x-6 text-matrix-green">
        <li><Link to="/" className={location.pathname === '/' ? 'text-green-500' : 'hover:text-green-500'}>Home</Link></li>
        <li><Link to="/journal" className={location.pathname === '/journal' ? 'text-green-500' : 'hover:text-green-500'}>Journal</Link></li>
        <li><Link to="/login" className={location.pathname === '/login' ? 'text-green-500' :"hover:text-green-500"}>Login</Link></li>
        <li><Link to="/register" className={location.pathname === '/register' ? 'text-green-500' : "hover:text-green-500"}>Register</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;