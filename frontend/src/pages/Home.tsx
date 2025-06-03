import React from 'react';
import Navbar from '../components/Navbar';

const Home = () => {
  return (
    <div className="min-h-screen bg-matrix-black text-matrix-green font-mono p-6">
      <Navbar />
      <h1 className="text-4xl mb-6 animate-glitch text-center">Welcome to DevJournal</h1>
      <p className="text-center max-w-2xl mx-auto">
        DevJournal is your Matrix-inspired space to log coding thoughts, track progress, and reflect on your developer journey.
      </p>
    </div>
  );
};

export default Home;