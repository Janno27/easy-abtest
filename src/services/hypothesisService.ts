import { Message, HypothesisApiResponse } from '../types/types';

class HypothesisService {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }
  
  /**
   * Convert frontend message format to API format
   */
  private formatMessagesForApi(messages: Message[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
  
  /**
   * Get API keys from localStorage
   */
  private getApiKeys(): Record<string, string> {
    try {
      const savedKeys = localStorage.getItem('model_api_keys');
      if (savedKeys) {
        return JSON.parse(savedKeys);
      }
    } catch (error) {
      console.error('Error parsing model API keys from localStorage:', error);
    }
    return {};
  }
  
  /**
   * Generate a hypothesis or response from the AI
   */
  async generateResponse(
    message: string, 
    conversationId: string | null, 
    messageHistory: Message[],
    model: string = 'llama'
  ): Promise<Message> {
    try {
      // Définir un controller pour gérer le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 secondes de timeout
      
      // Récupérer les clés API depuis localStorage
      const apiKeys = this.getApiKeys();
      
      const response = await fetch(`${this.apiUrl}/hypothesis/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
          message_history: this.formatMessagesForApi(messageHistory),
          model: model,
          api_keys: apiKeys // Ajouter les clés API à la requête
        }),
        signal: controller.signal
      });
      
      // Nettoyer le timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate hypothesis');
      }
      
      const data: HypothesisApiResponse = await response.json();
      
      // Nettoyer le message pour supprimer "undefined" à la fin s'il est présent
      const cleanedMessage = data.message?.replace(/undefined$/g, '').replace(/undefined/g, '').trim() || '';
      
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: cleanedMessage,
        timestamp: data.timestamp * 1000, // Convert to milliseconds
        conversationId: data.conversation_id,
        structuredData: data.structured_data,
        lang_confidence: data.lang_confidence
      };
    } catch (error) {
      console.error('Error generating hypothesis:', error);
      
      // Return a fallback message on error
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again later.',
        timestamp: Date.now(),
        conversationId: conversationId || undefined
      };
    }
  }
  
  /**
   * Generate a concise and impactful title based on the first user message
   */
  async generateTitle(
    firstMessage: string,
    model: string = 'llama'
  ): Promise<string> {
    try {
      // Définir un controller pour gérer le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes de timeout
      
      // Récupérer les clés API depuis localStorage
      const apiKeys = this.getApiKeys();
      
      const response = await fetch(`${this.apiUrl}/hypothesis/generate-title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: firstMessage,
          model: model,
          api_keys: apiKeys // Ajouter les clés API à la requête
        }),
        signal: controller.signal
      });
      
      // Nettoyer le timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error('Failed to generate title', await response.text());
        // Return a fallback title on error
        return this.createFallbackTitle(firstMessage);
      }
      
      const data = await response.json();
      // Nettoyer le titre pour supprimer "undefined" à la fin s'il est présent
      return data.title?.replace(/undefined$/g, '').replace(/undefined/g, '').trim() || '';
    } catch (error) {
      console.error('Error generating title:', error);
      
      // Return a fallback title on error
      return this.createFallbackTitle(firstMessage);
    }
  }
  
  /**
   * Create a simple fallback title from the first message
   */
  private createFallbackTitle(message: string): string {
    // Return a truncated version of the message if it's long
    return message.length > 40 ? message.substring(0, 37) + '...' : message;
  }

  /**
   * Stream hypothesis generation steps with SSE
   * @param message Le message de l'utilisateur
   * @param conversationId ID de la conversation existante
   * @param messageHistory Historique des messages
   * @param model Modèle LLM à utiliser (deepseek, etc.)
   * @param callback Fonction callback appelée à chaque événement
   * @returns Une fonction pour fermer la connexion SSE
   */
  streamHypothesis(
    message: string,
    conversationId: string | null | undefined,
    messageHistory: Message[],
    model: string = 'deepseek-reasoner',
    callback: (event: any) => void,
    onError: (error: string) => void
  ): () => void {
    // Créer un EventSource pour la connexion SSE
    // Note: les paramètres sont envoyés dans l'URL car certains navigateurs ne supportent pas
    // la configuration des EventSource avec un corps de requête
    const params = new URLSearchParams();
    params.append('message', message);
    if (conversationId) {
      params.append('conversation_id', conversationId);
    }
    params.append('model', model);
    
    // Récupérer les clés API depuis localStorage
    const apiKeys = this.getApiKeys();
    if (apiKeys.huggingface) {
      params.append('api_key_huggingface', apiKeys.huggingface);
    }
    if (apiKeys.deepseek) {
      params.append('api_key_deepseek', apiKeys.deepseek);
    }
    
    // Ajout d'un timestamp pour éviter les problèmes de cache
    params.append('_t', Date.now().toString());
    
    // Créer l'URL avec les paramètres
    const url = `${this.apiUrl}/hypothesis/stream?${params.toString()}`;
    
    console.log("Connecting to SSE:", url);
    
    // Options pour l'EventSource
    const eventSourceInitDict = { 
      withCredentials: false 
    };
    
    // Initialisation de l'EventSource avec options
    let eventSource: EventSource | null = null;
    
    try {
      eventSource = new EventSource(url, eventSourceInitDict);
      
      // Variable pour suivre les reconnexions
      let retryCount = 0;
      const MAX_RETRIES = 3; // Augmenté pour plus de fiabilité
      
      // Gestion des événements SSE
      eventSource.onmessage = (event) => {
        try {
          // Réinitialiser le compteur de reconnexions en cas de succès
          retryCount = 0;
          
          // Vérifier si c'est un message [DONE] de fin de stream
          if (event.data === "[DONE]") {
            console.log("Stream completed with [DONE] message");
            if (eventSource) {
              eventSource.close();
            }
            return;
          }
          
          // Analyse des données JSON et transmission au callback
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error("Erreur lors du parsing des données SSE:", error);
          // Ne pas appeler onError ici pour éviter de fermer la connexion 
          // sur une erreur de parsing - cela peut arriver pour des messages spéciaux
        }
      };
      
      // Gestion de l'ouverture de connexion
      eventSource.onopen = (event) => {
        console.log("SSE connection opened successfully");
        retryCount = 0; // Réinitialiser le compteur
      };
      
      // Gestion des erreurs
      eventSource.onerror = (error) => {
        console.error("Erreur de connexion SSE:", error);
        
        // Vérifier si la connexion est fermée
        if (eventSource && eventSource.readyState === EventSource.CLOSED) {
          console.log("SSE connection is closed");
          
          // Si trop de tentatives, abandonner
          if (retryCount >= MAX_RETRIES) {
            onError("Erreur de connexion au serveur après plusieurs tentatives");
            if (eventSource) {
              eventSource.close();
            }
          } else {
            console.log(`Tentative de reconnexion SSE (${retryCount + 1}/${MAX_RETRIES})...`);
            retryCount++;
            // La reconnexion est gérée automatiquement par EventSource
          }
        }
      };
    } catch (error) {
      console.error("Erreur lors de la création de l'EventSource:", error);
      onError("Erreur lors de l'initialisation de la connexion au serveur");
      if (eventSource) {
        eventSource.close();
      }
    }
    
    // Retourne une fonction pour fermer la connexion
    return () => {
      console.log("Fermeture de la connexion SSE");
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }
}

// Singleton instance
export const hypothesisService = new HypothesisService(); 