/**
 * Represents an AB Tasty test
 */
export interface ABTest {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  conversions: number;
  visits: number;
}

/**
 * API response format from AB Tasty
 */
export interface ABTastyApiResponse {
  data: ABTest[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

/**
 * Custom error types for better error handling
 */
export class ABTastyError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ABTastyError';
    this.status = status;
  }
}

export class ABTastyNetworkError extends ABTastyError {
  constructor(message: string) {
    super(message, 0);
    this.name = 'ABTastyNetworkError';
  }
}

export class ABTastyAuthError extends ABTastyError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'ABTastyAuthError';
  }
}

export class ABTastyRateLimitError extends ABTastyError {
  retryAfter?: number;
  
  constructor(message: string, retryAfter?: number) {
    super(message, 429);
    this.name = 'ABTastyRateLimitError';
    this.retryAfter = retryAfter;
  }
}