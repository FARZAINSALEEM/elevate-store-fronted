import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const AdminLogin = () => {
  const { login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const data = await login(formData.username, formData.password);
      // Verify if the user is actually staff!
      if (!data.user.is_staff) {
        logout(); // Kick them out if not admin
        setErrorMsg("Access Denied: You do not have administrator privileges.");
      } else {
        navigate('/admin-dashboard');
      }
    } catch (error) {
      setErrorMsg("Invalid Admin Credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 w-full h-[500px] bg-amber-600/10 blur-[150px] pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-neutral-900/80 border border-amber-900/30 rounded-3xl p-8 relative z-10 shadow-2xl shadow-amber-900/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-600 to-orange-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
            <Shield size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white">Admin Portal</h2>
          <p className="text-amber-500/70 text-sm mt-1">Authorized personnel only</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500"><User size={18} /></div>
            <input required type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-black/50 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Admin Username" />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500"><Lock size={18} /></div>
            <input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-black/50 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Admin Password" />
          </div>
          <button disabled={isLoading} type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] mt-6">
            {isLoading ? 'Verifying...' : 'Secure Login'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;