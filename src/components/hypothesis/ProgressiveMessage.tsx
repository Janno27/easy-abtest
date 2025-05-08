import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Button } from '../ui/button';
import Table from '../../components/ui/Table';

interface ProgressiveMessageProps {
  content: string;
  typingSpeed?: number;
  className?: string;
  onComplete?: () => void;
  structuredData?: any;
}

const ProgressiveMessage: React.FC<ProgressiveMessageProps> = ({
  content,
  typingSpeed = 20,
  className = "",
  onComplete,
  structuredData
}) => {
  // Nettoyer le contenu pour enlever 'undefined' et ajouter un espace au début si nécessaire
  const cleanContent = (" " + (content?.replace(/undefined$/g, '').replace(/undefined/g, '').trim() || '')).trim();
  
  const [displayedContent, setDisplayedContent] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // État pour les tableaux extraits
  const [tables, setTables] = useState<any[]>([]);
  
  // Extraire les tableaux des données structurées
  useEffect(() => {
    if (structuredData && structuredData.tables && structuredData.tables.length > 0) {
      setTables(structuredData.tables);
    }
  }, [structuredData]);
  
  // Ajouter un délai de chargement initial
  useEffect(() => {
    // Précharger le contenu complet avant de commencer l'animation
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      
      // Commencer avec le premier caractère déjà affiché
      if (cleanContent.length > 0) {
        setDisplayedContent(cleanContent.charAt(0));
      }
    }, 800); // Délai plus long de 800ms
    
    return () => clearTimeout(loadingTimeout);
  }, [cleanContent]);
  
  useEffect(() => {
    // Ne commencer l'animation que lorsque le chargement est terminé
    if (isLoading) return;
    
    // Commencer à partir du deuxième caractère puisque le premier est déjà affiché
    let currentIndex = 1;
    const totalLength = cleanContent.length;
    
    const typingInterval = setInterval(() => {
      if (currentIndex < totalLength) {
        // Ajouter le caractère suivant
        setDisplayedContent(cleanContent.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        // Fin de l'animation
        clearInterval(typingInterval);
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }, typingSpeed);
    
    return () => clearInterval(typingInterval);
  }, [cleanContent, typingSpeed, onComplete, isLoading]);

  // Fonction pour nettoyer le contenu des tableaux markdown
  const cleanContentFromTables = (content: string): string => {
    if (!content) return '';
    
    // Expression régulière pour trouver les tableaux markdown
    const tablePattern = /(\|[^\n]+\|\r?\n)((?:\|[-:| ]+\|\r?\n))+((?:\|[^\n]+\|\r?\n)+)/g;
    
    // Supprimer complètement les tableaux markdown
    return content.replace(tablePattern, '\n\n').replace(/\[TABLE_PLACEHOLDER_\d+\]/g, '');
  };

  // Nettoyer le contenu affiché
  const cleanedContent = cleanContentFromTables(displayedContent);

  // Si en chargement, afficher un message de chargement
  if (isLoading) {
    return <div className={`markdown-content ${className}`}>Chargement du message...</div>;
  }

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
          // Supprimer complètement les tableaux markdown
          table: () => <></>,
          thead: () => <></>,
          tbody: () => <></>,
          tr: () => <></>,
          th: () => <></>,
          td: () => <></>,
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
      
      {/* Afficher les tableaux structurés uniquement une fois le message complet */}
      {tables.length > 0 && isComplete && (
        <div className="my-3 space-y-4">
          {tables.map((table, index) => (
            <Table 
              key={`table-${index}`}
              headers={table.headers}
              rows={table.rows}
              alignments={table.alignments || []}
              id={table.id || `table-${index}`}
            />
          ))}
        </div>
      )}
      
      {/* Curseur clignotant visible seulement pendant la saisie */}
      {!isComplete && !isLoading && (
        <span className="typing-cursor"></span>
      )}
    </div>
  );
};

export default ProgressiveMessage; 