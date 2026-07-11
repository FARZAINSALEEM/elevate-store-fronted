import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, ShieldCheck } from 'lucide-react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartContext, CartProvider } from './context/CartContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword'; // <--- NEW IMPORT
import Profile from './pages/Profile';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import HelpDeskChat from './components/HelpDeskChat';

const Navbar = () => {
  const cartContext = React.useContext(CartContext);
  const cartItemsCount = cartContext?.cartItems?.length || 0;
  const location = useLocation();
  
  if (location.pathname.includes('admin')) return null;

  return (
    <nav className="fixed w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-neutral-800 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black text-white tracking-tighter">ELEVATE<span className="text-indigo-500">.</span></Link>
        <div className="flex items-center gap-6">
          <Link to="/admin-login" className="text-neutral-500 hover:text-amber-500 transition-colors" title="Admin Portal">
            <ShieldCheck size={20} />
          </Link>
          <Link to="/cart" className="text-neutral-400 hover:text-white transition-colors relative">
            <ShoppingCart size={22} />
            {cartItemsCount > 0 && <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartItemsCount}</span>}
          </Link>
          <Link to="/profile" className="text-neutral-400 hover:text-indigo-400 transition-colors" title="My Profile & Orders"><User size={22} /></Link>
        </div>
      </div>
    </nav>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Navbar />
        <main className="min-h-screen bg-[#0a0a0a]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
        
        {/* Floating Help Desk Chat globally available except for admin routes */}
        {!window.location.pathname.includes('admin') && <HelpDeskChat />}
        
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
