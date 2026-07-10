import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, Plus, Minus, Truck, Shield, RotateCcw, AlertCircle } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import * as productService from '../services/productService';

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function to ensure image URLs point to the backend
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/').split('/api')[0];
    return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.getProductById(id);
        setProduct(data);
      } catch (err) {
        setError('Failed to fetch product details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">{error || 'Product not found'}</h2>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300">Go back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center text-neutral-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back to Products
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-square bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 relative group flex items-center justify-center">
              {product.image ? (
                <img 
                  src={getImageUrl(product.image)} 
                  alt={product.name} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <span className="text-neutral-500 font-medium text-lg">No Image</span>
              )}
            </div>
          </motion.div>

          {/* Details Section */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <div className="mb-2 text-indigo-400 font-semibold tracking-wide uppercase text-sm">
              Product
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="font-bold">{product.rating || "4.5"}</span>
              </div>
              <span className="text-neutral-400 text-sm">{product.stock} in stock</span>
            </div>

            <div className="text-3xl font-bold text-white mb-6">
              Rs. {parseFloat(product.price).toFixed(2)}
            </div>

            <p className="text-neutral-400 text-lg mb-8 leading-relaxed whitespace-pre-wrap">
              {product.description || "No description provided for this product."}
            </p>

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-neutral-300 mb-3 uppercase tracking-wider">Highlights</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <li className="flex items-center gap-2 text-neutral-400 bg-neutral-900/50 p-3 rounded-xl border border-neutral-800/50">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  <span className="text-sm">Premium Quality</span>
                </li>
                <li className="flex items-center gap-2 text-neutral-400 bg-neutral-900/50 p-3 rounded-xl border border-neutral-800/50">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  <span className="text-sm">Fast Shipping</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-auto pt-8 border-t border-neutral-800">
              <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded-xl p-1 h-14">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="w-12 h-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} />
                </button>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product, quantity)}
                disabled={product.stock === 0}
                className="flex-1 min-w-[200px] h-14 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              >
                <ShoppingCart size={20} /> {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </motion.button>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-neutral-800 text-center">
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <Truck size={24} className="text-indigo-400" />
                <span className="text-xs">Delivery via Bykea/inDrive</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <Shield size={24} className="text-indigo-400" />
                <span className="text-xs">{product.warranty || "1 Year Warranty"}</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <RotateCcw size={24} className="text-indigo-400" />
                <span className="text-xs">{product.return_time || "30-Day Returns"}</span>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
