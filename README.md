# A/B Test Calculator

A modern calculator for A/B test sample size and duration estimation, with support for both Frequentist and Bayesian statistical methods.

## Features

- Calculate sample size and test duration requirements
- Support for both Frequentist and Bayesian methods
- Customizable statistical power and Bayesian priors
- One-sided and two-sided tests
- Detailed calculation step-by-step explanations
- Interactive UI with responsive design
- AI-powered hypothesis formulation assistant
- Real-time LLM reasoning visualization with animated timeline
- Multi-language support (FR/EN/ES/DE) with automatic detection

## Setup and Configuration

### Prerequisites

- Node.js 14+ 
- Backend API (see [Backend Repository](https://github.com/yourusername/ab-test-calculator-api))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ab-test-calculator.git
cd ab-test-calculator
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Environment Configuration:

Create a `.env` file in the root directory with the following content:

```
# API Configuration 
VITE_API_URL=http://localhost:8000  # Point to your backend API

# Application settings
VITE_APP_NAME="A/B Test Calculator"
VITE_APP_VERSION="1.0.0"
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

### Production Build

Build the application for production:

```bash
npm run build
# or
yarn build
```

## API Integration

This calculator frontend integrates with a FastAPI backend for calculations. The backend API expects:

- POST `/estimate` endpoint
- Request body matching `EstimateRequest` schema
- Response matching `EstimateResponse` schema

See [API Documentation](https://github.com/yourusername/ab-test-calculator-api) for details.

## Real-time LLM Reasoning Component

The application includes a `ThinkingSteps` component that visualizes the reasoning process of LLMs (Large Language Models) during hypothesis generation. This feature:

- Displays a live animated timeline of the AI's thought process
- Streams reasoning content in real-time via Server-Sent Events (SSE)
- Adapts to the user's language automatically (French, English, Spanish, German)
- Shows the detailed reasoning chain from DeepSeek Reasoner model
- Provides automatic scrolling for real-time content updates
- Includes robust error handling with user-friendly messages

### Technical implementation highlights:

1. **Frontend Component**: 
   - React-based timeline with animated dots and connectors
   - Framer Motion animations for smooth transitions
   - Automatic language detection for UI elements
   - Real-time scrolling with content updates
   - Efficient event-based streaming with EventSource API

2. **Backend Support**:
   - FastAPI SSE endpoint for streaming reasoning content
   - Multi-language support with automatic detection
   - Robust error handling and reconnection logic
   - DeepSeek API integration with streaming capabilities

3. **User Experience**:
   - Discrete styling with smaller font and subtle colors
   - Monospace font for reasoning content readability
   - Automatic scrolling for continuous updates
   - Language-aware status messages and labels

## Deployment

### Environment Variables

For production deployment, update the `.env` file with the production API URL:

```
VITE_API_URL=https://api.abtest-calculator.com
```

### Sample Docker Deployment

```bash
# Build the Docker image
docker build -t ab-test-calculator:latest .

# Run the container
docker run -p 8080:80 ab-test-calculator:latest
```

## License

MIT 