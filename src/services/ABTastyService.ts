import { ABTest, ABTastyApiResponse, ABTastyAuthError, ABTastyError, ABTastyNetworkError, ABTastyRateLimitError } from '../types';

/**
 * Configuration for exponential backoff retry
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
}

/**
 * AB Tasty API Service
 * Handles communication with the AB Tasty API
 */
export class ABTastyService {
  private static instance: ABTastyService;
  private apiKey: string;
  private baseUrl: string;
  private retryConfig: RetryConfig;

  private constructor() {
    this.apiKey = import.meta.env.VITE_AB_TASTY_API_KEY || '';
    this.baseUrl = '/api/abtasty'; // We'll proxy the requests through Vite
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      factor: 2
    };
  }

  public static getInstance(): ABTastyService {
    if (!ABTastyService.instance) {
      ABTastyService.instance = new ABTastyService();
    }
    return ABTastyService.instance;
  }

  private calculateDelay(retry: number, retryAfter?: number): number {
    if (retryAfter) {
      return retryAfter * 1000;
    }
    
    const delay = Math.min(
      this.retryConfig.maxDelay,
      this.retryConfig.initialDelay * Math.pow(this.retryConfig.factor, retry)
    );
    
    return delay * (0.8 + Math.random() * 0.4);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async handleResponse(response: Response): Promise<ABTastyApiResponse> {
    if (response.ok) {
      return await response.json() as ABTastyApiResponse;
    }
    
    const status = response.status;
    const text = await response.text();
    let message: string;
    
    try {
      const json = JSON.parse(text);
      message = json.message || `HTTP error ${status}`;
    } catch (e) {
      message = text || `HTTP error ${status}`;
    }
    
    if (status === 401 || status === 403) {
      throw new ABTastyAuthError(message);
    } else if (status === 429) {
      const retryAfter = response.headers.get('retry-after');
      throw new ABTastyRateLimitError(
        message,
        retryAfter ? parseInt(retryAfter, 10) : undefined
      );
    } else {
      throw new ABTastyError(message, status);
    }
  }
  
  public async getTests(propertyId: string): Promise<ABTest[]> {
    if (!this.apiKey) {
      throw new ABTastyAuthError('API key is not configured');
    }

    let lastError: Error | null = null;
    
    for (let retry = 0; retry <= this.retryConfig.maxRetries; retry++) {
      try {
        const response = await fetch(`${this.baseUrl}/tests?propertyId=${encodeURIComponent(propertyId)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json'
          }
        });
        
        const data = await this.handleResponse(response);
        return data.data;
      } catch (error) {
        lastError = error as Error;
        
        if (!(error instanceof ABTastyRateLimitError) && 
            !(error instanceof ABTastyNetworkError)) {
          throw error;
        }
        
        if (retry < this.retryConfig.maxRetries) {
          const retryAfter = error instanceof ABTastyRateLimitError ? error.retryAfter : undefined;
          const delay = this.calculateDelay(retry, retryAfter);
          await this.sleep(delay);
        } else {
          throw error;
        }
      }
    }
    
    throw lastError || new ABTastyError('Unknown error occurred', 500);
  }
}

export async function getTests(propertyId: string): Promise<ABTest[]> {
  return ABTastyService.getInstance().getTests(propertyId);
}

export default ABTastyService;