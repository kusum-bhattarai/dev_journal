import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa'; 
import Button from '../components/Button';
import Input from '../components/Input';
import Navbar from '../components/Navbar';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const handleRegister = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      setPopupMessage('Registration successful! Please log in.');
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setPopupMessage(error.message);
      setShowPopup(true);
      setTimeout(() => {
        navigate('/login'); 
      }, 2000);
    }
  };

  useEffect(() => {
    const token = searchParams.get('token');
    const registered = searchParams.get('registered');
    if (token) {
      if (registered === 'true') {
        setPopupMessage('Already registered!');
      } else {
        setPopupMessage('Registration Successful!');
      }
      setShowPopup(true);
      const timer = setTimeout(() => {
        setShowPopup(false);
        navigate('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate]);

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
        <a
          href="http://localhost:3001/auth/github?state=register"
          className="mt-4 block w-full text-center bg-matrix-green text-matrix-black px-4 py-2 rounded hover:bg-green-500 transition duration-300 flex items-center justify-center"
        >
          <FaGithub className="mr-2" /> Register with GitHub
        </a>
      </div>
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-matrix-gray p-6 rounded-lg shadow-lg text-matrix-green font-mono animate-fadeIn">
            <h2 className="text-2xl mb-2">{popupMessage}</h2>
            <p>Redirecting to login...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;