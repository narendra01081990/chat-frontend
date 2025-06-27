import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { useUser } from '../context/UserContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // Simulate API call delay
    setTimeout(() => {
      setCurrentUser({
        id: Date.now().toString(),
        username: username.trim(),
        isOnline: true,
        avatarColor: getRandomColor()
      });
      setIsLoading(false);
      navigate('/chat');
    }, 800);
  };

  const getRandomColor = () => {
    const colors = [
      'bg-indigo-500', 'bg-blue-500', 'bg-green-500', 
      'bg-yellow-500', 'bg-red-500', 'bg-pink-500', 
      'bg-purple-500', 'bg-violet-500', 'bg-teal-500'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="px-8 pt-8 pb-6">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
              <MessageSquare className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-1">
            Welcome to ChatterBox
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            Enter your username to start chatting
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                ref={inputRef}
                type="text"
                id="username"
                className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200`}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                maxLength={20}
                disabled={isLoading}
              />
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-500"
                >
                  {error}
                </motion.p>
              )}
            </div>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 focus:ring-offset-indigo-200 text-white rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-70"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Join Chat'
              )}
            </motion.button>
          </form>
        </div>
        
        <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By joining, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;