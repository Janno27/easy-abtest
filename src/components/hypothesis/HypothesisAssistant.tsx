import React, { useState, useEffect, useRef } from 'react';
import { GradientBorderEffect } from '../ui/GradientBorderEffect';
import ChatPrompt from './ChatPrompt';
import ChatFlow from './ChatFlow';
import ResizeChat from './ResizeChat';
import ThinkingSteps from './ThinkingSteps';
import { ArrowLeft } from 'lucide-react';
import { Message } from '../../types/types';
import { hypothesisService } from '../../services/hypothesisService';

const HypothesisAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showInitialPrompt, setShowInitialPrompt] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string>('deepseek');
  const [generatedTitle, setGeneratedTitle] = useState<string>("");
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showThinkingSteps, setShowThinkingSteps] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Styles globaux pour le markdown des messages
  const markdownStyles = {
    h2: { className: "font-bold text-base mt-6 mb-3" },
    h3: { className: "font-bold text-sm mt-5 mb-2" },
    table: { className: "mt-3 mb-5" },
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (message: string, model = 'deepseek') => {
    // Generate unique ID
    const newId = `msg-${Date.now()}`;
    const isFirstMessage = messages.length === 0;
    
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
    setCurrentModel(model);
    setShowThinkingSteps(true);
    setCurrentMessage(message);
    
    // Pour le premier message, générer un titre
    if (isFirstMessage) {
      setIsGeneratingTitle(true);
      try {
        const title = await hypothesisService.generateTitle(message, model);
        setGeneratedTitle(title);
      } catch (error) {
        console.error('Error generating title:', error);
        // Fallback à un titre simple
        setGeneratedTitle(message.length > 30 ? message.substring(0, 30) + '...' : message);
      } finally {
        setIsGeneratingTitle(false);
      }
    }
    
    try {
      // Call the API service to get a response
      const response = await hypothesisService.generateResponse(
        message,
        conversationId,
        messages,
        model
      );
      
      // Update the conversation ID if it's new
      if (response.conversationId && !conversationId) {
        setConversationId(response.conversationId);
      }
      
      // Add the assistant's response to the messages
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Error getting response:', error);
      
      // Add a fallback error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Cacher les étapes de réflexion après un court délai
      setTimeout(() => setShowThinkingSteps(false), 1000);
    }
  };

  // Get a title based on the generated title or first user message
  const getChatTitle = () => {
    if (generatedTitle) {
      return generatedTitle;
    }
    
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) return "Nouvelle hypothèse";
    
    // Truncate long messages
    const content = firstUserMessage.content;
    return content.length > 40 ? content.substring(0, 37) + '...' : content;
  };

  // Handle reset to initial state
  const handleReset = () => {
    setShowInitialPrompt(true);
    setMessages([]);
    setConversationId(null);
    setGeneratedTitle("");
    setShowThinkingSteps(false);
    setCurrentMessage("");
  };

  // Fonction pour gérer le redimensionnement de la fenêtre de chat
  const handleResize = (expanded: boolean) => {
    setIsExpanded(expanded);
  };

  return (
    <div className={`mx-auto transition-all duration-300 ${
      isExpanded 
        ? 'max-w-5xl h-[calc(100vh-100px)] fixed top-[60px] left-0 right-0 z-50' 
        : 'max-w-4xl h-[calc(100vh-180px)]'
    }`}>
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
                  {isGeneratingTitle ? (
                    <span className="inline-flex items-center">
                      <span className="w-3 h-3 mr-1.5 opacity-70">
                        <svg className="animate-spin h-full w-full text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      {getChatTitle() || "Titre en cours..."}
                    </span>
                  ) : (
                    getChatTitle()
                  )}
                </h2>
                
                {/* Bouton de redimensionnement */}
                <ResizeChat 
                  onResize={handleResize}
                  isExpanded={isExpanded}
                />
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
                <ChatPrompt onSubmit={handleSubmit} isLoading={isLoading} showHint={true} selectedModel={currentModel} />
              </div>
              <div className="flex-1"></div>
            </div>
          ) : (
            <>
              <div 
                ref={chatContainerRef}
                className="flex-grow overflow-y-auto transition-all duration-300 ease-in-out pb-6 -mt-4 pt-4"
              >
                <ChatFlow 
                  messages={messages} 
                  isLoading={isLoading} 
                  markdownStyles={markdownStyles}
                />
                
                {/* Intégrer ThinkingSteps juste après l'indicateur de réflexion */}
                {isLoading && (
                  <ThinkingSteps 
                    conversationId={conversationId || undefined}
                    message={currentMessage}
                    messageHistory={messages}
                    model={currentModel}
                    isVisible={showThinkingSteps && isLoading}
                  />
                )}
              </div>
              
              <div className="transition-all duration-300 ease-in-out mt-auto">
                <ChatPrompt onSubmit={handleSubmit} isLoading={isLoading} showHint={false} selectedModel={currentModel} />
              </div>
            </>
          )}
        </div>
      </GradientBorderEffect>
    </div>
  );
};

export default HypothesisAssistant; 