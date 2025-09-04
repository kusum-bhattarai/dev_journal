import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa';
import Button from '../components/Button';
import Input from '../components/Input';
import Navbar from '../components/Navbar';
import { useToast } from '../hooks/use-toast';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast(); 

  const handleRegister = async () => {
    try {
      // Add client-side validation here
      if (!username || !email || !password) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Username, email, and password are required.',
        });
        return; // Prevent submission
      }
      if (username.length < 3) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Username must be at least 3 characters long.',
        });
        return;
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
      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      // Use the toast for success
      toast({
        title: 'Registration Successful!',
        description: 'Please log in to continue.',
      });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      // Use the toast for errors
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-matrix-black text-matrix-green font-mono p-6 pt-2">
      <Navbar />
      <h1 className="text-4xl mb-6 animate-glitch text-center pt-2">Register</h1>
      <div className="max-w-md mx-auto bg-matrix-gray p-6 rounded-lg shadow-lg animate-fadeIn">
        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="mt-4" />
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-4"
        />
        <Button onClick={handleRegister} className="mt-6 w-full">
          Register
        </Button>
        <a
          href="http://localhost:3001/auth/github?state=register"
          className="mt-4 block w-full text-center bg-matrix-green text-matrix-black px-4 py-2 rounded hover:bg-green-500 transition duration-300 flex items-center justify-center"
        >
          <FaGithub className="mr-2" /> Register with GitHub
        </a>
      </div>
    </div>
  );
};

export default RegisterPage;