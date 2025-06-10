import React, { useEffect, useState } from 'react';
import { Routes, Route, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import JournalEntry from './components/JournalList';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './utils/auth';

const App = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token); // Set the token and mark as logged in
      setShowPopup(true);
      const timer = setTimeout(() => {
        setShowPopup(false);
        navigate('/'); // Redirect to homepage for existing users 
    }, 2000);
    return () => clearTimeout(timer);
  }
  }, [searchParams, navigate, login]);

  // Protect routes
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  return (
    <div>
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-matrix-gray p-6 rounded-lg shadow-lg text-matrix-green font-mono animate-fadeIn">
            <h2 className="text-2xl mb-2">Login Successful!</h2>
            <p>Redirecting to homepage...</p>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/journal" element={<ProtectedRoute><JournalEntry userId="test-user" /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
};

export default App;