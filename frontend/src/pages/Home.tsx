import React from 'react';
import Navbar from '../components/Navbar';
import JournalEntry from '../components/JournalEntry';

const Home = () => {
  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-matrix-black text-matrix-green font-mono p-6">
        <h1 className="text-5xl mb-4 animate-glitch text-center pt-5">𝕎𝕖𝕝𝕔𝕠𝕞𝕖 𝕥𝕠 𝕥𝕙𝕖 𝕄𝕒𝕥𝕣𝕚𝕩!</h1>
        <JournalEntry/>
      </div>
    </div>
  );
};

export default Home;