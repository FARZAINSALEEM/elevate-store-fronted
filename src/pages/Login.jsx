import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

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
        await login(formData.username, formData.password); // Auto-login after signup
      }
      
      // Show success animation before redirecting
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/'); 
      }, 1500);

    } catch (error) {
      // Better error handling for 500 errors (like duplicate usernames)
      setErrorMsg(error.response?.data?.error || error.message || "Authentication failed. Username might already exist.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden pt-20">
      <div className="absolute top-0 w-full h-[500px] bg-indigo-600/10 blur-[150px] pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-neutral-900/80 border border-indigo-900/30 rounded-3xl p-8 relative z-10 shadow-2xl shadow-indigo-900/20">
        
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-10"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {isLogin ? 'Welcome Back!' : 'Account Created!'}
              </h2>
              <p className="text-neutral-400">Securely redirecting you...</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="text-indigo-400 text-sm mt-2">{isLogin ? 'Sign in to your account' : 'Join us for premium tech'}</p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={18} className="flex-shrink-0" /> 
                  <span className="flex-1">{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500"><User size={18} /></div>
                  <input required type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-black/50 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Username" />
                </div>
                
                {!isLogin && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500"><Mail size={18} /></div>
                    <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-black/50 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Email Address" />
                  </motion.div>
                )}

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500"><Lock size={18} /></div>
                  <input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-black/50 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Password" />
                </div>
                
                <button disabled={isLoading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] mt-6 flex justify-center items-center">
                  {isLoading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (isLogin ? 'Sign In' : 'Sign Up')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button type="button" onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} className="text-sm text-neutral-400 hover:text-white transition-colors">
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login;