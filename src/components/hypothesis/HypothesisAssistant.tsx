import React, { useState, useEffect, useRef } from 'react';
import { GradientBorderEffect } from '../ui/GradientBorderEffect';
import ChatPrompt from './ChatPrompt';
import ChatFlow from './ChatFlow';
import { ArrowLeft } from 'lucide-react';

// Define message interface
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const HypothesisAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showInitialPrompt, setShowInitialPrompt] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (message: string) => {
    // Generate unique ID
    const newId = `msg-${Date.now()}`;
    
    // Add user message
    const userMessage: Message = {
      id: newId,
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setShowInitialPrompt(false);
    setIsLoading(true);
    
    // Simulate API response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: generateResponse(message),
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  // Simple response generator (will be replaced by API)
  const generateResponse = (message: string) => {
    const responses = [
      "That's an interesting problem to solve. Could you tell me what specific metric you want to improve?",
      "I understand the change you're proposing. What business outcome are you trying to affect?",
      "Based on your description, I can help formulate a hypothesis. What's your current conversion rate?",
      "This seems like a good test opportunity. What has your research shown about this issue so far?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Get a title based on the first user message
  const getChatTitle = () => {
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) return "New Hypothesis";
    
    // Truncate long messages
    const content = firstUserMessage.content;
    return content.length > 40 ? content.substring(0, 37) + '...' : content;
  };

  // Handle reset to initial state
  const handleReset = () => {
    setShowInitialPrompt(true);
    setMessages([]);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-180px)]">
      <GradientBorderEffect 
        className="w-full h-full"
        gradientColors={["#9333ea", "#3b82f6", "#ec4899"]}
        borderWidth={1}
        gradientOpacity={0.15}
      >
        <div className="bg-purple-50/30 rounded-2xl p-8 pt-1 shadow-sm flex flex-col h-full relative">
          {!showInitialPrompt && (
            <div className="sticky top-0 z-10 -mx-8 px-8 py-2 bg-white/60 rounded-t-2xl backdrop-blur-sm border-b border-gray-100 flex items-center mb-4">
              <div className="flex items-center w-full">
                <button 
                  onClick={handleReset}
                  className="mr-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                  aria-label="Back to start"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-600" />
                </button>
                <h2 className="font-medium text-gray-800 truncate flex-1 text-sm">
                  {getChatTitle()}
                </h2>
              </div>
            </div>
          )}
          
          {showInitialPrompt ? (
            <div className="flex flex-col justify-between h-full">
              <div className="flex-1"></div>
              <div className="text-center mb-12">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
                    <circle cx="7.5" cy="14.5" r=".5"></circle>
                    <circle cx="16.5" cy="14.5" r=".5"></circle>
                  </svg>
                  AI-Powered Assistant
                </div>
                <h1 className="text-3xl font-medium text-gray-800">
                  What problem are you trying to solve?
                </h1>
                <p className="text-gray-600 mt-4 max-w-2xl mx-auto mb-10">
                  Describe the <strong>issue</strong> you've identified and the change you want to test. 
                  I'll help you <strong>formulate</strong> a structured <strong>hypothesis</strong> for your A/B test.
                </p>
              </div>
              
              <div className="transition-all duration-300 ease-in-out mb-4">
                <ChatPrompt onSubmit={handleSubmit} isLoading={isLoading} showHint={true} />
              </div>
              <div className="flex-1"></div>
            </div>
          ) : (
            <>
              <div 
                ref={chatContainerRef}
                className="flex-grow overflow-y-auto transition-all duration-300 ease-in-out pb-6 -mt-4 pt-4"
              >
                <ChatFlow messages={messages} />
              </div>
              
              <div className="transition-all duration-300 ease-in-out mt-auto">
                <ChatPrompt onSubmit={handleSubmit} isLoading={isLoading} showHint={false} />
              </div>
            </>
          )}
        </div>
      </GradientBorderEffect>
    </div>
  );
};

export default HypothesisAssistant; 