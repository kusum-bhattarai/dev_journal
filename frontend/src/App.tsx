import React from 'react';
import { Routes, Route } from 'react-router-dom';
import JournalEntry from './components/JournalList';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const App = () => {
  return (
    <div>
      <Routes>
      <Route path="/journal" element={<JournalEntry userId="test-user" />} />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
};

export default App;
