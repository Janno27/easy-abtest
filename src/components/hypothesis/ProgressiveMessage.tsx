import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface ProgressiveMessageProps {
  content: string;
  typingSpeed?: number;
  className?: string;
  onComplete?: () => void;
}

const ProgressiveMessage: React.FC<ProgressiveMessageProps> = ({
  content,
  typingSpeed = 20,
  className = "",
  onComplete
}) => {
  // Nettoyer le contenu pour enlever 'undefined' à la fin
  const cleanContent = content?.replace(/undefined$/, '').trim() || '';
  
  const [displayedContent, setDisplayedContent] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    // Réinitialiser lorsque le contenu change
    setDisplayedContent("");
    setIsComplete(false);
    
    let currentIndex = 0;
    const totalLength = cleanContent.length;
    
    const typingInterval = setInterval(() => {
      if (currentIndex < totalLength) {
        // Ajouter le caractère suivant
        setDisplayedContent(prev => prev + cleanContent[currentIndex]);
        currentIndex++;
      } else {
        // Fin de l'animation
        clearInterval(typingInterval);
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }, typingSpeed);
    
    return () => clearInterval(typingInterval);
  }, [cleanContent, typingSpeed, onComplete]);

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
          h1: ({node, ...props}) => <h1 className="text-base font-bold mb-2 mt-3" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-2 mt-3" {...props} />,
          h4: ({node, ...props}) => <h4 className="text-sm font-bold mb-2 mt-3" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
          li: ({node, ...props}) => <li className="mb-1" {...props} />,
          a: ({node, ...props}) => <a className="text-blue-600 underline" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-gray-300 pl-2 italic mb-2" {...props} />,
          code: ({inline, className, ...props}: any) => 
            inline ? 
              <code className={`font-mono bg-gray-200 py-0.5 px-1 rounded text-xs ${className || ''}`} {...props} /> :
              <code className={`font-mono block bg-gray-100 p-2 rounded text-xs overflow-x-auto mb-2 ${className || ''}`} {...props} />,
          pre: ({node, ...props}) => <pre className="bg-gray-100 p-2 rounded overflow-x-auto mb-2" {...props} />,
          table: ({node, ...props}) => <table className="min-w-full border border-gray-300 mb-2" {...props} />,
          tr: ({node, ...props}) => <tr className="border-b border-gray-300" {...props} />,
          th: ({node, ...props}) => <th className="p-1 text-left font-medium border-r border-gray-300 last:border-r-0" {...props} />,
          td: ({node, ...props}) => <td className="p-1 border-r border-gray-300 last:border-r-0" {...props} />,
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      
      {/* Curseur clignotant visible seulement pendant la saisie */}
      {!isComplete && (
        <span className="typing-cursor"></span>
      )}
    </div>
  );
};

export default ProgressiveMessage; 