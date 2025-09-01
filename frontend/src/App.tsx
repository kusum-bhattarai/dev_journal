import React, { useEffect } from 'react';
import { Routes, Route, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import JournalList from './components/JournalList';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './utils/auth';
import { Toaster } from './components/ui/toaster';
import { useToast } from './hooks/use-toast';

const App = () => {
  const { token, login } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const statusFromUrl = searchParams.get('status');

    // Handle successful GitHub login
    if (tokenFromUrl) {
      toast({
        title: 'GitHub Login Successful!',
        description: 'Welcome to your DevJournal.',
      });
      login(tokenFromUrl);
      // Clean the token from the URL
      searchParams.delete('token');
      setSearchParams(searchParams, { replace: true });
    }
    
    // Handle GitHub status messages
    if (statusFromUrl) {
      let message = '';
      switch (statusFromUrl) {
        case 'registered':
          message = 'Registration successful! Please log in.';
          break;
        case 'already-registered':
          message = 'This GitHub account is already registered. Please log in.';
          break;
        case 'not-registered':
          message = 'This GitHub account is not registered. Please register first.';
          break;
      }
      if (message) {
        toast({
          title: 'GitHub Authentication',
          description: message,
        });
      }
      // Clean the status from the URL
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, login, toast, navigate, setSearchParams]);

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
      <Toaster />
    </div>
  );
};

export default App;