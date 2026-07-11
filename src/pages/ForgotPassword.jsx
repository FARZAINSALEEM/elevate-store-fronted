import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Key, Lock, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP + New Password, 3 = Success
  const [formData, setFormData] = useState({ email: '', otp: '', newPassword: '' });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      await api.post('/auth/forgot-password/', { email: formData.email });
      setStep(2);
      setStatus({ type: 'success', msg: 'OTP sent! Please check your inbox and spam folder.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Failed to send reset link.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      await api.post('/auth/reset-password/', { 
        email: formData.email, 
        otp: formData.otp, 
        password: formData.newPassword 
      });
      setStep(3); // Move to Success Screen
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Invalid or expired OTP.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md bg-[#0c0c0c] border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Premium Background Glow Decor */}
        <div className="absolute top-[-30%] right-[-30%] w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-30%] left-[-30%] w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <Link to="/login" className="inline-flex items-center text-neutral-400 hover:text-white transition-colors mb-8 text-sm font-medium relative z-10">
          <ArrowLeft size={16} className="mr-2" /> Back to Login
        </Link>

        <AnimatePresence mode="wait">
          {/* STEP 3: SUCCESS SCREEN */}
          {step === 3 ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 relative z-10">
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20"
              >
                <CheckCircle size={40} className="text-green-500" />
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Password Reset!</h2>
              <p className="text-neutral-400 mb-8 leading-relaxed">Your password has been changed successfully. You can now log in with your new credentials.</p>
              <Link to="/login" className="w-full flex items-center justify-center bg-white hover:bg-neutral-200 text-black py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Sign In Now
              </Link>
            </motion.div>
          ) : (
            
            /* STEP 1 & 2: FORM */
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="relative z-10">
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Recover Account</h2>
              <p className="text-neutral-400 mb-8">
                {step === 1 ? "Enter your email address to receive a secure recovery code." : `Enter the verification code sent to ${formData.email}`}
              </p>

              {status.msg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 p-4 rounded-xl text-sm flex items-start gap-3 ${status.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-green-500/10 border border-green-500/30 text-green-400'}`}>
                  {status.type === 'error' ? <AlertCircle size={18} className="mt-0.5 flex-shrink-0" /> : <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />} 
                  <span className="leading-relaxed">{status.msg}</span>
                </motion.div>
              )}

              <form onSubmit={step === 1 ? handleRequestOTP : handleResetPassword} className="space-y-5">
                
                {/* STEP 1 INPUT */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <label className="block text-sm font-medium text-neutral-400 mb-1.5">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={18} className="text-neutral-500"/></div>
                        <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="name@example.com" />
                    </div>
                  </motion.div>
                )}

                {/* STEP 2 INPUTS */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1.5">6-Digit Code</label>
                      <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Key size={18} className="text-neutral-500"/></div>
                          <input required type="text" maxLength="6" value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono tracking-widest text-lg" placeholder="000000" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1.5 mt-2">New Password</label>
                      <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={18} className="text-neutral-500"/></div>
                          <input required type="password" value={formData.newPassword} onChange={(e) => setFormData({...formData, newPassword: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="••••••••" />
                      </div>
                    </div>
                    <div className="pt-2">
                      <button type="button" onClick={() => { setStep(1); setStatus({type:'', msg:''}); }} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                          Wrong email? Go back
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* SUBMIT BUTTON */}
                <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white py-4 rounded-xl font-bold transition-all mt-4 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : step === 1 ? (
                    'Send Recovery Code'
                  ) : (
                    'Reset My Password'
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ForgotPassword;