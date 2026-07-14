import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, Phone, Mail, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const HelpDeskChat = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isResolved, setIsResolved] = useState(false);
  
  // State to hold the dynamic store contact settings
  const [settings, setSettings] = useState({ 
    support_email: 'Loading...', 
    support_phone: 'Loading...' 
  });
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch contact info so it's ready if the user isn't logged in
    api.get('/settings/')
      .then(res => setSettings(res.data))
      .catch(err => console.error("Failed to load store settings:", err));
  }, []);

  useEffect(() => {
    let interval;
    // Only poll for messages if the chat is open AND the user is a regular customer
    if (isOpen && user && !user.is_staff) {
      fetchMessages(); // initial fetch immediately
      interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isOpen, user]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/chat/user/');
      setMessages(res.data.messages || []);
      setIsResolved(res.data.is_resolved || false);
    } catch (err) { 
      console.error("Chat Fetch Error:", err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const savedText = inputText;
    setInputText(''); // Clear input immediately for smooth UX
    
    try {
      await api.post('/chat/user/', { message: savedText });
      fetchMessages(); // Fetch immediately after sending to show the new message
    } catch (err) { 
      console.error("Chat Send Error:", err.response?.data || err.message);
      alert("Failed to send message. Please check your connection.");
      setInputText(savedText); // Restore the text if it failed to send!
    }
  };

  const handleStartNewChat = () => {
    setMessages([]);
    setIsResolved(false);
  };

  // Do not show the floating widget for Admin users (they have a dedicated dashboard tab)
  if (user?.is_staff) return null; 

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-[340px] md:w-96 h-[500px] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-md z-10">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Live Support
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">We typically reply in a few minutes.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-indigo-200 hover:text-white transition-colors p-1 bg-white/10 hover:bg-white/20 rounded-full"
              >
                <X size={20}/>
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto bg-black/50 custom-scrollbar space-y-4">
              {!user ? (
                // Logged-out view showing dynamic contact info
                <div className="h-full flex flex-col items-center justify-center text-center px-4 text-neutral-400">
                  <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                    <User size={32} className="text-neutral-500" />
                  </div>
                  <p className="mb-6 text-white font-medium">Please sign in to your account to start a live chat.</p>
                  
                  <div className="w-full border-t border-neutral-800 pt-6 space-y-3 text-sm text-left">
                    <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-2">Or Contact Us Directly</p>
                    <div className="flex items-center gap-3 bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800">
                      <Mail size={18} className="text-indigo-400 flex-shrink-0" />
                      <span className="text-neutral-300 truncate">{settings.support_email}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800">
                      <Phone size={18} className="text-indigo-400 flex-shrink-0" />
                      <span className="text-neutral-300">{settings.support_phone}</span>
                    </div>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                // Empty chat view
                <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 text-sm">
                  <MessageCircle size={40} className="mb-3 opacity-20" />
                  <p>Send a message to start the conversation!</p>
                  <p className="text-xs mt-2 opacity-60">An admin will be with you shortly.</p>
                </div>
              ) : (
                // Active chat messages view
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-md ${msg.is_admin ? 'bg-neutral-800 text-white rounded-tl-sm' : 'bg-indigo-600 text-white rounded-tr-sm'}`}>
                      {msg.text}
                      <span className="block text-[10px] opacity-60 mt-1.5 text-right">{msg.time}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form / Resolved Status (Only for logged-in users) */}
            {user && !isResolved && (
              <form onSubmit={handleSend} className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2">
                <input 
                  type="text" 
                  value={inputText} 
                  onChange={e => setInputText(e.target.value)} 
                  placeholder="Type your message..." 
                  className="flex-1 bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim()} 
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white p-3 rounded-xl transition-colors shadow-lg"
                >
                  <Send size={18} className={inputText.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
                </button>
              </form>
            )}

            {user && isResolved && (
              <div className="p-4 bg-neutral-900 border-t border-neutral-800 text-center flex flex-col items-center justify-center">
                <p className="text-sm text-green-400 font-bold mb-2 flex items-center justify-center gap-2">
                  <CheckCircle size={16}/> Ticket Resolved
                </p>
                <button 
                  onClick={handleStartNewChat} 
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors px-4 py-2 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10"
                >
                  Start New Conversation
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 border-4 border-[#0a0a0a]"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
};

export default HelpDeskChat;