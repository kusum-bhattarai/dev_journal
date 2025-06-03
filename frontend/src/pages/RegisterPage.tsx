import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import Navbar from '../components/Navbar';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-matrix-black text-matrix-green font-mono p-6 pt-2">
      <Navbar />
      <h1 className="text-4xl mb-6 animate-glitch text-center pt-2">Register</h1>
      <div className="max-w-md mx-auto bg-matrix-gray p-6 rounded-lg shadow-lg animate-fadeIn">
        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="mt-4" />
        <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="mt-4" />
        <Button onClick={handleRegister} className="mt-6 w-full">
          Register
        </Button>
      </div>
    </div>
  );
};

export default RegisterPage;