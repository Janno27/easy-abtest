import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '../../types/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ProgressiveMessage from './ProgressiveMessage';

interface ChatFlowProps {
  messages: Message[];
  isLoading?: boolean;
}

// Composant d'indicateur de "thinking" simplifié avec effet dégradé
const ThinkingIndicator: React.FC<{messages: Message[]}> = ({ messages }) => {
  const [thinkingText, setThinkingText] = useState("Réflexion en cours");
  
  useEffect(() => {
    // Détecter la langue basée sur le dernier message de l'utilisateur
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1].content.toLowerCase();
      
      // Détection améliorée de la langue française (prioritaire)
      if (/\b(le|la|les|un|une|des|du|ce|cette|ces|je|tu|il|elle|nous|vous|ils|elles|est|sont|être|avoir|faire|dire|voir|pouvoir|vouloir|aller|dans|pour|avec|sur|de|et|ou|donc|car|qui|que|quoi|comment|pourquoi|quand|où)\b/.test(lastUserMessage)) {
        setThinkingText("Réflexion en cours");
      } 
      // Autres langues
      else if (/\b(the|and|is|in|to|for|a|that|of|this|how|why|what|when|where|who|which|are|with|by|as|an|at|from|have|has|had|will|would|should|could|can)\b/.test(lastUserMessage)) {
        setThinkingText("Thinking");
      } else if (/\b(el|la|en|es|por|que|para|los|las|un|una|como|cuando|donde|quien|cual|cuales|son|estar|tener|hacer|decir|ver|poder|querer|ir)\b/.test(lastUserMessage)) {
        setThinkingText("Pensando");
      } else if (/\b(o|a|os|as|no|um|uma|isso|para|de|em|por|como|quando|onde|quem|qual|quais|são|estar|ter|fazer|dizer|ver|poder|querer|ir)\b/.test(lastUserMessage)) {
        setThinkingText("Pensando");
      } else if (/\b(der|die|das|und|in|zu|für|ein|eine|ist|von|wer|wie|was|wann|wo|welche|welcher|sein|haben|machen|sagen|sehen|können|wollen|gehen)\b/.test(lastUserMessage)) {
        setThinkingText("Nachdenken");
      } else if (/\b(il|lo|la|le|i|e|un|una|per|che|di|in|chi|come|cosa|quando|dove|quale|quali|essere|avere|fare|dire|vedere|potere|volere|andare)\b/.test(lastUserMessage)) {
        setThinkingText("Pensando");
      } else {
        // Par défaut, français
        setThinkingText("Réflexion en cours");
      }
    }
  }, [messages]);
  
  return (
    <div className="flex justify-start py-2 px-2">
      <div className="thinking-indicator">
        <svg className="inline-block mr-1.5 -mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" />
          <path className="thinking-spinner" d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="2" />
        </svg>
        {thinkingText}<span className="thinking-dots">...</span>
      </div>
    </div>
  );
};

const ChatFlow: React.FC<ChatFlowProps> = ({ messages, isLoading = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [renderedMessages, setRenderedMessages] = useState<string[]>([]);

  // Add message IDs to track rendered progressive messages
  useEffect(() => {
    setRenderedMessages(messages.map(msg => msg.id));
  }, [messages]);

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
  }, [messages, isLoading, renderedMessages]);

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
                  : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
              }`}
            >
              {message.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              ) : (
                <ProgressiveMessage 
                  content={message.content} 
                  typingSpeed={15}
                  className="text-sm"
                />
              )}
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
      
      {/* Afficher l'indicateur de réflexion minimaliste quand isLoading est true */}
      {isLoading && <ThinkingIndicator messages={messages} />}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatFlow; 