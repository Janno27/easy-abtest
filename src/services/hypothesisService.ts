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
      
      const response = await fetch(`${this.apiUrl}/hypothesis/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
          message_history: this.formatMessagesForApi(messageHistory),
          model: model
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
      
      const response = await fetch(`${this.apiUrl}/hypothesis/generate-title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: firstMessage,
          model: model
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
}

// Singleton instance
export const hypothesisService = new HypothesisService(); 