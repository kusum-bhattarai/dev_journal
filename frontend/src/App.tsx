import React from 'react';
import { Routes, Route, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import JournalList from './components/JournalList';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './utils/auth';

const App = () => {
  const { token, login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl && !token) {
      login(tokenFromUrl);
      // Remove the token from the URL and navigate to the home page
      navigate('/', { replace: true }); 
    }
  }, [searchParams, login, token, navigate]);

  // Protect routes
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  return (
    <div>
      <Routes>
        <Route path="/journal" element={<ProtectedRoute><JournalList/></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
};

export default App;