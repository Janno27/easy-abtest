import React, { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface ResizeChatProps {
  onResize: (isExpanded: boolean) => void;
  isExpanded: boolean;
}

const ResizeChat: React.FC<ResizeChatProps> = ({ onResize, isExpanded }) => {
  return (
    <button
      onClick={() => onResize(!isExpanded)}
      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
      aria-label={isExpanded ? "Réduire la fenêtre" : "Agrandir la fenêtre"}
      title={isExpanded ? "Réduire la fenêtre" : "Agrandir la fenêtre"}
    >
      {isExpanded ? (
        <Minimize2 className="h-4 w-4 text-gray-500" />
      ) : (
        <Maximize2 className="h-4 w-4 text-gray-500" />
      )}
    </button>
  );
};

export default ResizeChat; 