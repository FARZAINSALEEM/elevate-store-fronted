import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Mail, Phone } from 'lucide-react';

const HelpDeskChat = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold">Elevate Support</h3>
                <p className="text-xs text-indigo-200">We typically reply in a few minutes.</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="p-4 bg-[#0a0a0a] flex-1 min-h-[200px] flex flex-col gap-3">
              <div className="bg-neutral-800 p-3 rounded-xl rounded-tl-sm text-sm text-neutral-200 w-[85%]">
                Hi there! 👋 How can we help you today with your tech needs?
              </div>
              <div className="bg-neutral-800 p-3 rounded-xl rounded-tl-sm text-sm text-neutral-200 w-[95%]">
                Our live agents are currently busy. For immediate assistance, please use the options below!
              </div>
            </div>

            <div className="p-4 bg-neutral-900 border-t border-neutral-800 space-y-2">
              <a href="mailto:support@elevatestore.com" className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white p-2.5 rounded-lg text-sm transition font-medium">
                <Mail size={16} /> Email Support
              </a>
              <a href="tel:+923000000000" className="w-full flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 p-2.5 rounded-lg text-sm transition font-medium border border-[#25D366]/30">
                <Phone size={16} /> WhatsApp Us
              </a>
            </div>
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