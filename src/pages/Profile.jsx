import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Package, Clock, CheckCircle, Truck, XCircle, LogOut, 
  AlertTriangle, User as UserIcon, Shield, Menu, X, ArrowLeft,
  Heart, Download, Trash2, Star, Send, Loader2
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Review Modal States
  const [reviewModal, setReviewModal] = useState({ show: false, productId: null, productName: '', rating: 5, comment: '' });
  const [reviewStatus, setReviewStatus] = useState({ loading: false, error: null, success: false });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, wishlistRes] = await Promise.all([
        api.get('/orders/'),
        api.get('/wishlists/') 
      ]);
      setOrders(ordersRes.data);
      const userWishlist = wishlistRes.data.length > 0 ? wishlistRes.data[0].products : [];
      setWishlist(userWishlist);
    } catch (err) {
      console.error("Failed to fetch profile data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const removeFromWishlist = async (productId) => {
    const previousWishlist = [...wishlist];
    setWishlist(wishlist.filter(p => p.id !== productId));
    
    try {
       await api.patch(`/wishlists/${user.id}/`, { remove_product_id: productId }); 
    } catch (err) {
       console.error("Failed to remove from wishlist");
       setWishlist(previousWishlist);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/').split('/api')[0];
    return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const downloadPDF = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/invoice/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_Order_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("Invoice is not ready yet or an error occurred.");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModal.comment.trim()) return;
    
    setReviewStatus({ loading: true, error: null, success: false });
    try {
      await api.post('/reviews/', {
        product: reviewModal.productId,
        rating: reviewModal.rating,
        comment: reviewModal.comment
      });
      setReviewStatus({ loading: false, error: null, success: true });
      setTimeout(() => {
        setReviewModal({ show: false, productId: null, productName: '', rating: 5, comment: '' });
        setReviewStatus({ loading: false, error: null, success: false });
      }, 2000);
    } catch (err) {
      setReviewStatus({ 
        loading: false, 
        error: err.response?.data?.error || err.response?.data?.detail || "You must purchase and receive this item before reviewing.", 
        success: false 
      });
    }
  };

  const OrderTimeline = ({ status }) => {
    const steps = [
      { id: 'PENDING', label: 'Placed', icon: <Package size={16}/> },
      { id: 'PROCESSING', label: 'Confirmed', icon: <CheckCircle size={16}/> },
      { id: 'SHIPPED', label: 'Shipped', icon: <Truck size={16}/> },
      { id: 'DELIVERED', label: 'Delivered', icon: <CheckCircle size={16}/> }
    ];

    if (status === 'CANCELLED') {
        return (
            <div className="flex items-center gap-3 text-red-500 font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                <XCircle size={24} /> This order was cancelled.
            </div>
        )
    }

    const currentStepIndex = steps.findIndex(s => s.id === status);

    return (
      <div className="flex items-center w-full my-8">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isLast = index === steps.length - 1;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isCompleted ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-neutral-900 border-neutral-700 text-neutral-500'}`}>
                  {step.icon}
                </div>
                <span className={`text-xs font-bold mt-2 absolute -bottom-6 whitespace-nowrap transition-colors duration-500 ${isCompleted ? 'text-indigo-400' : 'text-neutral-600'}`}>{step.label}</span>
              </div>
              {!isLast && (
                <div className="flex-1 h-1 mx-2 bg-neutral-800 rounded-full overflow-hidden relative">
                   <div className={`absolute top-0 left-0 h-full bg-indigo-600 transition-all duration-1000 ease-out`} style={{ width: index < currentStepIndex ? '100%' : '0%' }}></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const getStatusConfig = (status, approved) => {
    if (status === 'CANCELLED') return { icon: <XCircle className="text-red-500" />, text: 'Cancelled / Rejected', color: 'border-red-500/50 bg-red-500/10 text-red-500' };
    if (status === 'DELIVERED') return { icon: <CheckCircle className="text-green-500" />, text: 'Delivered', color: 'border-green-500/50 bg-green-500/10 text-green-500' };
    if (status === 'SHIPPED') return { icon: <Truck className="text-blue-500" />, text: 'Shipped', color: 'border-blue-500/50 bg-blue-500/10 text-blue-500' };
    if (status === 'PROCESSING' || approved) return { icon: <Package className="text-indigo-500" />, text: 'Processing', color: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' };
    return { icon: <Clock className="text-amber-500" />, text: 'Awaiting Approval', color: 'border-amber-500/50 bg-amber-500/10 text-amber-500' };
  };

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
          onClick={() => { setActiveTab('wishlist'); setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'wishlist' ? 'bg-pink-600/10 text-pink-400 border border-pink-500/20' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
        >
          <Heart size={18} /> My Wishlist
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
      
      {/* REVIEW MODAL */}
      <AnimatePresence>
        {reviewModal.show && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl relative"
            >
              <button onClick={() => setReviewModal({ show: false, productId: null, productName: '', rating: 5, comment: '' })} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors bg-neutral-800 p-1.5 rounded-full">
                <X size={18}/>
              </button>
              
              <h3 className="text-xl font-bold mb-1 text-white">Rate Product</h3>
              <p className="text-sm text-neutral-400 mb-6 line-clamp-1">{reviewModal.productName}</p>

              {reviewStatus.error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-2">
                      <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" /> 
                      <span>{reviewStatus.error}</span>
                  </div>
              )}
              {reviewStatus.success && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-start gap-2">
                      <CheckCircle size={16} className="mt-0.5 flex-shrink-0" /> 
                      <span>Review submitted successfully!</span>
                  </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Rating</label>
                      <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((num) => (
                              <button 
                                  type="button"
                                  key={num}
                                  onClick={() => setReviewModal({...reviewModal, rating: num})}
                                  className="focus:outline-none transition-transform hover:scale-110"
                              >
                                  <Star size={28} className={num <= reviewModal.rating ? "text-yellow-500 fill-yellow-500" : "text-neutral-700"} />
                              </button>
                          ))}
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Your Comment</label>
                      <textarea 
                          required
                          value={reviewModal.comment}
                          onChange={(e) => setReviewModal({...reviewModal, comment: e.target.value})}
                          placeholder="What did you like or dislike about this product?"
                          className="w-full bg-black border border-neutral-800 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 h-28 custom-scrollbar resize-none"
                      />
                  </div>
                  <button 
                      disabled={reviewStatus.loading || !reviewModal.comment.trim() || reviewStatus.success} 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                  >
                      {reviewStatus.loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      Submit Review
                  </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 relative">
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
                  <div className="text-center py-20 border border-neutral-800 rounded-3xl bg-neutral-900/30 shadow-lg">
                    <Package size={48} className="mx-auto mb-4 text-neutral-600" />
                    <p className="text-neutral-400 text-lg">You haven't placed any orders yet.</p>
                    <Link to="/" className="inline-block mt-4 text-indigo-400 hover:text-indigo-300 font-medium">Start Shopping &rarr;</Link>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {orders.map(order => {
                      const statusCfg = getStatusConfig(order.status, order.payment_approved);
                      return (
                        <div key={order.id} className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-6 md:p-8 overflow-hidden relative shadow-lg">
                          
                          {/* Top Header */}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 pb-6 border-b border-neutral-800/80">
                            <div>
                              <h3 className="font-black text-2xl tracking-tight mb-1 text-white">Order #{order.id}</h3>
                              <p className="text-sm text-neutral-500 font-medium">{new Date(order.created_at).toLocaleString()}</p>
                            </div>
                            <div className="mt-4 md:mt-0 flex gap-3">
                                {order.status !== 'CANCELLED' && order.status !== 'PENDING' && (
                                   <button onClick={() => downloadPDF(order.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-700 hover:border-indigo-500 text-sm font-bold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-all shadow-md">
                                      <Download size={16}/> Invoice
                                   </button>
                                )}
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold shadow-sm ${statusCfg.color}`}>
                                  {statusCfg.icon} {statusCfg.text}
                                </div>
                            </div>
                          </div>

                          {/* TIMELINE */}
                          <div className="px-2 mb-10 mt-6">
                              <OrderTimeline status={order.status} />
                          </div>

                          {/* Rejection Reason Display */}
                          {order.status === 'CANCELLED' && order.rejection_reason && (
                            <div className="mb-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl flex gap-4 text-red-400 text-sm shadow-inner">
                              <AlertTriangle size={24} className="flex-shrink-0" />
                              <div>
                                <span className="font-bold block mb-1 text-base text-red-300">Reason for Rejection:</span>
                                {order.rejection_reason}
                              </div>
                            </div>
                          )}
                          
                          <div className="bg-black/30 rounded-2xl p-5 border border-neutral-800/50 mb-6">
                              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-800/50 pb-2">Order Items</h4>
                              <div className="space-y-3">
                                {order.items?.map(item => (
                                  <div key={item.id} className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-300 flex items-center gap-3">
                                      <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-2 py-1 rounded text-xs font-black shadow-sm">{item.quantity}x</span> 
                                      <span className="font-medium text-white">{item.product_name || `Product ID: ${item.product}`}</span>
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-neutral-400">Rs. {item.price}</span>
                                        {/* Rate Item Shortcut */}
                                        {order.status === 'DELIVERED' && (
                                            <button 
                                                onClick={() => setReviewModal({ show: true, productId: item.product, productName: item.product_name, rating: 5, comment: '' })} 
                                                className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/30 shadow-md flex items-center gap-1"
                                            >
                                                <Star size={12} /> Rate Item
                                            </button>
                                        )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900 p-5 rounded-2xl border border-neutral-800 shadow-md">
                            <div className="text-sm">
                              <span className="text-neutral-500 block mb-1 font-medium">Payment Method</span>
                              <span className="text-white font-bold">{order.payment_method}</span>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto">
                              <span className="text-neutral-500 text-sm block mb-1 font-medium">Grand Total</span>
                              <span className="text-3xl font-black text-indigo-400 tracking-tight drop-shadow-md">Rs. {order.total_price}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold tracking-tight mb-2 text-pink-500 flex items-center gap-3"><Heart className="fill-pink-500"/> My Wishlist</h2>
                  <p className="text-neutral-400">Items you've saved for later.</p>
                </div>

                {loading ? (
                   <div className="flex justify-center py-20"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full" /></div>
                ) : wishlist.length === 0 ? (
                   <div className="text-center py-20 border border-neutral-800 rounded-3xl bg-neutral-900/30 shadow-lg">
                    <Heart size={48} className="mx-auto mb-4 text-neutral-600" />
                    <p className="text-neutral-400 text-lg">Your wishlist is empty.</p>
                    <Link to="/" className="inline-block mt-4 text-pink-500 hover:text-pink-400 font-bold">Discover Products &rarr;</Link>
                  </div>
                ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {wishlist.map(product => (
                         <div key={product.id} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 relative group shadow-lg hover:shadow-pink-500/10 transition-shadow">
                            <button onClick={() => removeFromWishlist(product.id)} className="absolute top-6 right-6 z-10 p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-md">
                               <Trash2 size={16}/>
                            </button>
                            <Link to={`/product/${product.id}`} className="block h-40 bg-black rounded-xl mb-4 overflow-hidden border border-neutral-800/50">
                               {product.image ? <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/> : <div className="w-full h-full flex items-center justify-center text-neutral-700">No Image</div>}
                            </Link>
                            <Link to={`/product/${product.id}`}><h3 className="font-bold text-lg hover:text-pink-400 transition-colors line-clamp-1">{product.name}</h3></Link>
                            <p className="text-neutral-400 text-sm mb-3">Rs. {product.price}</p>
                         </div>
                      ))}
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
                      <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 text-xs rounded-full font-medium border border-green-500/20 shadow-sm">
                        <Shield size={14} /> Verified Account
                      </div>
                    </div>
                  </div>

                  <form className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Username</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-600"><UserIcon size={18}/></div>
                        <input type="text" disabled value={user?.username || ''} className="w-full bg-black border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-neutral-500 cursor-not-allowed focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-600"><UserIcon size={18}/></div>
                        <input type="email" disabled value={user?.email || ''} className="w-full bg-black border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-neutral-500 cursor-not-allowed focus:outline-none" />
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