import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { Package, Clock, CheckCircle, Truck, XCircle, LogOut } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) navigate('/login');
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
    if (status === 'CANCELLED') return { icon: <XCircle className="text-red-500" />, text: 'Cancelled', color: 'border-red-500/50 bg-red-500/10 text-red-500' };
    if (status === 'DELIVERED') return { icon: <CheckCircle className="text-green-500" />, text: 'Delivered', color: 'border-green-500/50 bg-green-500/10 text-green-500' };
    if (status === 'SHIPPED') return { icon: <Truck className="text-blue-500" />, text: 'Shipped', color: 'border-blue-500/50 bg-blue-500/10 text-blue-500' };
    if (status === 'PROCESSING' || approved) return { icon: <Package className="text-indigo-500" />, text: 'Processing (Payment Approved)', color: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' };
    return { icon: <Clock className="text-amber-500" />, text: 'Pending (Awaiting Payment)', color: 'border-amber-500/50 bg-amber-500/10 text-amber-500' };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 bg-neutral-900/50 border border-neutral-800 p-6 rounded-3xl">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.username}</h1>
            <p className="text-neutral-400">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="mt-4 md:mt-0 flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-2.5 rounded-full hover:bg-red-500/20 transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Package className="text-indigo-500"/> Order History & Tracking</h2>
        
        {loading ? (
          <div className="flex justify-center py-20"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 border border-neutral-800 rounded-3xl bg-neutral-900/30">
            <p className="text-neutral-400 text-lg">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => {
              const statusCfg = getStatusConfig(order.status, order.payment_approved);
              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-neutral-800">
                    <div>
                      <h3 className="font-bold text-lg">Order #{order.id}</h3>
                      <p className="text-sm text-neutral-400">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div className={`mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${statusCfg.color}`}>
                      {statusCfg.icon} {statusCfg.text}
                    </div>
                  </div>
                  
                  {order.status === 'CANCELLED' && order.rejection_reason && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                      <strong className="text-red-400 block mb-1">Reason for Rejection:</strong>
                      {order.rejection_reason}
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-neutral-300">{item.quantity}x Product ID: {item.product}</span>
                        <span className="font-medium">Rs. {item.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                    <span className="text-neutral-400 text-sm">Method: {order.payment_method}</span>
                    <span className="text-xl font-bold">Total: Rs. {order.total_price}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
