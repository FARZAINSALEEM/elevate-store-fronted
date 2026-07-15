import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, TrendingUp, AlertCircle, Heart, Filter, X, Check, Package, ChevronDown, Zap, Shield, Truck, Award } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import * as productService from '../services/productService';

/* ─── Reusable scroll-reveal wrapper ─── */
const ScrollReveal = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const directionMap = {
    up:    { y: 60, x: 0 },
    down:  { y: -60, x: 0 },
    left:  { y: 0, x: 60 },
    right: { y: 0, x: -60 },
  };
  const { x, y } = directionMap[direction] || directionMap.up;

  return (
    <motion.div
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Animated counter (for stats) ─── */
const AnimatedCounter = ({ target, suffix = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
};

/* ─── Floating particle background ─── */
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: `${Math.random() * 6 + 3}px`,
          height: `${Math.random() * 6 + 3}px`,
          background: `rgba(99, 102, 241, ${Math.random() * 0.3 + 0.1})`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, Math.random() * 20 - 10, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: Math.random() * 4 + 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: Math.random() * 3,
        }}
      />
    ))}
  </div>
);


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
  const [priceSort, setPriceSort] = useState('none');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // ─── Parallax refs & transforms ───
  const heroRef = useRef(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(heroScrollProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(heroScrollProgress, [0, 0.6], [1, 0]);
  const glowScale = useTransform(heroScrollProgress, [0, 1], [1, 1.5]);
  const glowOpacity = useTransform(heroScrollProgress, [0, 0.8], [0.15, 0]);

  // Smooth scroll progress bar at top
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    fetchInitialData();
  }, []);

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
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    const isWished = wishlistIds.includes(product.id);
    setWishlistIds(prev => isWished ? prev.filter(id => id !== product.id) : [...prev, product.id]);

    try {
      if (isWished) {
        await api.patch(`/wishlists/${user.id}/`, { remove_product_id: product.id });
      } else {
        await api.patch(`/wishlists/${user.id}/`, { add_product_id: product.id });
      }
    } catch (err) {
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

  /* ─── Trust badges data ─── */
  const trustBadges = [
    { icon: <Truck size={28} />, title: 'Free Delivery', desc: 'On orders above Rs. 2000' },
    { icon: <Shield size={28} />, title: '1 Year Warranty', desc: 'Guaranteed quality' },
    { icon: <Zap size={28} />, title: 'Fast Shipping', desc: 'Delivered in 2-3 days' },
    { icon: <Award size={28} />, title: 'Top Rated', desc: '4.8★ average reviews' },
  ];

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

  /* ─── Stagger variants for product grid ─── */
  const gridContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const gridItem = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ─── Scroll Progress Bar ─── */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 origin-left z-[100]"
      />

      {/* ═══════════════════════════════════════════
          HERO SECTION — Parallax + floating elements
          ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative pt-32 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-neutral-900/50">
        
        {/* Animated gradient orbs */}
        <motion.div
          style={{ scale: glowScale, opacity: glowOpacity }}
          className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-[15%] w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-[10%] w-[250px] h-[250px] bg-cyan-500/8 blur-[100px] rounded-full pointer-events-none"
        />

        <FloatingParticles />

        {/* Decorative grid lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-7xl mx-auto text-center relative z-10">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm px-5 py-2 rounded-full mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-indigo-300 text-sm font-semibold tracking-wide">New Collection 2026 — Now Live</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
              Elevate Your
            </span>
            <br />
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
            >
              Tech.
            </motion.span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
          >
            Discover premium gadgets and accessories designed for modern creators and professionals.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.a
              href="#products"
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow"
            >
              Shop Now
            </motion.a>
            <motion.a
              href="#products"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl font-bold text-lg hover:bg-white/10 transition-colors"
            >
              Browse Collection
            </motion.a>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-16"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex flex-col items-center text-neutral-500"
            >
              <span className="text-xs font-medium tracking-widest uppercase mb-2">Scroll to explore</span>
              <ChevronDown size={20} />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>


      {/* ═══════════════════════════════════════
          TRUST BADGES — Staggered scroll reveal
          ═══════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-neutral-900/50 relative">
        <FloatingParticles />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {trustBadges.map((badge, i) => (
            <ScrollReveal key={i} delay={i * 0.12} direction="up">
              <motion.div
                whileHover={{ y: -8, borderColor: 'rgba(99,102,241,0.3)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="bg-neutral-900/30 backdrop-blur-sm border border-neutral-800/60 rounded-2xl p-6 text-center group cursor-default"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                  {badge.icon}
                </div>
                <h4 className="font-bold text-white mb-1">{badge.title}</h4>
                <p className="text-sm text-neutral-500">{badge.desc}</p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          STATS SECTION — Animated counters on scroll
          ═══════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-b border-neutral-900/50">
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { target: 5000, suffix: '+', label: 'Happy Customers' },
              { target: 200, suffix: '+', label: 'Premium Products' },
              { target: 99, suffix: '%', label: 'Satisfaction Rate' },
              { target: 24, suffix: '/7', label: 'Support Available' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-1">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-neutral-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>


      {/* ═══════════════════════════════════════════════════
          MAIN SHOP SECTION — whileInView staggered products
          ═══════════════════════════════════════════════════ */}
      <section id="products" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Mobile Filter Toggle */}
        <ScrollReveal direction="left" className="md:hidden">
          <button onClick={() => setIsMobileFiltersOpen(true)} className="w-full flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl font-bold text-indigo-400">
            <Filter size={18} /> Filters & Categories
          </button>
        </ScrollReveal>

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

        {/* Desktop Sidebar — slides in from left on scroll */}
        <ScrollReveal direction="left" className="hidden md:block w-64 flex-shrink-0 sticky top-24 h-fit">
          <FilterSidebar />
        </ScrollReveal>

        {/* Product Grid */}
        <div className="flex-1">
          <ScrollReveal direction="right">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-2xl font-bold tracking-tight">
                {activeCategory ? `${activeCategory.replace('-', ' ')}` : 'All Products'}
                <span className="text-neutral-500 text-base font-medium ml-2">({getSortedProducts().length})</span>
              </h2>
            </div>
          </ScrollReveal>

          {loading ? (
            <div className="flex justify-center py-20">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <ScrollReveal>
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-6 rounded-2xl flex items-center gap-4">
                <AlertCircle size={24} />
                <p>{error}</p>
              </div>
            </ScrollReveal>
          ) : products.length === 0 ? (
            <ScrollReveal>
              <div className="text-center py-20 text-neutral-400 border border-neutral-800 rounded-3xl p-10 bg-neutral-900/30">
                <Package size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-xl">No products found for these filters.</p>
                <button onClick={() => {setActiveCategory(null); setInStockOnly(false);}} className="mt-4 text-indigo-400 font-bold hover:text-indigo-300">Clear all filters</button>
              </div>
            </ScrollReveal>
          ) : (
            <motion.div 
              variants={gridContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.05 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
            >
              {getSortedProducts().map((product) => {
                const isWished = wishlistIds.includes(product.id);
                return (
                  <motion.div 
                    key={product.id}
                    variants={gridItem}
                    whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                    className="bg-neutral-900/40 backdrop-blur-sm border border-neutral-800/80 rounded-3xl p-4 group hover:border-indigo-500/30 hover:bg-neutral-900 transition-all duration-300 relative overflow-hidden flex flex-col h-full shadow-lg"
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />

                    {/* Wishlist Button */}
                    <motion.button 
                      onClick={(e) => handleWishlistToggle(product, e)} 
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      className="absolute top-6 right-6 z-20 p-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-black/60 transition-all"
                    >
                      <Heart size={18} className={`transition-colors duration-300 ${isWished ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
                    </motion.button>

                    <Link to={`/product/${product.id}`} className="block relative z-0 h-48 mb-5 overflow-hidden rounded-2xl bg-black flex items-center justify-center flex-shrink-0">
                      {product.image ? (
                        <motion.img 
                          src={getImageUrl(product.image)} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.08 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
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
                          whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(255,255,255,0.2)' }}
                          whileTap={{ scale: 0.9 }}
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


      {/* ═══════════════════════════════════════════
          NEWSLETTER / CTA — Pop-in on scroll
          ═══════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative">
        <FloatingParticles />
        <ScrollReveal>
          <motion.div
            whileHover={{ borderColor: 'rgba(99,102,241,0.3)' }}
            className="relative overflow-hidden bg-gradient-to-br from-neutral-900/80 to-neutral-950 border border-neutral-800/60 rounded-3xl p-12 md:p-16 text-center backdrop-blur-sm"
          >
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative z-10"
            >
              <h3 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-300">
                Stay in the Loop
              </h3>
              <p className="text-neutral-400 mb-8 max-w-md mx-auto">
                Get notified about new arrivals, exclusive deals, and tech drops before anyone else.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-neutral-900/80 border border-neutral-700 rounded-xl px-5 py-3.5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(99,102,241,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold whitespace-nowrap shadow-lg shadow-indigo-500/20"
                >
                  Subscribe
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </ScrollReveal>
      </section>
    </div>
  );
};

export default Home;