import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, Plus, Minus, Truck, Shield, RotateCcw, AlertCircle, Heart, UserCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import * as productService from '../services/productService';
import api from '../services/api';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Premium Features State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isWished, setIsWished] = useState(false);
  const [allImages, setAllImages] = useState([]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/').split('/api')[0];
    return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  useEffect(() => {
    const fetchProductAndWishlist = async () => {
      try {
        const prodData = await productService.getProductById(id);
        setProduct(prodData);
        
        // Combine primary image and gallery images for the slider
        const images = [];
        if (prodData.image) images.push(prodData.image);
        if (prodData.gallery_images) {
            prodData.gallery_images.forEach(imgObj => images.push(imgObj.image));
        }
        setAllImages(images);

        // Check if item is in user's wishlist
        if (user) {
           const wishRes = await api.get('/wishlists/');
           if (wishRes.data.length > 0) {
               const ids = wishRes.data[0].products.map(p => p.id);
               setIsWished(ids.includes(parseInt(id)));
           }
        }
      } catch (err) {
        setError('Failed to fetch product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndWishlist();
  }, [id, user]);

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const previousState = isWished;
    setIsWished(!isWished); // Optimistic Update

    try {
      if (previousState) {
        await api.patch(`/wishlists/${user.id}/`, { remove_product_id: product.id });
      } else {
        await api.patch(`/wishlists/${user.id}/`, { add_product_id: product.id });
      }
    } catch (err) {
      setIsWished(previousState); // Revert on failure
      console.error("Wishlist action failed");
    }
  };

  const nextImage = () => setActiveImageIndex((prev) => (prev + 1) % allImages.length);
  const prevImage = () => setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));

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
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 font-bold">Go back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb */}
        <nav className="flex mb-8 text-sm font-medium text-neutral-500">
            <Link to="/" className="hover:text-indigo-400 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            {product.category_name && (
                <>
                    <span className="hover:text-indigo-400 transition-colors cursor-pointer">{product.category_name}</span>
                    <span className="mx-2">/</span>
                </>
            )}
            <span className="text-neutral-300">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20">
          
          {/* IMAGE GALLERY SECTION */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col-reverse md:flex-row gap-4">
            
            {/* Thumbnails (Vertical on desktop, Horizontal on mobile) */}
            {allImages.length > 1 && (
                <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto custom-scrollbar md:w-24 flex-shrink-0 snap-x">
                    {allImages.map((img, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => setActiveImageIndex(idx)}
                            className={`w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-neutral-900 rounded-xl overflow-hidden border-2 transition-all snap-center ${activeImageIndex === idx ? 'border-indigo-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        >
                            <img src={getImageUrl(img)} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover"/>
                        </button>
                    ))}
                </div>
            )}

            {/* Main Image View */}
            <div className="flex-1 aspect-square md:aspect-auto md:h-[600px] bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 relative group flex items-center justify-center">
              
              <button onClick={handleWishlistToggle} className="absolute top-6 right-6 z-20 p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-black/60 transition-all shadow-lg">
                 <Heart size={24} className={`transition-colors ${isWished ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
              </button>

              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  src={getImageUrl(allImages[activeImageIndex])} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-4"
                />
              </AnimatePresence>

              {/* Slider Controls */}
              {allImages.length > 1 && (
                  <>
                      <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600 backdrop-blur-md"><ChevronLeft size={24}/></button>
                      <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600 backdrop-blur-md"><ChevronRight size={24}/></button>
                  </>
              )}
            </div>
          </motion.div>

          {/* DETAILS SECTION */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col">
            
            <div className="mb-3 text-indigo-400 font-bold tracking-widest uppercase text-xs">
              {product.category_name || "Premium Gear"}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-neutral-800">
              <div className="flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-yellow-500">{product.rating}</span>
              </div>
              <span className="text-neutral-500 font-medium text-sm hover:text-indigo-400 cursor-pointer transition-colors">
                  {product.reviews?.length || 0} Verified Reviews
              </span>
              <span className="text-neutral-700">|</span>
              <span className={`text-sm font-black uppercase tracking-wider ${product.stock > 5 ? 'text-green-500' : product.stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                {product.stock > 5 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} Left!` : 'Sold Out'}
              </span>
            </div>

            <div className="text-4xl font-black text-white mb-6 flex items-baseline gap-2">
              <span className="text-2xl text-neutral-500 font-medium tracking-tight">Rs.</span>
              {parseFloat(product.price).toFixed(2)}
            </div>

            <p className="text-neutral-400 text-base mb-10 leading-relaxed whitespace-pre-wrap max-w-2xl">
              {product.description || "No description provided for this premium item."}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
              {/* Quantity Selector */}
              <div className="flex items-center bg-black border border-neutral-700 rounded-2xl p-1.5 h-16 w-full sm:w-auto">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
                >
                  <Minus size={20} />
                </button>
                <span className="w-16 text-center font-black text-xl">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="w-12 h-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product, quantity)}
                disabled={product.stock === 0}
                className="flex-1 w-full h-16 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] disabled:shadow-none"
              >
                <ShoppingCart size={22} /> {product.stock === 0 ? 'Currently Unavailable' : 'Add to Cart'}
              </motion.button>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-3 gap-2 mt-10 pt-10 border-t border-neutral-800">
              <div className="flex flex-col justify-center gap-3 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800/80">
                <Truck size={24} className="text-indigo-400" />
                <div>
                    <span className="block text-sm font-bold text-white mb-0.5">Nationwide</span>
                    <span className="text-xs text-neutral-500 font-medium">Fast Delivery</span>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-3 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800/80">
                <Shield size={24} className="text-indigo-400" />
                <div>
                    <span className="block text-sm font-bold text-white mb-0.5">Protected</span>
                    <span className="text-xs text-neutral-500 font-medium line-clamp-1">{product.warranty}</span>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-3 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800/80">
                <RotateCcw size={24} className="text-indigo-400" />
                <div>
                    <span className="block text-sm font-bold text-white mb-0.5">Returns</span>
                    <span className="text-xs text-neutral-500 font-medium line-clamp-1">{product.return_time}</span>
                </div>
              </div>
            </div>

          </motion.div>
        </div>

        {/* VERIFIED REVIEWS SECTION */}
        <div className="mt-20 pt-16 border-t border-neutral-900">
            <h2 className="text-3xl font-black mb-10 text-center tracking-tight">Customer Reviews</h2>
            
            {product.reviews && product.reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {product.reviews.map(review => (
                        <div key={review.id} className="bg-neutral-900/40 p-6 rounded-3xl border border-neutral-800/80 relative">
                            <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center font-bold uppercase border border-indigo-500/30">
                                        {review.user_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">{review.user_name}</p>
                                        <p className="text-xs text-neutral-500 flex items-center gap-1"><CheckCircle size={10} className="text-green-500"/> Verified Buyer</p>
                                    </div>
                                </div>
                                <div className="flex bg-yellow-500/10 px-2 py-1 rounded">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} className={i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-neutral-700"} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-neutral-300 text-sm leading-relaxed">"{review.comment}"</p>
                            <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider absolute bottom-4 right-6">
                                {new Date(review.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center bg-neutral-900/30 border border-neutral-800 rounded-3xl p-12 max-w-2xl mx-auto">
                    <Star size={40} className="text-neutral-700 mx-auto mb-4"/>
                    <h3 className="text-xl font-bold text-white mb-2">No reviews yet</h3>
                    <p className="text-neutral-500">Be the first to review this product after your purchase is delivered!</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default ProductDetails;