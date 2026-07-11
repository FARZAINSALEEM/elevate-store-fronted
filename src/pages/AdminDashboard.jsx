import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, FileText, Package, DollarSign, AlertTriangle, Minus, ShoppingBag, Truck, X } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [rejectModal, setRejectModal] = useState({ show: false, orderId: null, reason: '' });
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', description: '', image: null, rating: 4.5, warranty: '1 Year Warranty', return_time: '30-Day Returns' });

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
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [productsRes, statsRes, ordersRes] = await Promise.all([
        api.get('/products/'),
        api.get('/admin/dashboard/'),
        api.get('/orders/')
      ]);
      setProducts(productsRes.data);
      setStats(statsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
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
    }
  };

  const submitRejection = () => {
    if (!rejectModal.reason.trim()) return alert("Please enter a reason.");
    handleUpdateOrderStatus(rejectModal.orderId, 'CANCELLED', rejectModal.reason);
    setRejectModal({ show: false, orderId: null, reason: '' });
  };

  // ... (Inventory logic stays the same)
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('price', newProduct.price);
    formData.append('stock', newProduct.stock);
    formData.append('description', newProduct.description);
    formData.append('rating', newProduct.rating);
    formData.append('warranty', newProduct.warranty);
    formData.append('return_time', newProduct.return_time);
    if (newProduct.image) formData.append('image', newProduct.image);

    try {
      await api.post('/products/', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setNewProduct({ name: '', price: '', stock: '', description: '', image: null, rating: 4.5, warranty: '1 Year Warranty', return_time: '30-Day Returns' });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      alert("Failed to add product.");
    }
  };

  const handleUpdateStock = async (id, currentStock, amount) => {
    const updatedStock = Math.max(0, currentStock + amount);
    await api.patch(`/products/${id}/`, { stock: updatedStock }).then(fetchData);
  };
  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure?")) await api.delete(`/products/${id}/`).then(fetchData);
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
              placeholder="e.g. Payment not received, item out of stock..."
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
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-xl transition">
              <FileText size={18} /> Print Report
            </button>
            <button onClick={() => logout()} className="flex items-center gap-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 px-4 py-2 rounded-xl transition">
              <LogOut size={18} /> Exit
            </button>
          </div>
        </div>

        {/* Stats Row & Graph */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 hidden print:grid md:grid">
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
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex items-center gap-4">
                <div className="p-4 bg-red-500/10 text-red-500 rounded-xl"><AlertTriangle size={24} /></div>
                <div>
                  <p className="text-neutral-400 text-sm">Low Stock Alerts</p>
                  <p className="text-2xl font-bold">{stats.low_stock_alerts}</p>
                </div>
              </div>
            </div>
            
            {/* Recharts Graph for Recent Sales */}
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-4">Recent Sales Overview</h3>
              <div className="h-64 w-full">
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
        <div className="flex gap-4 mb-4 print:hidden">
          <button onClick={() => setActiveTab('inventory')} className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'inventory' ? 'bg-amber-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}>
            <Package className="inline mr-2" size={18} /> Inventory
          </button>
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}>
            <ShoppingBag className="inline mr-2" size={18} /> Customer Orders
          </button>
        </div>

        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-6">Recent Customer Orders</h2>
            
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">No orders have been placed yet.</div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-black/40 border border-neutral-800 rounded-2xl p-6 flex flex-col lg:flex-row gap-6">
                    {/* Order Details */}
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
                          <p className="text-neutral-400">Phone: {order.phone_number || 'N/A'}</p>
                          <p className="text-neutral-400">CNIC: {order.cnic || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500 mb-1">Delivery Details:</p>
                          <p className="text-neutral-400 whitespace-pre-wrap">{order.shipping_address || 'No address provided'}</p>
                          <p className="font-medium text-amber-400 mt-2 flex items-center gap-1">
                            {order.payment_method === 'COD' ? <><Truck size={14} /> Cash on Delivery</> : 'Online Payment'}
                          </p>
                          {order.payment_method === 'ONLINE' && order.payment_screenshot && (
                              <div className="mt-3">
                                  <p className="text-neutral-500 mb-1 text-xs">Payment Proof:</p>
                                  <a href={getImageUrl(order.payment_screenshot)} target="_blank" rel="noreferrer">
                                      <img src={getImageUrl(order.payment_screenshot)} alt="Payment Proof" className="w-24 h-auto rounded border border-neutral-700 hover:border-indigo-500 transition cursor-pointer" />
                                  </a>
                                  {order.status === 'PENDING' && (
                                      <div className="flex gap-2 mt-3">
                                          <button onClick={() => handleUpdateOrderStatus(order.id, 'PROCESSING')} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold transition shadow-lg">Approve</button>
                                          <button onClick={() => setRejectModal({ show: true, orderId: order.id, reason: '' })} className="px-3 py-1.5 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white rounded text-xs font-bold transition">Reject</button>
                                      </div>
                                  )}
                              </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Items & Total */}
                    <div className="lg:w-1/3 bg-neutral-900 rounded-xl p-4 border border-neutral-800 flex flex-col justify-between">
                      <div className="space-y-3 mb-4 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-neutral-300">{item.quantity}x {item.product_name || `Item #${item.product}`}</span>
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
                ))
              )}
            </div>
          </div>
        )}
        {/* ... Inventory Tab content remains unchanged here ... */}
      </div>
    </div>
  );
};

export default AdminDashboard;
