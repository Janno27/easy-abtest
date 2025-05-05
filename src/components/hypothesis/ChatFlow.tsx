import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatFlowProps {
  messages: Message[];
}

const ChatFlow: React.FC<ChatFlowProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Animation variants
  const messageVariants = {
    initial: (custom: 'user' | 'assistant') => ({
      opacity: 0,
      y: custom === 'user' ? 20 : -20,
      scale: 0.95,
    }),
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: (custom: 'user' | 'assistant') => ({
      opacity: 0,
      y: custom === 'user' ? -20 : 20,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    })
  };

  // Scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col space-y-4 px-2">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            custom={message.role}
            variants={messageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            layout
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div 
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-purple-200' : 'text-gray-400'
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatFlow; 