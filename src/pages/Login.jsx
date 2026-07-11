import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';


const Login = () => {
  const { login, registerUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        await registerUser(formData.username, formData.email, formData.password);
        await login(formData.username, formData.password);
      }
      setIsSuccess(true);
      setTimeout(() => navigate('/profile'), 1500);
    } catch (error) {
      setErrorMsg(error.response?.data?.error || error.message || "Authentication failed. Username might exist.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-5xl flex flex-col md:flex-row bg-[#0c0c0c] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Branding Side (Premium Amazon/Daraz vibe) */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-950 to-black p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-4">ELEVATE<span className="text-indigo-500">.</span></h1>
            <p className="text-indigo-200 text-lg leading-relaxed">Join the most premium tech marketplace. Discover cutting-edge gadgets, manage your orders, and experience lightning-fast delivery.</p>
          </div>
          <div className="relative z-10">
            <div className="flex -space-x-4 mb-4">
              {[1,2,3].map(i => <div key={i} className={`w-12 h-12 rounded-full border-2 border-indigo-950 bg-indigo-${i*200} flex items-center justify-center text-xs font-bold text-black`}>User</div>)}
            </div>
            <p className="text-sm text-indigo-300 font-medium">Join 10,000+ satisfied tech enthusiasts today.</p>
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-8 md:p-12 relative">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                <CheckCircle size={64} className="text-green-500 mb-6" />
                <h2 className="text-3xl font-bold text-white mb-2">{isLogin ? 'Welcome Back!' : 'Account Created!'}</h2>
                <p className="text-neutral-400">Securely routing you to your dashboard...</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-3xl font-bold text-white mb-2">{isLogin ? 'Sign In' : 'Create Account'}</h2>
                <p className="text-neutral-400 mb-8">{isLogin ? 'Enter your details to access your profile.' : 'Sign up to start shopping.'}</p>

                {errorMsg && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={18} /> <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1.5">Username</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={18} className="text-neutral-500"/></div>
                      <input required type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="johndoe" />
                    </div>
                  </div>
                  
                  {!isLogin && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="block text-sm font-medium text-neutral-400 mb-1.5 mt-4">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={18} className="text-neutral-500"/></div>
                        <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="john@example.com" />
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1.5 mt-4">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={18} className="text-neutral-500"/></div>
                      <input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="••••••••" />
                    </div>
                    {isLogin && (
                      <div className="flex justify-end mt-2">
                        <Link to="/forgot-password" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                          Forgot Password?
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  <button disabled={isLoading} type="submit" className="w-full bg-white hover:bg-neutral-200 text-black py-4 rounded-xl font-bold transition-all mt-8 flex justify-center items-center gap-2">
                    {isLoading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full" /> : (isLogin ? <><ArrowRight size={20}/> Sign In</> : <><ArrowRight size={20}/> Create Account</>)}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <button type="button" onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
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