import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThinkingEvent } from '../../types/types';
import { hypothesisService } from '../../services/hypothesisService';
import './ThinkingSteps.css';

interface ThinkingStepsProps {
    conversationId?: string;
    message?: string;
    messageHistory?: any[];
    model?: string;
    isVisible: boolean;
}

// Fonction pour détecter la langue de manière simple
const detectLanguage = (text?: string): string => {
    if (!text) return 'fr';
    
    const frenchWords = /\b(le|la|les|un|une|des|du|ce|cette|ces|je|tu|il|elle|nous|vous|ils|elles|et|ou|donc|car|mais|pour|avec|dans|sur|sous|de|en|au|aux)\b/i;
    const englishWords = /\b(the|a|an|and|or|but|if|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|in|out|on|off|over|under|again|further|then|once)\b/i;
    const spanishWords = /\b(el|la|los|las|un|una|unos|unas|y|o|pero|si|de|a|en|por|para|contra|como|hasta|hacia|desde|durante|mediante|según|sin|sobre|tras|entre)\b/i;
    const germanWords = /\b(der|die|das|ein|eine|und|oder|aber|wenn|von|bei|mit|durch|für|gegen|über|unter|auf|hinter|neben|zwischen|vor|nach|zu|aus|ohne|um|trotz)\b/i;
    
    if (frenchWords.test(text)) return 'fr';
    if (englishWords.test(text)) return 'en';
    if (spanishWords.test(text)) return 'es';
    if (germanWords.test(text)) return 'de';
    
    return 'fr'; // Français par défaut
};

export default function ThinkingSteps({ 
    conversationId, 
    message = '', 
    messageHistory = [], 
    model = 'deepseek-reasoner', 
    isVisible 
}: ThinkingStepsProps) {
    const [steps, setSteps] = useState<ThinkingEvent[]>([]);
    const [error, setError] = useState<string|null>(null);
    const [closeStream, setCloseStream] = useState<(() => void) | null>(null);
    
    // Références pour le défilement automatique
    const containerRef = useRef<HTMLDivElement>(null);
    const reasoningContentRef = useRef<HTMLDivElement>(null);
    
    // Détection de la langue du message
    const language = useMemo(() => detectLanguage(message), [message]);
    
    // Titres des étapes selon la langue
    const stepTitles = useMemo(() => {
        if (language === 'en') {
            return {
                'init': 'Initialization',
                'reasoning': 'Analysis',
                'validation': 'Validation',
                'error': 'Error'
            };
        } else if (language === 'es') {
            return {
                'init': 'Inicialización',
                'reasoning': 'Análisis',
                'validation': 'Validación',
                'error': 'Error'
            };
        } else if (language === 'de') {
            return {
                'init': 'Initialisierung',
                'reasoning': 'Analyse',
                'validation': 'Validierung',
                'error': 'Fehler'
            };
        } else {
            // Français par défaut
            return {
                'init': 'Initialisation',
                'reasoning': 'Analyse',
                'validation': 'Validation',
                'error': 'Erreur'
            };
        }
    }, [language]);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { 
            opacity: 1,
            y: 0,
            transition: { duration: 0.2 }
        },
        exit: { 
            opacity: 0,
            y: -10,
            transition: { duration: 0.2 }
        }
    };

    // Défilement automatique lorsque les étapes changent
    useEffect(() => {
        if (steps.length > 0 && reasoningContentRef.current) {
            reasoningContentRef.current.scrollTop = reasoningContentRef.current.scrollHeight;
        }
        
        if (containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [steps]);

    // Connecter le streaming lorsque isVisible devient true
    useEffect(() => {
        if (isVisible && message) {
            // Initialiser avec des tableaux vides
            setSteps([]);
            setError(null);
            
            try {
                console.log("Connecting to stream...");
                const closeStreamFn = hypothesisService.streamHypothesis(
                    message,
                    conversationId,
                    messageHistory,
                    model,
                    (event) => {
                        if (event) {
                            setSteps(prev => {
                                const stepExists = prev.some(s => s.step === event.step);
                                if (stepExists) {
                                    // Remplacer l'étape existante
                                    return prev.map(s => s.step === event.step ? event : s);
                                } else {
                                    // Ajouter une nouvelle étape
                                    return [...prev, event];
                                }
                            });
                        }
                    },
                    (errorMsg) => {
                        console.error("Stream error:", errorMsg);
                        setError(errorMsg);
                    }
                );
                
                setCloseStream(() => closeStreamFn);
                
                return () => {
                    console.log("Closing stream...");
                    closeStreamFn();
                    setCloseStream(null);
                };
            } catch (err) {
                console.error("Error initiating stream:", err);
                setError("Impossible de démarrer l'analyse");
            }
        }
        
        // Nettoyage lorsque isVisible devient false
        return () => {
            if (closeStream) {
                closeStream();
                setCloseStream(null);
            }
        };
    }, [isVisible, message, conversationId]);

    // Formater le contenu de raisonnement
    const formatReasoningContent = (content?: string) => {
        if (!content) return "";
        
        return content
            .split('\n')
            .filter(line => line.trim().length > 0)
            .join('\n');
    };

    // Si le composant n'est pas visible ou s'il n'y a pas d'étapes, ne rien afficher
    if (!isVisible || steps.length === 0) return null;

    // Filtrer pour n'afficher que des étapes significatives
    const filteredSteps = steps.filter(step => 
        step.step === 'reasoning' && 
        (step.reasoning_content || step.status === 'completed')
    );
    
    if (filteredSteps.length === 0 && !error) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="thinking-steps-container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                ref={containerRef}
            >
                <div className="thinking-steps-content">
                    {filteredSteps.map((step, i) => (
                        <div key={i} className={`thinking-step ${step.status}`}>
                            <div className="step-dot-container">
                                <div className="step-dot"></div>
                                <div className="step-connector"></div>
                            </div>
                            <div className="step-content">
                                <div className="step-title">
                                    {stepTitles[step.step as keyof typeof stepTitles] || step.step}
                                </div>
                                {(step.details || step.reasoning_content) && (
                                    <div className="step-details">
                                        {step.details && <p>{step.details}</p>}
                                        {step.reasoning_content && (
                                            <div className="reasoning-content" ref={reasoningContentRef}>
                                                {formatReasoningContent(step.reasoning_content)
                                                    .split('\n')
                                                    .map((line, j) => (
                                                        <p key={j} className="reasoning-line">{line}</p>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {error && (
                        <div className="thinking-step error">
                            <div className="step-dot-container">
                                <div className="step-dot error"></div>
                            </div>
                            <div className="step-content">
                                <div className="step-title">{stepTitles['error' as keyof typeof stepTitles]}</div>
                                <div className="step-details error">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
} 