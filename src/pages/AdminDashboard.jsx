import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, FileText, Package, DollarSign, AlertTriangle, Minus, ShoppingBag, Truck } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'orders'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', description: '', image: null });

  // Helper function to ensure image URLs point to the backend
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

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('price', newProduct.price);
    formData.append('stock', newProduct.stock);
    formData.append('description', newProduct.description);
    if (newProduct.image) formData.append('image', newProduct.image);

    try {
      await api.post('/products/', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setNewProduct({ name: '', price: '', stock: '', description: '', image: null });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product.");
    }
  };

  const handleUpdateStock = async (id, currentStock, amount) => {
    const updatedStock = Math.max(0, currentStock + amount);
    try {
      await api.patch(`/products/${id}/`, { stock: updatedStock });
      fetchData();
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/products/${id}/`);
        fetchData();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 sm:p-10">
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
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 px-4 py-2 rounded-xl transition">
              <LogOut size={18} /> Exit
            </button>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 hidden print:grid md:grid">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex items-center gap-4">
              <div className="p-4 bg-green-500/10 text-green-500 rounded-xl"><DollarSign size={24} /></div>
              <div>
                <p className="text-neutral-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.total_sales}</p>
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

        {/* --- INVENTORY TAB --- */}
        {activeTab === 'inventory' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Inventory Management</h2>
              <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl transition print:hidden">
                <Plus size={18} /> Add Product
              </button>
            </div>

            {showAddForm && (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-black/50 p-6 rounded-2xl border border-neutral-800 mb-8 space-y-4 print:hidden" onSubmit={handleAddProduct}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input required type="text" placeholder="Product Name" className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 focus:border-amber-500 outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  <input required type="number" step="0.01" placeholder="Price ($)" className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 focus:border-amber-500 outline-none" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                  <input required type="number" placeholder="Initial Stock" className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 focus:border-amber-500 outline-none" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                  <input type="file" accept="image/*" className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-1.5 focus:border-amber-500 outline-none text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20" onChange={e => setNewProduct({...newProduct, image: e.target.files[0]})} />
                </div>
                <textarea placeholder="Product Description" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 focus:border-amber-500 outline-none h-24" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                <button type="submit" className="bg-white text-black font-bold px-6 py-2 rounded-lg hover:bg-neutral-200 transition">Save Product</button>
              </motion.form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400">
                    <th className="pb-3 px-4 font-medium">Image</th>
                    <th className="pb-3 px-4 font-medium">Product Name</th>
                    <th className="pb-3 px-4 font-medium">Price</th>
                    <th className="pb-3 px-4 font-medium">Stock Level</th>
                    <th className="pb-3 px-4 font-medium text-right print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-neutral-500">Database is empty.</td></tr>
                  ) : (
                    products.map(product => (
                      <tr key={product.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition">
                        <td className="py-2 px-4">
                          {product.image ? <img src={getImageUrl(product.image)} alt={product.name} className="w-10 h-10 object-cover rounded-md" /> : <div className="w-10 h-10 bg-neutral-800 rounded-md flex items-center justify-center text-xs text-neutral-500">No Img</div>}
                        </td>
                        <td className="py-4 px-4 font-medium">{product.name}</td>
                        <td className="py-4 px-4">${parseFloat(product.price).toFixed(2)}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleUpdateStock(product.id, product.stock, -1)} className="p-1 text-neutral-400 hover:text-white bg-neutral-800 rounded transition print:hidden"><Minus size={14} /></button>
                            <span className={`px-2 py-1 rounded-md text-sm font-semibold min-w-[3rem] text-center ${product.stock < 10 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{product.stock}</span>
                            <button onClick={() => handleUpdateStock(product.id, product.stock, 1)} className="p-1 text-neutral-400 hover:text-white bg-neutral-800 rounded transition print:hidden"><Plus size={14} /></button>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right print:hidden">
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
                        <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-sm font-medium">{order.status}</span>
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
                            {order.payment_method === 'COD' ? <><Truck size={14} /> Cash on Delivery</> : 'Credit Card'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items & Total */}
                    <div className="lg:w-1/3 bg-neutral-900 rounded-xl p-4 border border-neutral-800 flex flex-col justify-between">
                      <div className="space-y-3 mb-4 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-neutral-300">{item.quantity}x {item.product_name || `Item #${item.product}`}</span>
                            <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center border-t border-neutral-700 pt-3 text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-green-400">${parseFloat(order.total_price).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
