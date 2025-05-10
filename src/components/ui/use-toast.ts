import { useState, useEffect } from 'react';

type ToastVariant = 'default' | 'success' | 'destructive';

interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

const DEFAULT_TOAST_DURATION = 5000;

export function toast(props: ToastProps) {
  // Cette fonction sera remplacée par l'implémentation réelle
  // Pour l'instant, simple console log
  console.log(`Toast: ${props.variant || 'default'}`, props.title, props.description);
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const addToast = (props: ToastProps) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...props, id }]);
    
    // Retirer automatiquement après la durée spécifiée
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, props.duration || DEFAULT_TOAST_DURATION);
    
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toast: addToast,
    dismissToast,
    toasts,
  };
} 