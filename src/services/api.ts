/**
 * API Service pour communiquer avec le backend
 */

// URL de base pour l'API
const API_BASE_URL = 'http://localhost:8000';

export interface ApiKeyUpdate {
  provider: string;
  key: string;
}

/**
 * Met à jour la clé API d'un outil externe (AB Tasty, etc.)
 */
export async function updateExternalToolApiKey(provider: string, key: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider, key }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${provider} API key`);
    }
  } catch (error) {
    console.error('Error updating external tool API key:', error);
    throw error;
  }
}

/**
 * Met à jour la clé API d'un modèle de langage (Hugging Face, Deepseek, etc.)
 */
export async function updateModelApiKey(provider: string, key: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider, key }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${provider} API key`);
    }
  } catch (error) {
    console.error('Error updating model API key:', error);
    throw error;
  }
}

/**
 * Récupère les tests depuis l'API AB Tasty
 */
export async function fetchABTastyTests() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/external/abtasty/tests`);
    
    if (!response.ok) {
      // Si non autorisé, probablement que la clé API n'est pas configurée
      if (response.status === 401) {
        throw new Error('AB Tasty API key not configured');
      }
      throw new Error('Failed to fetch AB Tasty tests');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching AB Tasty tests:', error);
    throw error;
  }
} 