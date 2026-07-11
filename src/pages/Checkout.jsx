import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, MapPin, CreditCard, Upload } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    shipping_address: '', phone_number: '', cnic: '', payment_method: 'COD'
  });
  const [screenshot, setScreenshot] = useState(null);
  const [settings, setSettings] = useState({ jazzcash_number: 'Loading...', easypaisa_number: 'Loading...' });
  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  useEffect(() => {
    if (!user) navigate('/login');
    api.get('/settings/').then(res => setSettings(res.data)).catch(err => console.error(err));
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setStatus({ loading: true, error: null, success: false });

    try {
      const orderData = new FormData();
      orderData.append('shipping_address', formData.shipping_address);
      orderData.append('phone_number', formData.phone_number);
      orderData.append('cnic', formData.cnic);
      orderData.append('payment_method', formData.payment_method);
      orderData.append('total_price', cartTotal);
      
      const itemsFormatted = cartItems.map(item => ({
        product: item.id, quantity: item.quantity, price: item.price
      }));
      orderData.append('items', JSON.stringify(itemsFormatted));

      if (formData.payment_method === 'ONLINE' && screenshot) {
        orderData.append('payment_screenshot', screenshot);
      }

      await api.post('/orders/', orderData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setStatus({ loading: false, error: null, success: true });
      clearCart();
    } catch (err) {
      console.error(err.response?.data); // Log for debugging
      setStatus({ 
        loading: false, 
        error: err.response?.data?.error || err.response?.data?.detail || 'Payment/Order failed. Please check your details and try again.', 
        success: false 
      });
    }
  };

  if (status.success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-neutral-900 border border-neutral-800 p-10 rounded-3xl text-center max-w-lg w-full shadow-2xl">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-amber-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Order Placed Successfully!</h2>
          <p className="text-neutral-300 mb-2">Your order will be confirmed shortly after your payment is verified by our team.</p>
          <p className="text-neutral-500 text-sm mb-8">You can track your order status and view confirmation details in your profile.</p>
          
          <button onClick={() => navigate('/profile')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            Go to My Profile
          </button>
        </motion.div>
      </div>
    );
  }

  // ... (The rest of the checkout render stays exactly the same) ...
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h1 className="text-3xl font-bold mb-8">Checkout Details</h1>
          {status.error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-2">
              <AlertCircle size={20} /> {status.error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 space-y-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><MapPin className="text-indigo-500"/> Delivery Info</h2>
              <textarea required placeholder="Full Shipping Address" className="w-full bg-black border border-neutral-800 rounded-xl p-4 text-white focus:border-indigo-500 focus:outline-none" onChange={e => setFormData({...formData, shipping_address: e.target.value})} />
              <input required type="text" placeholder="Phone Number" className="w-full bg-black border border-neutral-800 rounded-xl p-4 text-white focus:border-indigo-500 focus:outline-none" onChange={e => setFormData({...formData, phone_number: e.target.value})} />
              <input type="text" placeholder="CNIC (Optional)" className="w-full bg-black border border-neutral-800 rounded-xl p-4 text-white focus:border-indigo-500 focus:outline-none" onChange={e => setFormData({...formData, cnic: e.target.value})} />
            </div>

            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 space-y-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><CreditCard className="text-indigo-500"/> Payment Method</h2>
              
              <div className="flex gap-4">
                <label className={`flex-1 border p-4 rounded-xl cursor-pointer transition-all ${formData.payment_method === 'COD' ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-800 hover:border-neutral-700'}`}>
                  <input type="radio" name="payment" value="COD" checked={formData.payment_method === 'COD'} onChange={() => setFormData({...formData, payment_method: 'COD'})} className="hidden" />
                  <span className="font-semibold block text-center">Cash on Delivery</span>
                </label>
                <label className={`flex-1 border p-4 rounded-xl cursor-pointer transition-all ${formData.payment_method === 'ONLINE' ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-800 hover:border-neutral-700'}`}>
                  <input type="radio" name="payment" value="ONLINE" checked={formData.payment_method === 'ONLINE'} onChange={() => setFormData({...formData, payment_method: 'ONLINE'})} className="hidden" />
                  <span className="font-semibold block text-center">Online Payment</span>
                </label>
              </div>

              {formData.payment_method === 'ONLINE' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 bg-black rounded-xl border border-neutral-800">
                  <p className="text-sm text-neutral-400 mb-2">Please transfer the amount to one of the following accounts and upload the receipt:</p>
                  <div className="flex flex-col gap-2 mb-4 font-mono text-sm text-indigo-300">
                    <div className="bg-neutral-900 p-2 rounded">JazzCash: {settings.jazzcash_number}</div>
                    <div className="bg-neutral-900 p-2 rounded">EasyPaisa: {settings.easypaisa_number}</div>
                  </div>
                  <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-neutral-700 p-6 rounded-xl hover:border-indigo-500 cursor-pointer transition-colors">
                    <Upload size={20} className="text-neutral-500" />
                    <span className="text-neutral-400">{screenshot ? screenshot.name : 'Upload Screenshot (Required)'}</span>
                    <input type="file" required accept="image/*" className="hidden" onChange={(e) => setScreenshot(e.target.files[0])} />
                  </label>
                </motion.div>
              )}
            </div>

            <button type="submit" disabled={status.loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              {status.loading ? 'Processing...' : `Place Order (Rs. ${cartTotal.toFixed(2)})`}
            </button>
          </form>
        </div>

        <div>
          <div className="bg-neutral-900/80 p-6 rounded-3xl border border-neutral-800 sticky top-24">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6 border-b border-neutral-800 pb-6 max-h-96 overflow-y-auto custom-scrollbar">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-black/30 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-neutral-800 rounded flex-shrink-0"><img src={item.image} alt="" className="w-full h-full object-cover rounded"/></div>
                    <div>
                      <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                      <p className="text-xs text-neutral-400">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-neutral-400 mb-2 text-sm">
              <span>Delivery</span>
              <span className="text-amber-400 font-medium">Charges as per Bykea/inDrive</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xl font-medium">Total</span>
              <span className="text-3xl font-bold text-indigo-400">Rs. {cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
