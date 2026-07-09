import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import * as productService from '../services/productService';

const Home = () => {
  const { addToCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getProducts();
        setProducts(data);
      } catch (err) {
        setError('Failed to fetch products. Is your Django server running?');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400"
          >
            Elevate Your Tech.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10"
          >
            Discover premium gadgets and accessories designed for modern creators and professionals.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <a href="#products" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-1">
              Shop Now <TrendingUp size={20} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Featured Products</h2>
            <p className="text-neutral-400">Handpicked essentials just for you.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-6 rounded-2xl flex items-center gap-4">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-neutral-400 border border-neutral-800 rounded-3xl p-10 bg-neutral-900/50">
            <p className="text-xl">No products available.</p>
            <p className="mt-2 text-neutral-500">Log into your Django Admin panel at <code className="text-indigo-400">127.0.0.1:8000/admin</code> to add some items!</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {products.map((product) => (
              <motion.div 
                key={product.id}
                variants={itemVariants}
                className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-4 group hover:border-indigo-500/50 transition-colors relative overflow-hidden flex flex-col h-full"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-neutral-900/90 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                
                <Link to={`/product/${product.id}`} className="block relative z-0 h-48 mb-4 overflow-hidden rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-neutral-500 font-medium">No Image</span>
                  )}
                </Link>
                
                <div className="relative z-20 flex flex-col flex-grow">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Product</span>
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-lg font-bold text-white mt-1 mb-2 hover:text-indigo-300 transition-colors line-clamp-2">{product.name}</h3>
                  </Link>
                  
                  <div className="flex items-center gap-1 mb-4">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-sm text-neutral-300">4.5</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4">
                    <span className="text-xl font-bold text-white">${parseFloat(product.price).toFixed(2)}</span>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => addToCart(product)}
                      className="bg-indigo-600 p-3 rounded-full text-white hover:bg-indigo-500 transition-colors shadow-lg"
                    >
                      <ShoppingCart size={18} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default Home;