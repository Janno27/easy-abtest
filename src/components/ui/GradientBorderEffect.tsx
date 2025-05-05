import React, { useState, useEffect, useRef } from 'react';

interface GradientBorderEffectProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  gradientColors?: string[];
  gradientOpacity?: number;
}

export const GradientBorderEffect: React.FC<GradientBorderEffectProps> = ({ 
  children, 
  className = "",
  borderWidth = 1,
  gradientColors = ["#9333ea", "#3b82f6", "#ec4899"],
  gradientOpacity = 0.2
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Fonction pour mettre à jour la position de la souris relativement au conteneur
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      // Normalisation des coordonnées entre 0 et 1
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePosition({ x, y });
    };
    
    // Surveiller les mouvements de souris sur toute la fenêtre
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Calculer l'angle en fonction de la position de la souris
  const angle = Math.atan2(mousePosition.y - 0.5, mousePosition.x - 0.5) * (180 / Math.PI);
  
  // Générer le style de dégradé linéaire avec les couleurs ajustées pour l'opacité
  const gradientColorsWithOpacity = gradientColors.map(color => {
    // Si le format est #rrggbb, convertir en rgba
    if (color.startsWith('#') && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${gradientOpacity})`;
    }
    return color; // Retourner tel quel si format différent
  });
  
  const gradientStyle = {
    "--gradient-angle": `${angle}deg`,
    "--gradient-colors": gradientColorsWithOpacity.join(", "),
    "--border-width": `${borderWidth}px`,
    position: "relative",
    padding: `${borderWidth}px`,
    borderRadius: "1rem",
    background: `linear-gradient(${angle}deg, ${gradientColorsWithOpacity.join(", ")})`,
    transition: "background 0.3s ease"
  } as React.CSSProperties;

  const contentStyle = {
    background: "white",
    borderRadius: `calc(1rem - ${borderWidth}px)`,
    width: "100%",
    height: "100%",
    position: "relative" as const,
    zIndex: 2,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
  };
  
  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={gradientStyle}
    >
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
}; 