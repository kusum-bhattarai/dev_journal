import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import JournalList from './components/JournalList';
import JournalDetail from './pages/JournalDetail';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './utils/auth';
import { Toaster } from './components/ui/toaster';
import AuthCallbackPage from './pages/AuthCallbackPage'; 

const App = () => {
  const { token, loading } = useAuth();

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) {
      return null; // Or a loading spinner
    }
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  return (
    <div>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} /> {/* Add the new route */}
        <Route path="/journal" element={<ProtectedRoute><JournalList/></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/journal/:id" element={<JournalDetail />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
      <Toaster />
    </div>
  );
};

export default App;