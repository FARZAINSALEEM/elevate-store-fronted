import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Plus, Trash2, Package, DollarSign, AlertTriangle, 
  MessageCircle, Settings, ShoppingBag, X, Send, CheckCircle, 
  Truck, Download, Search, UserCircle, Minus, Eraser, CheckSquare,
  Mail, FileText, Users, Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [chats, setChats] = useState([]);
  const [storeSettings, setStoreSettings] = useState({ 
    jazzcash_number: '', easypaisa_number: '', support_email: '', support_phone: '' 
  });
  
  // UI States
  const [showAddForm, setShowAddForm] = useState(false);
  const [rejectModal, setRejectModal] = useState({ show: false, orderId: null, reason: '' });
  const [newProduct, setNewProduct] = useState({ 
    name: '', price: '', stock: '', description: '', image: null, gallery_images: [],
    rating: 4.5, warranty: '1 Year Warranty', return_time: '7 Days Return' 
  });
  const [replyText, setReplyText] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Premium Feature States
  const [cleanupDays, setCleanupDays] = useState(30);
  const [marketingData, setMarketingData] = useState({ category: 'ALL', subject: '', body: '' });
  const [isSendingEmails, setIsSendingEmails] = useState(false);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/').split('/api')[0];
    return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  useEffect(() => {
    if (!user?.is_staff) {
      navigate('/admin-login');
      return;
    }
    fetchData();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [productsRes, statsRes, ordersRes, settingsRes] = await Promise.all([
        api.get('/products/'),
        api.get('/admin/dashboard/'),
        api.get('/orders/'),
        api.get('/settings/')
      ]);
      setProducts(productsRes.data);
      setStats(statsRes.data);
      setOrders(ordersRes.data);
      setStoreSettings(settingsRes.data);
      fetchChats();
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (error.response?.status === 401) {
        logout();
        navigate('/admin-login');
      }
    }
  };

  const fetchChats = async () => {
    try {
      const chatRes = await api.get('/chat/admin/');
      setChats(Array.isArray(chatRes.data) ? chatRes.data : []);
    } catch(err) {
      console.error("Chat polling error:", err);
    }
  };

  const handleUpdateOrderStatus = async (id, status, reason = null) => {
    const payload = { status };
    if (status === 'PROCESSING') payload.payment_approved = true;
    if (reason) payload.rejection_reason = reason;

    try {
      await api.patch(`/orders/${id}/`, payload);
      fetchData();
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status.");
    }
  };

  const handleUpdateStock = async (id, currentStock, change) => {
    const newStock = currentStock + change;
    if (newStock < 0) return;
    try {
      await api.patch(`/products/${id}/`, { stock: newStock });
      setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const submitRejection = () => {
    if (!rejectModal.reason.trim()) return alert("Please enter a reason for rejection.");
    handleUpdateOrderStatus(rejectModal.orderId, 'CANCELLED', rejectModal.reason);
    setRejectModal({ show: false, orderId: null, reason: '' });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData();
    Object.keys(newProduct).forEach(key => {
      if (key === 'gallery_images') {
        Array.from(newProduct[key]).forEach(file => formData.append('uploaded_images', file));
      } else if (newProduct[key] !== null && newProduct[key] !== '') {
        formData.append(key, newProduct[key]);
      }
    });

    try {
      await api.post('/products/', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewProduct({ name: '', price: '', stock: '', description: '', image: null, gallery_images: [], rating: 4.5, warranty: '1 Year Warranty', return_time: '7 Days Return' });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to add product. Check required fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        await api.delete(`/products/${id}/`);
        fetchData();
      } catch (err) {
        alert("Failed to delete product.");
      }
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/settings/', storeSettings);
      alert('Store settings updated successfully!');
    } catch (err) {
      alert('Failed to update settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (ticketId) => {
    const message = replyText[ticketId];
    if (!message || !message.trim()) return;
    
    try {
      await api.post('/chat/admin/', { ticket_id: ticketId, message: message });
      setReplyText({...replyText, [ticketId]: ''});
      fetchChats(); 
    } catch (err) {
      console.error(err);
      alert("Failed to send reply.");
    }
  };

  const handleResolveTicket = async (ticketId) => {
    if (window.confirm("Are you sure you want to close this ticket? The user will be notified via email.")) {
      try {
        await api.post('/chat/admin/', { ticket_id: ticketId, action: 'resolve' });
        fetchChats();
      } catch (err) {
        console.error(err);
        alert("Failed to resolve ticket.");
      }
    }
  };

  const triggerOrderCleanup = async () => {
    if (window.confirm(`Are you sure you want to wipe all CANCELLED orders older than ${cleanupDays} days? This will permanently delete them.`)) {
       try {
           await api.post('/admin/cleanup-orders/', { days: parseInt(cleanupDays) }); 
           alert("Cleanup successful! Old cancelled orders have been removed.");
           fetchData();
       } catch (err) {
           console.error(err);
           alert("Failed to trigger cleanup script.");
       }
    }
  };

  const handleSendBulkEmail = async (e) => {
    e.preventDefault();
    if (!marketingData.subject || !marketingData.body) return alert("Subject and body are required.");
    setIsSendingEmails(true);
    try {
      await api.post('/admin/bulk-email/', marketingData);
      alert("Marketing emails queued successfully!");
      setMarketingData({ category: 'ALL', subject: '', body: '' });
    } catch (error) {
      alert("Failed to send bulk emails.");
      console.error(error);
    } finally {
      setIsSendingEmails(false);
    }
  };

  const downloadReport = async (type) => {
    try {
      const response = await api.get(`/admin/reports/${type}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      alert(`Failed to download ${type} report.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-6 lg:p-10 relative font-sans">
      
      {/* Rejection Modal Overlay */}
      <AnimatePresence>
        {rejectModal.show && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                  <AlertTriangle size={20}/> Reject Order
                </h3>
                <button onClick={() => setRejectModal({ show: false, orderId: null, reason: '' })} className="text-neutral-500 hover:text-white transition-colors bg-neutral-800 p-1.5 rounded-full">
                  <X size={18}/>
                </button>
              </div>
              <p className="text-neutral-400 text-sm mb-4">Provide a reason for rejection. The customer will see this message in their profile and receive an email notification.</p>
              <textarea 
                className="w-full bg-black border border-neutral-700 rounded-xl p-4 text-white focus:border-red-500 focus:outline-none mb-6 h-32 custom-scrollbar resize-none"
                placeholder="e.g. Payment receipt is invalid, insufficient amount transferred, or item out of stock..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({...rejectModal, reason: e.target.value})}
              />
              <div className="flex gap-3">
                <button onClick={() => setRejectModal({ show: false, orderId: null, reason: '' })} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl transition">Cancel</button>
                <button onClick={submitRejection} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition shadow-[0_0_15px_rgba(220,38,38,0.4)]">Confirm Rejection</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900/50 p-6 sm:p-8 rounded-3xl border border-amber-900/30 shadow-lg">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Admin Portal</h1>
            <p className="text-amber-500/80 font-medium mt-1">Welcome back, {user?.username} (Superuser)</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => downloadReport('sales')} className="flex items-center gap-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20 px-4 py-2.5 rounded-xl transition-all font-bold text-sm">
              <FileText size={16} /> Sales Report
            </button>
            <button onClick={() => downloadReport('stock')} className="flex items-center gap-2 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/20 px-4 py-2.5 rounded-xl transition-all font-bold text-sm">
              <Package size={16} /> Stock Report
            </button>
            <button onClick={() => logout()} className="flex items-center gap-2 bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600/20 px-5 py-2.5 rounded-xl transition-all font-bold text-sm">
              <LogOut size={16} /> Exit
            </button>
          </div>
        </div>

        {/* Stats Row & Area Chart */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col gap-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex items-center gap-5 shadow-md">
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl"><DollarSign size={28} /></div>
                <div>
                  <p className="text-neutral-400 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-black tracking-tight text-white">Rs. {stats.total_sales}</p>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex items-center gap-5 shadow-md">
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-2xl"><Package size={28} /></div>
                <div>
                  <p className="text-neutral-400 text-sm font-medium">Total Orders Processed</p>
                  <p className="text-3xl font-black tracking-tight text-white">{stats.total_orders}</p>
                </div>
              </motion.div>
            </div>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-md flex flex-col">
              <h3 className="text-xl font-bold mb-6 text-white">Recent Sales Overview</h3>
              <div className="flex-1 min-h-[200px] w-full">
                {stats.sales_data?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.sales_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs.${val}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '12px', color: '#fff' }} 
                        itemStyle={{ color: '#a78bfa', fontWeight: 'bold' }} 
                      />
                      <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-neutral-500 font-medium bg-black/20 rounded-xl border border-neutral-800/50">
                     No recent sales data to display in graph.
                   </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pb-2 border-b border-neutral-800">
          <button onClick={() => setActiveTab('inventory')} className={`px-6 py-3.5 rounded-t-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-amber-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}>
            <Package size={18} /> Inventory Manager
          </button>
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-3.5 rounded-t-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}>
            <ShoppingBag size={18} /> Customer Orders
          </button>
          <button onClick={() => setActiveTab('chats')} className={`px-6 py-3.5 rounded-t-xl font-bold transition-all flex items-center gap-2 relative ${activeTab === 'chats' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}>
            <MessageCircle size={18} /> Support Desk
            {Array.isArray(chats) && chats.length > 0 && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-neutral-900"></span>}
          </button>
          <button onClick={() => setActiveTab('marketing')} className={`px-6 py-3.5 rounded-t-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'marketing' ? 'bg-emerald-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}>
            <Mail size={18} /> Campaigns
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-6 py-3.5 rounded-t-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-neutral-200 text-black' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}>
            <Settings size={18} /> Configuration
          </button>
        </div>

        <div className="mt-6">
          
          {/* INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-2xl font-bold text-white">Manage Products</h2>
                <button onClick={() => setShowAddForm(!showAddForm)} className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg ${showAddForm ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white'}`}>
                  {showAddForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add New Product</>}
                </button>
              </div>

              <AnimatePresence>
                {showAddForm && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddProduct} 
                    className="bg-black p-6 md:p-8 rounded-2xl border border-amber-900/30 mb-8 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-hidden"
                  >
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1.5">Product Name</label>
                      <input required type="text" placeholder="e.g. Premium Headphones" className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 text-white focus:outline-none focus:border-amber-500 transition-colors" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1.5">Price (Rs)</label>
                        <input required type="number" placeholder="0.00" className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 text-white focus:outline-none focus:border-amber-500 transition-colors" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1.5">Stock</label>
                        <input required type="number" placeholder="10" className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 text-white focus:outline-none focus:border-amber-500 transition-colors" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                      </div>
                    </div>
                    
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-neutral-400 mb-1.5">Primary Image (Thumbnail)</label>
                      <input required type="file" accept="image/*" className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-600/20 file:text-amber-500 hover:file:bg-amber-600/30 transition-colors cursor-pointer" onChange={e => setNewProduct({...newProduct, image: e.target.files[0]})} />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-neutral-400 mb-1.5">Gallery Images (Multiple Allowed)</label>
                      <input type="file" multiple accept="image/*" className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600/20 file:text-indigo-500 hover:file:bg-indigo-600/30 transition-colors cursor-pointer" onChange={e => setNewProduct({...newProduct, gallery_images: e.target.files})} />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-400 mb-1.5">Detailed Description</label>
                      <textarea required placeholder="Features, specifications..." className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 text-white focus:outline-none focus:border-amber-500 transition-colors h-28 custom-scrollbar" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                    </div>
                    
                    <button disabled={isSubmitting} type="submit" className="md:col-span-2 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 text-white py-4 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)] mt-2">
                      {isSubmitting ? 'Uploading Product...' : 'Save Product to Inventory'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="overflow-x-auto bg-black rounded-2xl border border-neutral-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider bg-neutral-900/50">
                      <th className="p-5 font-bold">Product Item</th>
                      <th className="p-5 font-bold">Price</th>
                      <th className="p-5 font-bold">Stock Status</th>
                      <th className="p-5 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {products.length === 0 ? (
                       <tr><td colSpan="4" className="p-8 text-center text-neutral-500 font-medium">Inventory is empty. Add a product above.</td></tr>
                    ) : products.map(product => (
                      <tr key={product.id} className="hover:bg-neutral-900/50 transition-colors group">
                        <td className="p-5 flex items-center gap-4">
                          <div className="w-14 h-14 bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 flex-shrink-0">
                            {product.image ? <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <Package className="w-full h-full p-3 text-neutral-600"/>}
                          </div>
                          <span className="font-bold text-white text-base line-clamp-2">{product.name}</span>
                        </td>
                        <td className="p-5 font-medium text-white whitespace-nowrap">Rs. {product.price}</td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleUpdateStock(product.id, product.stock, -1)} className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition">
                              <Minus size={14} />
                            </button>
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap ${product.stock > 5 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                              {product.stock} in stock
                            </span>
                            <button onClick={() => handleUpdateStock(product.id, product.stock, 1)} className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition">
                              <Plus size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="p-5 text-right">
                          <button onClick={() => handleDeleteProduct(product.id)} className="text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 p-2.5 rounded-lg transition-colors border border-red-500/20">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                  <h2 className="text-2xl font-bold text-white">Customer Orders</h2>
                  <div className="flex items-center gap-2 bg-black border border-neutral-800 p-1.5 rounded-2xl">
                    <input 
                      type="number" 
                      value={cleanupDays} 
                      onChange={(e) => setCleanupDays(e.target.value)} 
                      min="1"
                      className="w-16 bg-neutral-900 rounded-xl p-2 text-sm text-center text-white focus:outline-none focus:ring-1 focus:ring-red-500" 
                    />
                    <span className="text-sm text-neutral-400 font-medium px-1">days</span>
                    <button onClick={triggerOrderCleanup} className="bg-neutral-800 hover:bg-red-600/20 border border-transparent hover:border-red-500/30 text-neutral-400 hover:text-red-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                        <Eraser size={16}/> Wipe Cancelled
                    </button>
                  </div>
              </div>

              <div className="space-y-6">
                {orders.length === 0 ? (
                  <div className="text-center py-12 bg-black rounded-2xl border border-neutral-800 text-neutral-500 font-medium">No orders received yet.</div>
                ) : orders.map(order => (
                  <div key={order.id} className="bg-black border border-neutral-800 rounded-2xl p-6 flex flex-col lg:flex-row gap-8 shadow-lg relative overflow-hidden">
                    
                    <div className={`absolute left-0 top-0 w-1 h-full ${order.status==='CANCELLED'?'bg-red-500':order.status==='DELIVERED'?'bg-green-500':'bg-indigo-500'}`}></div>

                    <div className="flex-1 space-y-5">
                      <div className="flex flex-wrap justify-between items-start gap-4 border-b border-neutral-800 pb-5">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">Order #{order.id}</h3>
                          <p className="text-sm text-neutral-400 font-medium">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                          order.status === 'DELIVERED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                          'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                        <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/50">
                          <p className="text-neutral-500 mb-2 font-semibold uppercase tracking-wider text-xs">Customer Details</p>
                          <p className="font-bold text-white text-base mb-1">{order.user_name}</p>
                          <p className="text-neutral-300">📞 {order.phone_number}</p>
                        </div>
                        <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/50">
                          <p className="text-neutral-500 mb-2 font-semibold uppercase tracking-wider text-xs">Delivery & Payment</p>
                          <p className="text-neutral-300 mb-2 whitespace-pre-wrap">{order.shipping_address}</p>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${order.payment_method === 'COD' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-400'}`}>
                            {order.payment_method === 'COD' ? 'Cash on Delivery' : 'Online Transfer'}
                          </span>
                          
                          {/* Payment Verification / Approval Flow (Updated for both COD and Online) */}
                          {order.status === 'PENDING' && !order.payment_approved && (
                              <div className="mt-4 pt-4 border-t border-neutral-700/50">
                                  {order.payment_method === 'ONLINE' && order.payment_screenshot && (
                                    <div className="mb-4">
                                      <p className="text-neutral-400 mb-2 text-xs font-bold uppercase">Customer Payment Proof:</p>
                                      <a href={getImageUrl(order.payment_screenshot)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                                          <Download size={14}/> View Screenshot
                                      </a>
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                      <button onClick={() => handleUpdateOrderStatus(order.id, 'PROCESSING')} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition shadow-md flex items-center justify-center gap-1"><CheckCircle size={14}/> Approve</button>
                                      <button onClick={() => setRejectModal({ show: true, orderId: order.id, reason: '' })} className="flex-1 px-3 py-2 bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-500 hover:text-white rounded-lg text-xs font-bold transition shadow-md flex items-center justify-center gap-1"><X size={14}/> Reject</button>
                                  </div>
                              </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Shipping/Delivery Actions */}
                      {order.payment_approved && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                        <div className="pt-2 flex gap-3">
                           {order.status === 'PROCESSING' && (
                             <button onClick={() => handleUpdateOrderStatus(order.id, 'SHIPPED')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2">
                               <Truck size={16}/> Mark as Shipped
                             </button>
                           )}
                           {order.status === 'SHIPPED' && (
                             <button onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')} className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2">
                               <CheckCircle size={16}/> Mark as Delivered
                             </button>
                           )}
                        </div>
                      )}
                    </div>

                    <div className="lg:w-80 bg-neutral-900 rounded-2xl p-5 border border-neutral-800 flex flex-col justify-between h-fit">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">Order Items</h4>
                        <div className="space-y-3 mb-6 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-black/40 p-2.5 rounded-lg border border-neutral-800/50">
                              <span className="text-neutral-300 font-medium">
                                <span className="text-indigo-400 font-bold mr-2">{item.quantity}x</span> 
                                {item.product_name}
                              </span>
                              <span className="text-white font-bold text-xs whitespace-nowrap">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-neutral-700 pt-4 text-lg font-black">
                        <span className="text-neutral-400">Total</span>
                        <span className="text-indigo-400">Rs. {parseFloat(order.total_price).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* CHATS TAB */}
          {activeTab === 'chats' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-8 text-white">Customer Support Desk</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.isArray(chats) && chats.length === 0 ? (
                  <div className="lg:col-span-2 text-center py-16 bg-black rounded-2xl border border-neutral-800 text-neutral-500">
                    <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No active support tickets from customers.</p>
                  </div>
                ) : chats?.map(chat => (
                  <div key={chat.ticket_id} className="bg-black border border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-[450px] shadow-lg">
                    <div className="bg-blue-600/10 p-5 border-b border-blue-900/30 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-blue-400 flex items-center gap-2"><UserCircle size={16}/> Customer: {chat.user}</h3>
                        <p className="text-xs text-neutral-500 mt-1">Ticket #{chat.ticket_id} • Active</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                          <span className="text-xs bg-black/50 text-neutral-400 px-3 py-1 rounded-full border border-neutral-800">{chat.last_updated}</span>
                          <button onClick={() => handleResolveTicket(chat.ticket_id)} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-md">
                              <CheckSquare size={14}/> Mark Resolved
                          </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4 bg-neutral-950">
                      {chat.messages?.map((m, i) => (
                        <div key={i} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm shadow-sm ${m.is_admin ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-bl-sm'}`}>
                             {m.text}
                           </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex gap-3 items-center">
                      <input 
                        type="text" 
                        placeholder="Type a reply to the customer..." 
                        className="flex-1 bg-black border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        value={replyText[chat.ticket_id] || ''}
                        onChange={(e) => setReplyText({...replyText, [chat.ticket_id]: e.target.value})}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendReply(chat.ticket_id)}
                      />
                      <button 
                        onClick={() => handleSendReply(chat.ticket_id)} 
                        disabled={!replyText[chat.ticket_id]?.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 w-12 h-12 rounded-xl flex items-center justify-center text-white transition-colors"
                      >
                        <Send size={18}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* MARKETING & EMAIL CAMPAIGNS TAB */}
          {activeTab === 'marketing' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-3xl">
              <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-3"><Mail className="text-emerald-400"/> Email Campaigns</h2>
              <p className="text-neutral-400 mb-8">Send targeted marketing emails, updates, and promotions directly to your customer base.</p>
              
              <form onSubmit={handleSendBulkEmail} className="space-y-6">
                <div className="bg-black p-6 rounded-2xl border border-neutral-800">
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Target Audience</label>
                  <select 
                    value={marketingData.category}
                    onChange={(e) => setMarketingData({...marketingData, category: e.target.value})}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="ALL">All Registered Users</option>
                    <option value="NEWSLETTER">Newsletter Subscribers</option>
                    <option value="VIP">VIP Customers (High Spenders)</option>
                    <option value="REGULAR">Regular Customers</option>
                  </select>
                </div>

                <div className="bg-black p-6 rounded-2xl border border-neutral-800">
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Email Subject</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g., Big Summer Sale Starts Now!"
                    value={marketingData.subject} 
                    onChange={e => setMarketingData({...marketingData, subject: e.target.value})} 
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-emerald-500 transition-colors mb-6" 
                  />

                  <label className="block text-sm font-medium text-neutral-400 mb-2">Email Body (HTML Supported)</label>
                  <textarea 
                    required 
                    placeholder="<h2>Hello!</h2><p>Check out our latest products...</p>"
                    value={marketingData.body} 
                    onChange={e => setMarketingData({...marketingData, body: e.target.value})} 
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors h-48 custom-scrollbar resize-none font-mono text-sm" 
                  />
                  <p className="text-xs text-neutral-500 mt-2">You can use standard HTML tags for layout and styling.</p>
                </div>

                <button disabled={isSendingEmails} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] text-lg flex justify-center items-center gap-2 mt-4">
                  {isSendingEmails ? <><Loader2 size={20} className="animate-spin" /> Sending Campaign...</> : <><Send size={20}/> Launch Email Campaign</>}
                </button>
              </form>
            </motion.div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-3xl">
              <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-3"><Settings className="text-neutral-400"/> Store Configuration</h2>
              <p className="text-neutral-400 mb-8">Update the global settings that define how customers interact with your store.</p>
              
              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                <div className="bg-black p-6 md:p-8 rounded-2xl border border-neutral-800/80 shadow-inner">
                  <h3 className="text-amber-500 font-bold mb-4 flex items-center gap-2"><DollarSign size={18}/> Payment Accounts (Shown to Customers)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">JazzCash Number</label>
                      <input required type="text" value={storeSettings.jazzcash_number} onChange={e => setStoreSettings({...storeSettings, jazzcash_number: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="e.g. 0300-0000000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">EasyPaisa Number</label>
                      <input required type="text" value={storeSettings.easypaisa_number} onChange={e => setStoreSettings({...storeSettings, easypaisa_number: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="e.g. 0300-0000000" />
                    </div>
                  </div>
                </div>

                <div className="bg-black p-6 md:p-8 rounded-2xl border border-neutral-800/80 shadow-inner">
                  <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2"><MessageCircle size={18}/> Help Desk Contact Info</h3>
                  <p className="text-sm text-neutral-500 mb-6">This information is shown inside the chat widget when users are logged out.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Support Email</label>
                      <input required type="email" value={storeSettings.support_email} onChange={e => setStoreSettings({...storeSettings, support_email: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="support@store.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Support Phone / WhatsApp</label>
                      <input required type="text" value={storeSettings.support_phone} onChange={e => setStoreSettings({...storeSettings, support_phone: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="+92 300 1234567" />
                    </div>
                  </div>
                </div>

                <button disabled={isSubmitting} type="submit" className="w-full bg-white hover:bg-neutral-200 disabled:bg-neutral-500 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] text-lg flex justify-center items-center gap-2 mt-4">
                  {isSubmitting ? 'Saving Configuration...' : <><CheckCircle size={20}/> Save Global Settings</>}
                </button>
              </form>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;