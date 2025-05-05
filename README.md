# A/B Test Calculator

A modern calculator for A/B test sample size and duration estimation, with support for both Frequentist and Bayesian statistical methods.

## Features

- Calculate sample size and test duration requirements
- Support for both Frequentist and Bayesian methods
- Customizable statistical power and Bayesian priors
- One-sided and two-sided tests
- Detailed calculation step-by-step explanations
- Interactive UI with responsive design

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