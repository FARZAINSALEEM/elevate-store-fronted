import React, { createContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on initial load
  useEffect(() => {
    const checkLoggedIn = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        } else {
          // Clean up if data is partially missing
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error("Error reading auth state:", error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        // Simulating a slight delay for smooth animation reveal
        setTimeout(() => setLoading(false), 800);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (username, password) => {
    try {
      // Forcefully clear any stale cache before a new login attempt
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      const data = await authService.login(username, password);
      
      // Ensure data is synced immediately
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const registerUser = async (username, email, password) => {
    try {
      await authService.register(username, email, password);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    // Extra safeguard to completely wipe credentials
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Modern animated loader while checking auth state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-16 w-16 rounded-full border-4 border-transparent border-t-indigo-500 border-b-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, registerUser, logout }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-[#0a0a0a] text-white"
      >
        {children}
      </motion.div>
    </AuthContext.Provider>
  );
};