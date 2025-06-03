import React from 'react';
import JournalEntry from './components/JournalEntry';

const App = () => {
  return (
    <div>
      <h1 className="text-matrix-green text-3xl animate-glitch text-center py-4">Welcome to DevJournal</h1>
      <JournalEntry userId="test-user" />
    </div>
  );
};

export default App;
