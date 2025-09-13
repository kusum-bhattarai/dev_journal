import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { useToast } from '../hooks/use-toast';

const AuthCallbackPage = () => {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const statusFromUrl = searchParams.get('status');

    if (tokenFromUrl) {
      toast({
        title: 'GitHub Login Successful!',
        description: 'Welcome to your DevJournal.',
      });
      login(tokenFromUrl);
      navigate('/', { replace: true });
      return;
    }
    
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
      navigate('/login', { replace: true });
      return;
    }

    // If no token or status is found, redirect to login
    navigate('/login', { replace: true });
  }, [searchParams, login, navigate, toast]);

  // Render a simple loading state while the redirect is happening
  return (
    <div className="flex items-center justify-center h-screen bg-matrix-gray text-matrix-green">
      <p>Authenticating...</p>
    </div>
  );
};

export default AuthCallbackPage;