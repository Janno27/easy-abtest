export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  conversationId?: string;
}

export interface StructuredHypothesis {
  change: string;       // The change being tested
  metric: string;       // Metric being observed
  impact: string;       // Expected impact (increase/decrease/etc)
  mechanism: string;    // Reason/explanation
  method: string;       // Measurement method
}

export interface HypothesisState {
  messages: Message[];
  isLoading: boolean;
  conversationId: string | null;
  currentHypothesis: StructuredHypothesis | null;
} 