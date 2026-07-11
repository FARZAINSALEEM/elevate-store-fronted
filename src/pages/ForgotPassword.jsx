import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Key, Lock, ArrowLeft, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [formData, setFormData] = useState({ email: '', otp: '', password: '' });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      await api.post('/auth/forgot-password/', { email: formData.email });
      setStep(2);
      setStatus({ loading: false, error: '', success: 'OTP sent! Please check your inbox/spam folder.' });
    } catch (err) {
      setStatus({ loading: false, error: 'Failed to request OTP. Please try again.', success: '' });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      await api.post('/auth/reset-password/', { 
        email: formData.email, 
        otp: formData.otp, 
        password: formData.password 
      });
      setStatus({ loading: false, error: '', success: 'Password reset successful!' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setStatus({ loading: false, error: err.response?.data?.error || 'Invalid OTP.', success: '' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-lg bg-[#0c0c0c] border border-neutral-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-indigo-900/10">
        
        {/* Background glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none"></div>

        <Link to="/login" className="inline-flex items-center text-neutral-500 hover:text-indigo-400 transition-colors mb-8 text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" /> Back to Login
        </Link>

        <h2 className="text-3xl font-black text-white mb-2">Reset Password</h2>
        <p className="text-neutral-400 mb-6">
          {step === 1 ? "Enter your email to receive a secure recovery code." : "Enter your 6-digit code and choose a new password."}
        </p>

        {status.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={18} /> {status.error}
          </div>
        )}
        {status.success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
            <CheckCircle size={18} /> {status.success}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={18} className="text-neutral-500"/></div>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 transition-all" placeholder="name@example.com" />
                </div>
              </div>
              <button disabled={status.loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold transition-all mt-4 shadow-lg shadow-indigo-500/20 flex justify-center items-center">
                {status.loading ? 'Sending...' : 'Send OTP Code'}
              </button>
            </motion.form>
          ) : (
            <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">6-Digit OTP Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Key size={18} className="text-neutral-500"/></div>
                  <input required type="text" maxLength="6" value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 transition-all tracking-widest font-mono text-lg" placeholder="000000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={18} className="text-neutral-500"/></div>
                  <input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 transition-all" placeholder="••••••••" />
                </div>
              </div>
              <button disabled={status.loading} type="submit" className="w-full bg-white hover:bg-neutral-200 text-black py-4 rounded-xl font-bold transition-all mt-4 flex justify-center items-center gap-2">
                {status.loading ? 'Verifying...' : <><CheckCircle size={20}/> Confirm Reset</>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ForgotPassword;