import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Sparkles, Send, Loader2 } from 'lucide-react';
import { copilotChat } from '../api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await copilotChat(input);
      setMessages(prev => [...prev, { role: 'assistant', content: response.explanation }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 drawer-overlay"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 surface-drawer flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-fintech-border shrink-0 bg-fintech-surface">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-fintech-primary/10 text-fintech-primary rounded-xl border border-fintech-primary/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-fintech-text tracking-tight flex items-center gap-1.5">
                    Sentinel Copilot <Sparkles className="w-3 h-3 text-fintech-safe" />
                  </h2>
                  <p className="text-[10px] text-fintech-muted">Risk Operations Assistant</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-fintech-subcard text-fintech-muted hover:text-fintech-text transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-fintech-bg">
              {messages.length === 0 && (
                <div className="text-center mt-10">
                  <div className="inline-block p-4 bg-fintech-subcard border border-fintech-border rounded-full mb-3">
                    <Bot className="w-8 h-8 text-fintech-primary" />
                  </div>
                  <h3 className="text-xs font-bold text-fintech-text mb-1">How can I help you today?</h3>
                  <p className="text-[10px] text-fintech-muted max-w-[250px] mx-auto">
                    Ask me about specific orders, risk rules, duplicate patterns, or how to tune your policy.
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-[11px] leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-fintech-primary text-white'
                      : 'surface-card text-fintech-text border border-fintech-border'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="surface-card rounded-2xl p-3 text-[11px] text-fintech-muted flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-fintech-primary" /> Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-fintech-border bg-fintech-surface shrink-0">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Copilot..."
                  className="w-full bg-fintech-bg border border-fintech-border rounded-xl pl-4 pr-12 py-3 text-[11px] text-fintech-text focus:outline-none focus:border-fintech-primary placeholder-fintech-muted shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 p-1.5 bg-fintech-primary hover:opacity-90 text-white rounded-lg disabled:opacity-50 disabled:hover:opacity-50 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
