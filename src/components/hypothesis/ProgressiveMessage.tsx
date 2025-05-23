import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Button } from '../ui/button';
import Table from '../ui/Table';
import { MarkdownStyles } from './ChatFlow';

// Type pour les components ReactMarkdown 
type MarkdownComponentProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  inline?: boolean;
}

interface ProgressiveMessageProps {
  content: string;
  typingSpeed?: number;
  className?: string;
  onComplete?: () => void;
  structuredData?: any;
  markdownStyles?: MarkdownStyles;
}

const ProgressiveMessage: React.FC<ProgressiveMessageProps> = ({
  content,
  typingSpeed = 20,
  className = "",
  onComplete,
  structuredData,
  markdownStyles
}) => {
  // Nettoyer le contenu pour enlever 'undefined' et ajouter un espace au début si nécessaire
  const cleanContent = (" " + (content?.replace(/undefined$/g, '').replace(/undefined/g, '').trim() || '')).trim();
  
  const [displayedContent, setDisplayedContent] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // État pour détecter si le markdown contient déjà des tableaux
  const [containsMarkdownTables, setContainsMarkdownTables] = useState(false);
  
  // État pour les tableaux extraits
  const [tables, setTables] = useState<any[]>([]);

  // Référence pour le compteur de lignes (au lieu d'un useState)
  const rowCounterRef = useRef(0);
  
  // Réinitialiser le compteur de lignes à chaque nouveau rendu
  useEffect(() => {
    rowCounterRef.current = 0;
  }, [displayedContent]);
  
  // Extraire les tableaux des données structurées
  useEffect(() => {
    if (structuredData && structuredData.tables && structuredData.tables.length > 0) {
      setTables(structuredData.tables);
    }
  }, [structuredData]);
  
  // Vérifier si le contenu contient déjà des tableaux markdown
  useEffect(() => {
    // Expression régulière pour identifier les tableaux dans le markdown
    const tableRegex = /\|(.+)\|\s*\n\|[\s\-:]+\|/;
    setContainsMarkdownTables(tableRegex.test(cleanContent));
  }, [cleanContent]);
  
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

  // Si en chargement, afficher un message de chargement
  if (isLoading) {
    return <div className={`markdown-content ${className}`}>Chargement du message...</div>;
  }

  // Style amélioré pour les tableaux
  const tableStyle = {
    container: markdownStyles?.table?.className || "overflow-x-auto my-4 rounded-lg shadow-sm",
    table: "w-full border-collapse rounded-lg overflow-hidden bg-white",
    thead: "bg-gray-100 border-b",
    th: "p-3 text-left font-semibold text-gray-700 border-gray-200",
    tr: "",
    trEven: "bg-white",
    trOdd: "bg-gray-50",
    td: "p-3 border-t border-gray-200"
  };
  
  // Fonction pour obtenir la classe de ligne alternée
  const getRowClass = (rowIndex?: number) => {
    if (rowIndex !== undefined) {
      return rowIndex % 2 === 0 ? tableStyle.trEven : tableStyle.trOdd;
    }
    // Utiliser et incrémenter le compteur de référence
    const isEven = rowCounterRef.current % 2 === 0;
    rowCounterRef.current += 1;
    return isEven ? tableStyle.trEven : tableStyle.trOdd;
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: (props) => <p className="mb-2 last:mb-0">{props.children}</p>,
          h1: (props) => <h1 className="text-base font-bold mb-2 mt-3">{props.children}</h1>,
          h2: (props) => {
            const defaultClass = "text-base font-bold mb-2 mt-3";
            const customClass = markdownStyles?.h2?.className || "";
            return <h2 className={customClass || defaultClass}>{props.children}</h2>;
          },
          h3: (props) => {
            const defaultClass = "text-sm font-bold mb-2 mt-3";
            const customClass = markdownStyles?.h3?.className || "";
            return <h3 className={customClass || defaultClass}>{props.children}</h3>;
          },
          h4: (props) => <h4 className="text-sm font-bold mb-2 mt-3">{props.children}</h4>,
          ul: (props) => <ul className="list-disc pl-5 mb-2">{props.children}</ul>,
          ol: (props) => <ol className="list-decimal pl-5 mb-2">{props.children}</ol>,
          li: (props) => <li className="mb-1">{props.children}</li>,
          a: (props) => <a className="text-blue-600 underline" href={props.href}>{props.children}</a>,
          blockquote: (props) => <blockquote className="border-l-2 border-gray-300 pl-2 italic mb-2">{props.children}</blockquote>,
          code: ({node, inline, className, children, ...props}: any) => {
            return inline ? 
              <code className={`font-mono bg-gray-200 py-0.5 px-1 rounded text-xs ${className || ''}`} {...props}>{children}</code> :
              <code className={`font-mono block bg-gray-100 p-2 rounded text-xs overflow-x-auto mb-2 ${className || ''}`} {...props}>{children}</code>
          },
          pre: (props) => <pre className="bg-gray-100 p-2 rounded overflow-x-auto mb-2">{props.children}</pre>,
          table: (props) => (
            <div className={tableStyle.container}>
              <table className={tableStyle.table}>{props.children}</table>
            </div>
          ),
          thead: (props) => <thead className={tableStyle.thead}>{props.children}</thead>,
          tbody: (props) => <tbody>{props.children}</tbody>,
          tr: (props: any) => {
            // Utiliser une référence pour les numéros de ligne (pas de state)
            const rowClass = getRowClass();
            return <tr className={`${tableStyle.tr} ${rowClass}`}>{props.children}</tr>;
          },
          th: (props) => <th className={tableStyle.th}>{props.children}</th>,
          td: (props) => <td className={tableStyle.td}>{props.children}</td>,
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      
      {/* Afficher les tableaux structurés UNIQUEMENT s'il n'y a pas déjà des tableaux dans le markdown */}
      {tables.length > 0 && isComplete && !containsMarkdownTables && (
        <div className="my-3 space-y-4">
          {tables.map((table, index) => (
            <Table 
              key={`structured-table-${index}`}
              headers={table.headers}
              rows={table.rows}
              alignments={table.alignments || []}
              id={table.id || `structured-table-${index}`}
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