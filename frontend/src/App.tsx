import React from 'react';
import { Routes, Route } from 'react-router-dom';
import JournalEntry from './components/JournalEntry';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const App = () => {
  return (
    <div>
      <Routes>
      <Route path="/" element={<JournalEntry userId="test-user" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
};

export default App;
