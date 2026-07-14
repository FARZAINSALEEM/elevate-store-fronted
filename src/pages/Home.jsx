import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, TrendingUp, AlertCircle, Heart, Filter, X, Check } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import * as productService from '../services/productService';

const Home = () => {
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wishlistIds, setWishlistIds] = useState([]);

  // Filtering State
  const [activeCategory, setActiveCategory] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceSort, setPriceSort] = useState('none'); // none, low, high
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Re-fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [activeCategory, inStockOnly]);

  const fetchInitialData = async () => {
    try {
      const [catsRes, wishRes] = await Promise.all([
        api.get('/categories/'),
        user ? api.get('/wishlists/') : Promise.resolve({ data: [] })
      ]);
      setCategories(catsRes.data);
      if (user && wishRes.data.length > 0) {
        setWishlistIds(wishRes.data[0].products.map(p => p.id));
      }
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = '?';
      if (activeCategory) query += `category=${activeCategory}&`;
      if (inStockOnly) query += `in_stock=true&`;

      const { data } = await api.get(`/products/${query}`);
      setProducts(data);
    } catch (err) {
      setError('Failed to fetch products. Is your Django server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistToggle = async (product, e) => {
    e.preventDefault(); // Prevent link navigation
    if (!user) {
      navigate('/login');
      return;
    }

    const isWished = wishlistIds.includes(product.id);
    // Optimistic UI update
    setWishlistIds(prev => isWished ? prev.filter(id => id !== product.id) : [...prev, product.id]);

    try {
      if (isWished) {
        await api.patch(`/wishlists/${user.id}/`, { remove_product_id: product.id });
      } else {
        await api.patch(`/wishlists/${user.id}/`, { add_product_id: product.id });
      }
    } catch (err) {
      // Revert on failure
      setWishlistIds(prev => isWished ? [...prev, product.id] : prev.filter(id => id !== product.id));
      console.error("Wishlist action failed");
    }
  };

  const getSortedProducts = () => {
    let sorted = [...products];
    if (priceSort === 'low') sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (priceSort === 'high') sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    return sorted;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/').split('/api')[0];
    return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const FilterSidebar = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-white mb-4 border-b border-neutral-800 pb-2">Categories</h3>
        <div className="space-y-2">
          <button onClick={() => setActiveCategory(null)} className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm font-medium ${!activeCategory ? 'bg-indigo-600/20 text-indigo-400' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}>
            All Products
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.slug)} className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeCategory === cat.slug ? 'bg-indigo-600/20 text-indigo-400' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4 border-b border-neutral-800 pb-2">Filters</h3>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${inStockOnly ? 'bg-indigo-600 border-indigo-500' : 'bg-neutral-900 border-neutral-700 group-hover:border-indigo-500'}`}>
            {inStockOnly && <Check size={14} className="text-white" />}
          </div>
          <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">In Stock Only</span>
          <input type="checkbox" className="hidden" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
        </label>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4 border-b border-neutral-800 pb-2">Sort By Price</h3>
        <select 
          value={priceSort} 
          onChange={(e) => setPriceSort(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
        >
          <option value="none">Default Sorting</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-neutral-900/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300"
          >
            Elevate Your Tech.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 font-medium"
          >
            Discover premium gadgets and accessories designed for modern creators and professionals.
          </motion.p>
        </div>
      </section>

      {/* Main Shop Section */}
      <section id="products" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Mobile Filter Toggle */}
        <button onClick={() => setIsMobileFiltersOpen(true)} className="md:hidden w-full flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl font-bold text-indigo-400">
          <Filter size={18} /> Filters & Categories
        </button>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileFiltersOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileFiltersOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-72 bg-neutral-950 border-r border-neutral-800 z-50 p-6 md:hidden overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                  <span className="font-bold text-xl">Filters</span>
                  <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 bg-neutral-900 rounded-full text-neutral-400"><X size={18}/></button>
                </div>
                <FilterSidebar />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0 sticky top-24 h-fit">
          <FilterSidebar />
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold tracking-tight">{activeCategory ? `${activeCategory.replace('-', ' ')}` : 'All Products'} <span className="text-neutral-500 text-base font-medium ml-2">({getSortedProducts().length})</span></h2>
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
            <div className="text-center py-20 text-neutral-400 border border-neutral-800 rounded-3xl p-10 bg-neutral-900/30">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-xl">No products found for these filters.</p>
              <button onClick={() => {setActiveCategory(null); setInStockOnly(false);}} className="mt-4 text-indigo-400 font-bold hover:text-indigo-300">Clear all filters</button>
            </div>
          ) : (
            <motion.div 
              initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
            >
              {getSortedProducts().map((product) => {
                const isWished = wishlistIds.includes(product.id);
                return (
                  <motion.div 
                    key={product.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="bg-neutral-900/40 backdrop-blur-sm border border-neutral-800/80 rounded-3xl p-4 group hover:border-indigo-500/30 hover:bg-neutral-900 transition-all duration-300 relative overflow-hidden flex flex-col h-full shadow-lg"
                  >
                    {/* Wishlist Button */}
                    <button 
                      onClick={(e) => handleWishlistToggle(product, e)} 
                      className="absolute top-6 right-6 z-20 p-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-black/60 transition-all"
                    >
                      <Heart size={18} className={`transition-colors ${isWished ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
                    </button>

                    <Link to={`/product/${product.id}`} className="block relative z-0 h-48 mb-5 overflow-hidden rounded-2xl bg-black flex items-center justify-center flex-shrink-0">
                      {product.image ? (
                        <img 
                          src={getImageUrl(product.image)} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-neutral-600 font-medium">No Image</span>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                           <span className="bg-red-500 text-white font-black text-xs px-3 py-1.5 rounded-full uppercase tracking-widest border border-red-400">Sold Out</span>
                        </div>
                      )}
                    </Link>
                    
                    <div className="relative z-20 flex flex-col flex-grow px-1">
                      <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-widest mb-1.5">{product.category_name || 'Gear'}</span>
                      <Link to={`/product/${product.id}`}>
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">{product.name}</h3>
                      </Link>
                      
                      <div className="flex items-center gap-1.5 mb-4 mt-auto">
                        <div className="flex items-center text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded text-xs font-bold border border-yellow-500/20">
                           <Star size={12} className="fill-yellow-500 mr-1" /> {product.rating}
                        </div>
                        <span className="text-xs text-neutral-500 font-medium">({product.reviews?.length || 0} reviews)</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-800/80">
                        <span className="text-xl font-black text-white tracking-tight">Rs. {parseFloat(product.price).toFixed(2)}</span>
                        <motion.button 
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0}
                          className="bg-white disabled:bg-neutral-800 text-black disabled:text-neutral-500 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-neutral-200 transition-colors shadow-md"
                        >
                          <ShoppingCart size={18} className={product.stock === 0 ? 'opacity-50' : ''} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;