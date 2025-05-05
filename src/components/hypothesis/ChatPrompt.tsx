import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPromptProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
  showHint?: boolean;
}

const ChatPrompt: React.FC<ChatPromptProps> = ({ 
  onSubmit, 
  isLoading = false,
  showHint = true
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Automatically adjust textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      const messageToSend = message.trim();
      setIsSending(true);
      
      // Clear input immediately but animate upward
      setMessage('');
      
      // Small delay for animation
      await new Promise(resolve => setTimeout(resolve, 250));
      setIsSending(false);
      
      // Send the message to parent
      onSubmit(messageToSend);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <AnimatePresence>
        {isSending && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -20 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm text-gray-500 mb-2"
          >
            Sending...
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.form 
        onSubmit={handleSubmit} 
        className="relative"
        layout
      >
        <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the change you want to test..."
            className="w-full p-4 pr-16 rounded-2xl focus:outline-none resize-none h-12 max-h-[180px] overflow-hidden"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isLoading}
          />
          
          <AnimatePresence>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: message.trim() && !isLoading ? 1 : 0.5 
              }}
              whileTap={{ scale: 0.9 }}
              className="absolute right-2 bottom-2"
            >
              <Button 
                type="submit" 
                className={`rounded-xl p-2 ${
                  message.trim() && !isLoading 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-gray-200 text-gray-400'
                } transition-colors`}
                disabled={!message.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-white" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
        {showHint && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send or Shift+Enter for a new line
          </p>
        )}
      </motion.form>
    </div>
  );
};

export default ChatPrompt; 