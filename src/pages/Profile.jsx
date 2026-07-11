import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Package, Clock, CheckCircle, Truck, XCircle, LogOut, 
  AlertTriangle, User as UserIcon, Shield, Menu, X, ArrowLeft
} from 'lucide-react';
import api from '../services/api';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Fetch orders from Django backend
    api.get('/orders/')
      .then(res => setOrders(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusConfig = (status, approved) => {
    if (status === 'CANCELLED') return { icon: <XCircle className="text-red-500" />, text: 'Cancelled / Rejected', color: 'border-red-500/50 bg-red-500/10 text-red-500' };
    if (status === 'DELIVERED') return { icon: <CheckCircle className="text-green-500" />, text: 'Delivered', color: 'border-green-500/50 bg-green-500/10 text-green-500' };
    if (status === 'SHIPPED') return { icon: <Truck className="text-blue-500" />, text: 'Shipped', color: 'border-blue-500/50 bg-blue-500/10 text-blue-500' };
    if (status === 'PROCESSING' || approved) return { icon: <Package className="text-indigo-500" />, text: 'Processing (Payment Approved)', color: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' };
    return { icon: <Clock className="text-amber-500" />, text: 'Pending (Awaiting Approval)', color: 'border-amber-500/50 bg-amber-500/10 text-amber-500' };
  };

  // Sidebar component for reusability
  const Sidebar = () => (
    <div className="flex flex-col h-full bg-neutral-950 border-r border-neutral-900 w-64 p-6">
      <div className="mb-10 mt-16 md:mt-0">
        <h2 className="text-2xl font-black text-white tracking-tighter">My Account</h2>
      </div>
      
      <nav className="flex-1 space-y-2">
        <button 
          onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'orders' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
        >
          <Package size={18} /> Order History
        </button>
        <button 
          onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'profile' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
        >
          <UserIcon size={18} /> Account Details
        </button>
      </nav>

      <div className="mt-auto border-t border-neutral-900 pt-6">
        <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:bg-neutral-900 transition-colors mb-2">
           <ArrowLeft size={18} /> Back to Store
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden pt-16">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 z-50 md:hidden">
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:block h-[calc(100vh-64px)] sticky top-16 z-10">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-neutral-950 border-b border-neutral-900 flex items-center justify-between p-4">
          <h1 className="text-lg font-bold">My Account</h1>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-neutral-400 hover:text-white bg-neutral-900 rounded-lg">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
          <div className="max-w-4xl mx-auto">
            
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold tracking-tight mb-2">Order History & Tracking</h2>
                  <p className="text-neutral-400">View and track your latest purchases.</p>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-20 border border-neutral-800 rounded-3xl bg-neutral-900/30">
                    <Package size={48} className="mx-auto mb-4 text-neutral-600" />
                    <p className="text-neutral-400 text-lg">You haven't placed any orders yet.</p>
                    <Link to="/" className="inline-block mt-4 text-indigo-400 hover:text-indigo-300">Start Shopping &rarr;</Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map(order => {
                      const statusCfg = getStatusConfig(order.status, order.payment_approved);
                      return (
                        <div key={order.id} className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 md:p-8 overflow-hidden relative shadow-lg">
                          
                          {/* Status Ribbon */}
                          <div className={`absolute top-0 left-0 w-1 h-full ${order.status === 'CANCELLED' ? 'bg-red-500' : 'bg-indigo-500'}`} />

                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-neutral-800 pl-4">
                            <div>
                              <h3 className="font-bold text-xl mb-1">Order #{order.id}</h3>
                              <p className="text-sm text-neutral-400">{new Date(order.created_at).toLocaleString()}</p>
                            </div>
                            <div className={`mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium shadow-sm ${statusCfg.color}`}>
                              {statusCfg.icon} {statusCfg.text}
                            </div>
                          </div>

                          {/* Rejection Reason Display */}
                          {order.status === 'CANCELLED' && order.rejection_reason && (
                            <div className="mb-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl flex gap-4 text-red-400 text-sm ml-4">
                              <AlertTriangle size={24} className="flex-shrink-0" />
                              <div>
                                <span className="font-bold block mb-1 text-base text-red-300">Reason for Rejection:</span>
                                {order.rejection_reason}
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-3 mb-6 pl-4">
                            {order.items?.map(item => (
                              <div key={item.id} className="flex justify-between items-center text-sm bg-black/20 p-3 rounded-xl border border-neutral-800/50">
                                <span className="text-neutral-300 flex items-center gap-2">
                                  <span className="bg-neutral-800 px-2 py-1 rounded text-xs font-bold">{item.quantity}x</span> 
                                  {item.product_name || `Product ID: ${item.product}`}
                                </span>
                                <span className="font-bold">Rs. {item.price}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-6 border-t border-neutral-800 pl-4 gap-4">
                            <div className="text-sm">
                              <span className="text-neutral-500 block mb-1">Payment Method</span>
                              <span className="bg-neutral-800 px-3 py-1 rounded-md text-white font-medium">{order.payment_method}</span>
                            </div>
                            <div className="text-right w-full sm:w-auto">
                              <span className="text-neutral-500 text-sm block mb-1">Total Amount</span>
                              <span className="text-2xl font-black text-white">Rs. {order.total_price}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ACCOUNT DETAILS TAB */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold tracking-tight mb-2">Account Details</h2>
                  <p className="text-neutral-400">View your verified account information.</p>
                </div>
                
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-lg">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10 border-b border-neutral-800 pb-8 text-center sm:text-left">
                    <div className="w-24 h-24 bg-indigo-500/20 text-indigo-500 rounded-full flex items-center justify-center text-4xl font-bold uppercase shadow-inner border border-indigo-500/30">
                      {user?.username ? user.username.charAt(0) : 'U'}
                    </div>
                    <div className="pt-2">
                      <h3 className="text-2xl font-bold text-white mb-1">{user?.username}</h3>
                      <p className="text-neutral-400 mb-3">{user?.email}</p>
                      <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 text-xs rounded-full font-medium border border-green-500/20">
                        <Shield size={14} /> Verified Account
                      </div>
                    </div>
                  </div>

                  <form className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Username</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-600"><UserIcon size={18}/></div>
                        <input type="text" disabled value={user?.username} className="w-full bg-black border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-neutral-500 cursor-not-allowed focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-600"><UserIcon size={18}/></div>
                        <input type="email" disabled value={user?.email} className="w-full bg-black border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-neutral-500 cursor-not-allowed focus:outline-none" />
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">Email and username cannot be changed after registration for security purposes.</p>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;