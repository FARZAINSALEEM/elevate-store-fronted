import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, FileText, Package, DollarSign, AlertTriangle, MessageCircle, Settings, ShoppingBag, Truck, X, Send } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [chats, setChats] = useState([]);
  const [storeSettings, setStoreSettings] = useState({ jazzcash_number: '', easypaisa_number: '', support_email: '', support_phone: '' });
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [rejectModal, setRejectModal] = useState({ show: false, orderId: null, reason: '' });
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', description: '', image: null, rating: 4.5, warranty: '1 Year Warranty', return_time: '7 Days Return' });
  const [replyText, setReplyText] = useState({});

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
    const interval = setInterval(fetchChats, 5000); // Poll chats
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
      console.error("Error fetching data:", error);
    }
  };

  const fetchChats = async () => {
    try {
      const chatRes = await api.get('/chat/admin/');
      setChats(chatRes.data);
    } catch(err) {}
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
    }
  };

  const submitRejection = () => {
    if (!rejectModal.reason.trim()) return alert("Please enter a reason.");
    handleUpdateOrderStatus(rejectModal.orderId, 'CANCELLED', rejectModal.reason);
    setRejectModal({ show: false, orderId: null, reason: '' });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(newProduct).forEach(key => formData.append(key, newProduct[key]));

    try {
      await api.post('/products/', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setNewProduct({ name: '', price: '', stock: '', description: '', image: null, rating: 4.5, warranty: '1 Year Warranty', return_time: '7 Days Return' });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      alert("Failed to add product.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure?")) await api.delete(`/products/${id}/`).then(fetchData);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settings/', storeSettings);
      alert('Settings updated successfully!');
    } catch (err) {
      alert('Failed to update settings.');
    }
  };

  const handleSendReply = async (ticketId) => {
    if (!replyText[ticketId]) return;
    try {
      await api.post('/chat/admin/', { ticket_id: ticketId, message: replyText[ticketId] });
      setReplyText({...replyText, [ticketId]: ''});
      fetchChats();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 sm:p-10 relative">
      {/* Rejection Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-500 flex items-center gap-2"><AlertTriangle size={20}/> Reject Order</h3>
              <button onClick={() => setRejectModal({ show: false, orderId: null, reason: '' })} className="text-neutral-500 hover:text-white"><X size={20}/></button>
            </div>
            <p className="text-neutral-400 text-sm mb-4">Provide a reason for rejection. The customer will see this message.</p>
            <textarea 
              className="w-full bg-black border border-neutral-700 rounded-xl p-3 text-white focus:border-red-500 focus:outline-none mb-4 h-24"
              placeholder="e.g. Payment receipt is fake, item out of stock..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({...rejectModal, reason: e.target.value})}
            />
            <button onClick={submitRejection} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition">Confirm Rejection</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900/50 p-6 rounded-3xl border border-amber-900/30">
          <div>
            <h1 className="text-3xl font-black text-white">Admin Portal</h1>
            <p className="text-amber-500/70">Welcome back, {user?.username}</p>
          </div>
          <button onClick={() => logout()} className="flex items-center gap-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 px-4 py-2 rounded-xl transition">
            <LogOut size={18} /> Exit Portal
          </button>
        </div>

        {/* Stats Row & Graph */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:grid">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex items-center gap-4">
                <div className="p-4 bg-green-500/10 text-green-500 rounded-xl"><DollarSign size={24} /></div>
                <div>
                  <p className="text-neutral-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold">Rs. {stats.total_sales}</p>
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex items-center gap-4">
                <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-xl"><Package size={24} /></div>
                <div>
                  <p className="text-neutral-400 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.total_orders}</p>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-4">Recent Sales Overview</h3>
              <div className="h-40 w-full">
                {stats.sales_data?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.sales_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs.${val}`} />
                      <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px' }} itemStyle={{ color: '#a78bfa' }} />
                      <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-neutral-500">No recent sales data to display.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-4">
          <button onClick={() => setActiveTab('inventory')} className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'inventory' ? 'bg-amber-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}>
            <Package className="inline mr-2" size={18} /> Inventory
          </button>
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}>
            <ShoppingBag className="inline mr-2" size={18} /> Orders
          </button>
          <button onClick={() => setActiveTab('chats')} className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'chats' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'} relative`}>
            <MessageCircle className="inline mr-2" size={18} /> Support Desk
            {chats.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'settings' ? 'bg-neutral-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}>
            <Settings className="inline mr-2" size={18} /> Store Settings
          </button>
        </div>

        {/* --- INVENTORY TAB --- */}
        {activeTab === 'inventory' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Manage Products</h2>
              <button onClick={() => setShowAddForm(!showAddForm)} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition shadow-lg">
                {showAddForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add Product</>}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddProduct} className="bg-black/50 p-6 rounded-2xl border border-amber-900/30 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="Product Name" className="bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-white" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                <input required type="number" placeholder="Price (Rs)" className="bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-white" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                <input required type="number" placeholder="Initial Stock" className="bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-white" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                <input type="file" accept="image/*" className="bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-neutral-400" onChange={e => setNewProduct({...newProduct, image: e.target.files[0]})} />
                <textarea required placeholder="Description" className="bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-white md:col-span-2 h-24" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                <button type="submit" className="md:col-span-2 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold transition">Save Product</button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-sm">
                    <th className="p-4 font-medium">Product</th>
                    <th className="p-4 font-medium">Price</th>
                    <th className="p-4 font-medium">Stock</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-b border-neutral-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-12 h-12 bg-neutral-800 rounded overflow-hidden">
                          {product.image && <img src={getImageUrl(product.image)} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="font-bold">{product.name}</span>
                      </td>
                      <td className="p-4">Rs. {product.price}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${product.stock > 10 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{product.stock} in stock</span></td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-6">Customer Orders</h2>
            <div className="space-y-6">
              {orders.map(order => (
                <div key={order.id} className="bg-black/40 border border-neutral-800 rounded-2xl p-6 flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start border-b border-neutral-800 pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-indigo-400">Order #{order.id}</h3>
                        <p className="text-sm text-neutral-500">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'CANCELLED' ? 'bg-red-500/20 text-red-500' : 'bg-indigo-500/20 text-indigo-400'}`}>{order.status}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-500 mb-1">Customer Info:</p>
                        <p className="font-medium text-white">{order.user_name}</p>
                        <p className="text-neutral-400">Phone: {order.phone_number}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500 mb-1">Delivery Details:</p>
                        <p className="text-neutral-400 whitespace-pre-wrap">{order.shipping_address}</p>
                        <p className="font-medium text-amber-400 mt-2">{order.payment_method === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p>
                        
                        {order.payment_method === 'ONLINE' && order.payment_screenshot && (
                            <div className="mt-3">
                                <p className="text-neutral-500 mb-1 text-xs">Payment Proof:</p>
                                <a href={getImageUrl(order.payment_screenshot)} target="_blank" rel="noreferrer">
                                    <img src={getImageUrl(order.payment_screenshot)} alt="Proof" className="w-24 h-auto rounded border border-neutral-700 hover:border-indigo-500 cursor-pointer" />
                                </a>
                                {order.status === 'PENDING' && (
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => handleUpdateOrderStatus(order.id, 'PROCESSING')} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold transition">Approve</button>
                                        <button onClick={() => setRejectModal({ show: true, orderId: order.id, reason: '' })} className="px-3 py-1.5 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white rounded text-xs font-bold transition">Reject</button>
                                    </div>
                                )}
                            </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-1/3 bg-neutral-900 rounded-xl p-4 border border-neutral-800 flex flex-col justify-between">
                    <div className="space-y-3 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-neutral-300">{item.quantity}x {item.product_name}</span>
                          <span className="text-white">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center border-t border-neutral-700 pt-3 text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-400">Rs. {parseFloat(order.total_price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- CHATS TAB --- */}
        {activeTab === 'chats' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-6">Customer Support Desk</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {chats.length === 0 ? (
                <div className="text-neutral-500 py-8">No active support tickets.</div>
              ) : chats.map(chat => (
                <div key={chat.ticket_id} className="bg-black/50 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-[400px]">
                  <div className="bg-blue-600/20 p-4 border-b border-blue-900/30">
                    <h3 className="font-bold text-blue-400">User: {chat.user}</h3>
                    <p className="text-xs text-neutral-500">Last updated: {chat.last_updated}</p>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                    {chat.messages.map((m, i) => (
                      <div key={i} className={`max-w-[80%] rounded-xl p-3 text-sm ${m.is_admin ? 'bg-blue-600 text-white ml-auto rounded-tr-sm' : 'bg-neutral-800 text-neutral-200 mr-auto rounded-tl-sm'}`}>
                        {m.text}
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Type reply..." 
                      className="flex-1 bg-black border border-neutral-700 rounded-xl px-4 text-sm focus:border-blue-500 outline-none"
                      value={replyText[chat.ticket_id] || ''}
                      onChange={(e) => setReplyText({...replyText, [chat.ticket_id]: e.target.value})}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendReply(chat.ticket_id)}
                    />
                    <button onClick={() => handleSendReply(chat.ticket_id)} className="bg-blue-600 hover:bg-blue-500 w-10 h-10 rounded-xl flex items-center justify-center text-white transition"><Send size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings className="text-neutral-400"/> Store Configuration</h2>
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="bg-black/30 p-6 rounded-2xl border border-neutral-800/50 space-y-4">
                <h3 className="text-indigo-400 font-bold mb-2">Payment Accounts (Shown to Customers)</h3>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">JazzCash Number</label>
                  <input required type="text" value={storeSettings.jazzcash_number} onChange={e => setStoreSettings({...storeSettings, jazzcash_number: e.target.value})} className="w-full bg-black border border-neutral-700 rounded-xl p-3 text-white focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">EasyPaisa Number</label>
                  <input required type="text" value={storeSettings.easypaisa_number} onChange={e => setStoreSettings({...storeSettings, easypaisa_number: e.target.value})} className="w-full bg-black border border-neutral-700 rounded-xl p-3 text-white focus:border-indigo-500" />
                </div>
              </div>

              <div className="bg-black/30 p-6 rounded-2xl border border-neutral-800/50 space-y-4">
                <h3 className="text-blue-400 font-bold mb-2">Help Desk Contacts</h3>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Support Email</label>
                  <input required type="email" value={storeSettings.support_email} onChange={e => setStoreSettings({...storeSettings, support_email: e.target.value})} className="w-full bg-black border border-neutral-700 rounded-xl p-3 text-white focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Support WhatsApp/Phone</label>
                  <input required type="text" value={storeSettings.support_phone} onChange={e => setStoreSettings({...storeSettings, support_phone: e.target.value})} className="w-full bg-black border border-neutral-700 rounded-xl p-3 text-white focus:border-blue-500" />
                </div>
              </div>

              <button type="submit" className="w-full bg-white hover:bg-neutral-200 text-black font-bold py-3.5 rounded-xl transition shadow-lg">Save Settings</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;