import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import { FaGithub } from 'react-icons/fa';
import Input from '../components/Input';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/auth'

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const { login } = useAuth();


  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token); 
      setPopupMessage('Login Successful!');
      setShowPopup(true);

      setTimeout(()=>{
        navigate('/');
      }, 2000);
    } catch (error: any) {
      setPopupMessage(error.message);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    }
  };

  useEffect(() => {
    const token = searchParams.get('token');
    const status = searchParams.get('status');
    let message = '';
    let redirectPath = '/';

    // Handle successful login
    if (token) {
      localStorage.setItem('token', token);
      message = 'Login Successful!';
      redirectPath = '/';
    }

    // Handle status messages from GitHub auth
    if (status) {
      switch (status) {
        case 'registered':
          message = 'Registration successful! Please log in.';
          redirectPath = '/login';
          break;
        case 'already-registered':
          message = 'This GitHub account is already registered. Please log in.';
          redirectPath = '/login';
          break;
        case 'not-registered':
          message = 'This GitHub account is not registered. Please register first.';
          redirectPath = '/login';
          break;
      }
    }
    
    if (message) {
      setPopupMessage(message);
      setShowPopup(true);
      const timer = setTimeout(() => {
        setShowPopup(false);
        // Use replace to remove the query params from the URL
        navigate(redirectPath, { replace: true });
      }, 3000); // Increased time to 3 seconds for better UX
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate]);


  return (
    <div className="min-h-screen bg-matrix-black text-matrix-green font-mono p-6">
      <Navbar />
      <h1 className="text-4xl mb-6 animate-glitch text-center pt-2">Login</h1>
      <div className="max-w-md mx-auto bg-matrix-gray p-6 rounded-lg shadow-lg animate-fadeIn">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="mt-4" />
        <Button onClick={handleLogin} className="mt-6 w-full">
          Login
        </Button>
        <a
          href="http://localhost:3001/auth/github?state=login"
          className="mt-4 block w-full text-center bg-matrix-green text-matrix-black px-4 py-2 rounded hover:bg-green-500 transition duration-300 flex items-center justify-center"
          > 
          <FaGithub className="mr-2" /> Login with GitHub
      </a>
      <div className="text-center mt-4">
          <Link to="/register" className="text-matrix-green hover:underline">
            New user? Register here!
          </Link>
        </div>
      </div>
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-matrix-gray p-6 rounded-lg shadow-lg text-matrix-green font-mono animate-fadeIn">
            <h2 className="text-2xl mb-2">{popupMessage}</h2>
            <p>Redirecting...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;