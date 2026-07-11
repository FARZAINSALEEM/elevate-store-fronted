import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Mail, Phone } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const HelpDeskChat = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [settings, setSettings] = useState({ support_email: '', support_phone: '' });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch store contact settings
    api.get('/settings/').then(res => setSettings(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    let interval;
    if (isOpen && user) {
      fetchMessages(); // Fetch immediately on open
      interval = setInterval(fetchMessages, 5000); // Poll every 5s
    }
    return () => clearInterval(interval);
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/chat/user/');
      setMessages(res.data.messages || []);
    } catch (err) { }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    try {
      await api.post('/chat/user/', { message: inputText });
      setInputText('');
      fetchMessages();
    } catch (err) { }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 md:w-96 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[450px]"
          >
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-md z-10">
              <div>
                <h3 className="font-bold">Elevate Support</h3>
                <p className="text-xs text-indigo-200">{user ? 'Live Chat Agent' : 'Contact Us'}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white"><X size={20}/></button>
            </div>
            
            {user ? (
              <>
                <div className="flex-1 bg-[#0a0a0a] p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                  <div className="bg-neutral-800 p-3 rounded-xl rounded-tl-sm text-sm text-neutral-200 w-[85%] self-start">
                    Hi {user.username}! 👋 How can we help you today with your order?
                  </div>
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.is_admin ? 'bg-neutral-800 text-neutral-200 rounded-tl-sm self-start' : 'bg-indigo-600 text-white rounded-tr-sm self-end'}`}>
                      {msg.text}
                      <span className="block text-[10px] opacity-50 mt-1 text-right">{msg.time}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSend} className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type your message..." 
                    className="flex-1 bg-black border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 w-10 flex items-center justify-center rounded-xl text-white transition"><Send size={16}/></button>
                </form>
              </>
            ) : (
              <div className="flex-1 bg-[#0a0a0a] p-6 flex flex-col items-center justify-center text-center space-y-6">
                <div>
                  <MessageCircle size={48} className="text-indigo-500/50 mx-auto mb-4" />
                  <p className="text-neutral-400 text-sm">Please log in to use live chat, or contact us directly via the channels below.</p>
                </div>
                <div className="w-full space-y-3">
                  <a href={`mailto:${settings.support_email}`} className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white p-3 rounded-xl text-sm transition font-medium w-full">
                    <Mail size={16} /> {settings.support_email}
                  </a>
                  <a href={`tel:${settings.support_phone}`} className="flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 p-3 rounded-xl text-sm transition font-medium w-full">
                    <Phone size={16} /> {settings.support_phone}
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:bg-indigo-500 hover:scale-110 transition-all duration-300"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default HelpDeskChat;