# A/B Test Hypothesis Assistant

This module provides an interactive chat interface that helps users formulate structured hypotheses for A/B tests following industry best practices.

## Objective

The Hypothesis Assistant helps users:
- Properly structure their A/B test hypotheses
- Follow the standard format: "If [change], then [metric] will [impact] because [mechanism], measured via [method]"
- Focus on the underlying problem and appropriate test design
- Apply industry best practices

## Architecture

### Frontend Components
- `HypothesisAssistant.tsx`: Main container component that manages conversation state
- `ChatPrompt.tsx`: Input component with animations and auto-expanding textarea
- `ChatFlow.tsx`: Component that displays the conversation with animated message bubbles
- `GradientBorderEffect.tsx`: Reusable UI component for visual effects

### Features
- Full-height container to use available screen space
- Fluid animations for message sending and receiving
- Auto-scrolling to latest messages
- Responsive design for all screen sizes
- Message timestamps
- Loading states

### Backend Integration (to be implemented)
- Integration with Hugging Face Inference API (Llama 3 8B)
- FastAPI endpoint with rate limiting (10 requests/min)
- Redis caching for common queries

## Data Structure

### Message Format
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
```

### Structured Hypothesis Format
```typescript
interface StructuredHypothesis {
  change: string;       // The change being tested
  metric: string;       // Metric being observed
  impact: string;       // Expected impact (increase/decrease/etc)
  mechanism: string;    // Reason/explanation
  method: string;       // Measurement method
}
```

## User Flow

1. User is prompted with an initial question about their problem
2. Upon submitting their first message:
   - The message animates upwards
   - The initial prompt disappears
   - The chat interface appears with the user's message
   - The AI assistant responds
3. The conversation continues with the input always positioned at the bottom
4. Messages are automatically scrolled into view
5. Eventually, the AI helps formulate a complete structured hypothesis

## To-Do
- [x] Create minimal Claude.ai-inspired design
- [x] Implement ChatPrompt component
- [x] Focus on problem framing rather than just hypothesis generation
- [x] Develop message state management
- [x] Add animated conversation display with ChatFlow
- [ ] Connect to backend API
- [ ] Add predefined hypothesis templates
- [ ] Create API endpoint for hypothesis processing
- [ ] Implement final hypothesis formatting 