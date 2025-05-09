export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  conversationId?: string;
  structuredData?: {
    tables?: Array<{
      id: string;
      headers: string[];
      rows: Record<string, string>[];
      alignments?: string[];
    }>;
    buttons?: Array<{
      type: string;
      text: string;
      action: string;
    }>;
    charts?: any[];
    interactive_elements?: any[];
  };
  lang_confidence?: number;
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

export interface HypothesisApiResponse {
  message: string;
  conversation_id: string;
  timestamp: number;
  structured_data?: any;
  lang_confidence?: number;
}

export interface ThinkingEvent {
  step: string;
  status: 'processing' | 'completed' | 'error';
  details?: string;
  reasoning_content?: string;
} 