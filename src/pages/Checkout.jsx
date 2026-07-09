import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Truck, CreditCard, User, MapPin, Phone, FileText, ArrowLeft, AlertCircle } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.username || '',
    address: '',
    phone: '',
    cnic: '',
    paymentMethod: 'COD'
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (cartItems.length === 0 && !receipt) {
    navigate('/cart');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    const orderData = {
      items: cartItems.map(item => ({ id: item.id, quantity: item.quantity, price: item.price })),
      total_price: cartTotal,
      shipping_address: formData.address,
      phone_number: formData.phone,
      cnic: formData.cnic,
      payment_method: formData.paymentMethod
    };

    try {
      const response = await api.post('/orders/', orderData);
      setReceipt(response.data);
      clearCart();
    } catch (error) {
      console.error("Order failed:", error);
      setErrorMsg(error.response?.data?.error || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (receipt) {
    return (
      <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-4 flex justify-center items-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-neutral-900 border border-indigo-500/30 p-8 rounded-3xl max-w-lg w-full shadow-[0_0_40px_rgba(79,70,229,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <div className="text-center mb-8">
            <CheckCircle size={60} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-black mb-2">Order Confirmed!</h2>
            <p className="text-neutral-400">Thank you for your purchase.</p>
          </div>
          
          <div className="bg-black/50 rounded-2xl p-6 border border-neutral-800 space-y-4 mb-8 text-sm">
            <div className="flex justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-500">Order ID:</span>
              <span className="font-bold text-indigo-400">#{receipt.id}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-500">Payment Method:</span>
              <span className="font-medium">{receipt.payment_method === 'COD' ? 'Cash on Delivery' : 'Credit Card'}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-500">Customer:</span>
              <span className="font-medium text-right">{formData.fullName}<br/>{formData.phone}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-500">Total Paid:</span>
              <span className="font-bold text-lg text-white">${parseFloat(receipt.total_price).toFixed(2)}</span>
            </div>
            <div className="pt-2">
              <span className="text-neutral-500 block mb-1">Items:</span>
              {receipt.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-neutral-300">
                  <span>{item.quantity}x {item.product_name || `Product ID: ${item.product}`}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <Link to="/">
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition">
              Continue Shopping
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/cart" className="inline-flex items-center text-neutral-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back to Cart
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Checkout Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl font-bold mb-6">Delivery Details</h2>
            
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-3">
                <AlertCircle size={20} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 bg-neutral-900/50 p-6 rounded-3xl border border-neutral-800">
              <div className="relative">
                <User className="absolute top-3 left-4 text-neutral-500" size={20} />
                <input required type="text" placeholder="Full Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-black/50 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="relative">
                <Phone className="absolute top-3 left-4 text-neutral-500" size={20} />
                <input required type="tel" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black/50 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="relative">
                <FileText className="absolute top-3 left-4 text-neutral-500" size={20} />
                <input required type="text" placeholder="CNIC Number (e.g., 42101-1234567-1)" value={formData.cnic} onChange={e => setFormData({...formData, cnic: e.target.value})} className="w-full bg-black/50 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="relative">
                <MapPin className="absolute top-3 left-4 text-neutral-500" size={20} />
                <textarea required placeholder="Full Shipping Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-black/50 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 h-24"></textarea>
              </div>

              {/* Payment Options */}
              <div className="pt-4 border-t border-neutral-800">
                <h3 className="font-semibold mb-4 text-lg">Payment Method</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'COD'})} className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${formData.paymentMethod === 'COD' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-black/50 border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}>
                    <Truck size={20} /> COD
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'CARD'})} className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${formData.paymentMethod === 'CARD' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-black/50 border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}>
                    <CreditCard size={20} /> Card
                  </button>
                </div>
              </div>

              <button disabled={isProcessing} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl mt-6 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all">
                {isProcessing ? 'Processing Order...' : `Place Order - $${parseFloat(cartTotal).toFixed(2)}`}
              </button>
            </form>
          </motion.div>

          {/* Order Summary */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 h-fit sticky top-24">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2 mb-6 border-b border-neutral-800 pb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
                       {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-neutral-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium text-neutral-400">Total to Pay</span>
              <span className="font-bold text-2xl text-white">${parseFloat(cartTotal).toFixed(2)}</span>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;