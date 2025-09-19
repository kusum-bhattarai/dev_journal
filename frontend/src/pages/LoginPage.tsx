import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import { FaGithub } from 'react-icons/fa';
import Input from '../components/Input';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/auth';
import { useToast } from '../hooks/use-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      // client-side validation 
      if (!email || !password) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Email and password are required.',
        });
        return; // Prevent submission
      }
      if (!/\S+@\S+\.\S+/.test(email)) { // Basic email regex
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please enter a valid email address.',
        });
        return;
      }
      if (password.length < 8) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Password must be at least 8 characters long.',
        });
        return;
      }
      
      const response = await fetch(`${process.env.REACT_APP_USER_SERVICE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      toast({
        title: 'Login Successful!',
        description: 'Redirecting...',
      });
      
      setTimeout(() => {
        login(data.token);
        navigate('/');
      }, 1500);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-matrix-black text-matrix-green font-mono p-6">
      <Navbar />
      <h1 className="text-4xl mb-6 animate-glitch text-center pt-2">Login</h1>
      <div className="max-w-md mx-auto bg-matrix-gray p-6 rounded-lg shadow-lg animate-fadeIn">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-4"
        />
        <Button onClick={handleLogin} className="mt-6 w-full">
          Login
        </Button>
        <a
          href={`${process.env.REACT_APP_USER_SERVICE_URL}/auth/github?state=login`}
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
    </div>
  );
};

export default LoginPage;