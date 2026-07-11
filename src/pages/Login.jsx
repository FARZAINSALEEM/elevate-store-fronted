import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Mail, AlertCircle, CheckCircle, ArrowRight, Key, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import * as authService from '../services/authService';

const Login = () => {
  const { login, registerUser, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [regStep, setRegStep] = useState(1); // 1 = Details, 2 = OTP
  const [formData, setFormData] = useState({ username: '', email: '', password: '', otp: '' });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/profile');
  }, [user, navigate]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
        await authService.sendRegisterOtp(formData.email);
        setRegStep(2);
        setErrorMsg('');
    } catch (err) {
        setErrorMsg(err.message || "Failed to send OTP.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        // Step 2 of registration: Send everything including OTP
        await registerUser(formData.username, formData.email, formData.password, formData.otp);
        await login(formData.username, formData.password); // Auto login after success
      }
      setIsSuccess(true);
      setTimeout(() => navigate('/profile'), 1500);
    } catch (error) {
      setErrorMsg(error.response?.data?.error || error.message || "Authentication failed.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 pt-20 font-sans">
      <div className="w-full max-w-5xl flex flex-col md:flex-row bg-[#0c0c0c] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
        
        {/* Branding Side (Premium Vibe) */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-950 to-black p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-4">ELEVATE<span className="text-indigo-500">.</span></h1>
            <p className="text-indigo-200 text-lg leading-relaxed">Join the most premium tech marketplace. Discover cutting-edge gadgets, manage your orders, and experience lightning-fast delivery.</p>
          </div>
          <div className="relative z-10">
            <div className="flex -space-x-4 mb-4">
              {[1,2,3].map(i => (
                <div key={i} className={`w-12 h-12 rounded-full border-2 border-indigo-950 bg-indigo-${i*200} flex items-center justify-center text-xs font-bold text-black shadow-lg`}>
                  User
                </div>
              ))}
            </div>
            <p className="text-sm text-indigo-300 font-medium">Join 10,000+ satisfied tech enthusiasts today.</p>
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-8 md:p-12 relative flex flex-col justify-center min-h-[500px]">
          <AnimatePresence mode="wait">
            
            {/* SUCCESS SCREEN */}
            {isSuccess ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20"
                >
                  <CheckCircle size={40} className="text-green-500" />
                </motion.div>
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{isLogin ? 'Welcome Back!' : 'Account Created!'}</h2>
                <p className="text-neutral-400">Securely routing you to your dashboard...</p>
              </motion.div>
            ) : (
              
              /* FORM SCREEN */
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{isLogin ? 'Sign In' : 'Create Account'}</h2>
                <p className="text-neutral-400 mb-8">
                  {isLogin ? 'Enter your details to access your profile.' 
                   : (regStep === 1 ? 'Enter your details to join Elevate.' : `Enter the verification code sent to ${formData.email}`)}
                </p>

                {errorMsg && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" /> 
                    <span className="leading-relaxed">{errorMsg}</span>
                  </motion.div>
                )}

                <form onSubmit={!isLogin && regStep === 1 ? handleSendOTP : handleSubmit} className="space-y-4">
                  
                  {/* STEP 1: Basic Details (Login OR Register) */}
                  {(isLogin || regStep === 1) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-400 mb-1.5">Username</label>
                          <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={18} className="text-neutral-500"/></div>
                              <input required type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="johndoe" />
                          </div>
                        </div>
                        
                        {/* Only show email field during registration */}
                        {!isLogin && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              <label className="block text-sm font-medium text-neutral-400 mb-1.5 mt-2">Email Address</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={18} className="text-neutral-500"/></div>
                                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="john@example.com" />
                              </div>
                          </motion.div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-neutral-400 mb-1.5 mt-2">Password</label>
                          <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={18} className="text-neutral-500"/></div>
                              <input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="••••••••" />
                          </div>
                          {isLogin && (
                              <div className="flex justify-end mt-3">
                                <Link to="/forgot-password" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Forgot Password?
                                </Link>
                              </div>
                          )}
                        </div>
                    </motion.div>
                  )}

                  {/* STEP 2: OTP Verification (Register Only) */}
                  {!isLogin && regStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                         <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1.5 mt-2">6-Digit Verification Code</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Key size={18} className="text-neutral-500"/></div>
                                <input required type="text" maxLength="6" value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono tracking-widest text-lg" placeholder="000000" />
                            </div>
                        </div>
                        <div className="pt-2">
                          <button type="button" onClick={() => { setRegStep(1); setErrorMsg(''); }} className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                              Wrong email? Go back
                          </button>
                        </div>
                    </motion.div>
                  )}
                  
                  {/* SUBMIT BUTTON */}
                  <button disabled={isLoading} type="submit" className="w-full bg-white hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-black py-4 rounded-xl font-bold transition-all mt-6 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : isLogin ? (
                      <><ArrowRight size={20}/> Sign In</>
                    ) : regStep === 1 ? (
                      <><Mail size={20}/> Verify Email</>
                    ) : (
                      <><CheckCircle size={20}/> Create Account</>
                    )}
                  </button>
                </form>

                {/* TOGGLE LOGIN/REGISTER */}
                <div className="mt-8 text-center pt-6 border-t border-neutral-800/50">
                  <button type="button" onClick={() => { setIsLogin(!isLogin); setRegStep(1); setErrorMsg(''); }} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                    {isLogin ? "New to Elevate? Create an account" : "Already have an account? Sign in"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Login;