import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import api from '../services/api';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartTotal(total);
    localStorage.setItem('cart', JSON.stringify(cartItems));

    // Sync to backend for abandoned cart emails if user is logged in
    if (user) {
      // Debounce the API call by 2 seconds to prevent spamming
      const syncTimer = setTimeout(() => {
        api.post('/carts/sync/', { items: cartItems })
           .catch(err => console.log('Cart sync error (safe to ignore if endpoint is still building):', err));
      }, 2000);
      return () => clearTimeout(syncTimer);
    }
  }, [cartItems, user]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      
      // Stock Enforcement Check
      if (currentQty + quantity > product.stock) {
        alert(`Cannot add more! Only ${product.stock} items left in stock.`);
        return prevItems;
      }

      if (existingItem) {
        return prevItems.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevItems, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    
    // Stock Enforcement Check on increment
    setCartItems(prevItems => {
      const product = prevItems.find(item => item.id === productId);
      if (quantity > product.stock) {
        alert(`Stock limit reached! Only ${product.stock} items available.`);
        return prevItems;
      }
      return prevItems.map(item => item.id === productId ? { ...item, quantity } : item);
    });
  };

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      cartTotal, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};