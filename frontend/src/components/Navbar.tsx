import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-matrix-gray p-4">
      <ul className="flex space-x-6 text-matrix-green">
        <li><Link to="/" className="hover:text-green-500">Home</Link></li>
        <li><Link to="/login" className="hover:text-green-500">Login</Link></li>
        <li><Link to="/register" className="hover:text-green-500">Register</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;