import React, { createContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    checkLoggedIn();
  }, []);

  const login = async (username, password) => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      const data = await authService.login(username, password);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  // FIXED: Now properly accepts 4 arguments including the OTP!
  const registerUser = async (username, email, password, otp) => {
    try {
      const data = await authService.register(username, email, password, otp);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-16 w-16 rounded-full border-4 border-transparent border-t-indigo-500 border-b-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, registerUser, logout }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="min-h-screen bg-[#0a0a0a] text-white">
        {children}
      </motion.div>
    </AuthContext.Provider>
  );
};