# A/B Test Calculator API

A FastAPI service that calculates sample sizes and estimated durations for A/B tests, designed to work with the front-end A/B Test Calculator.

## Features

- Calculate required sample sizes for both Frequentist and Bayesian A/B tests
- Support for one-sided and two-sided tests
- Customizable statistical parameters (confidence, power, prior distributions)
- Async API for high performance
- Production-ready structure with logging, dependency injection, and comprehensive tests

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ab-test-calculator-api.git
cd ab-test-calculator-api
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Running the API

Start the API server:

```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

API documentation will be available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### API Endpoints

#### POST /estimate

Calculate the required sample size and test duration for an A/B test.

**Example Request:**

```python
import requests

url = "http://localhost:8000/estimate"
payload = {
    "daily_visits": 1000,
    "daily_conversions": 100,
    "traffic_allocation": 0.5,
    "expected_improvement": 0.02,
    "variations": 2,
    "confidence": 0.95,
    "statistical_method": "frequentist",
    "test_type": "two-sided",
    "power": 0.8
}
response = requests.post(url, json=payload)
print(response.json())
```

**Example Response:**

```json
{
  "sample_size_per_variation": 3840,
  "total_sample": 7680,
  "estimated_days": 15
}
```

### Integration with Front-End

The API is designed to work seamlessly with the front-end A/B Test Calculator. Here's an example of how to call the API from the front-end:

```typescript
// Example of how to call the API from React
const calculateDuration = async () => {
  try {
    const requestData = {
      daily_visits: parseInt(dailyVisits),
      daily_conversions: parseInt(dailyConversions),
      traffic_allocation: trafficAllocation[0] / 100,
      expected_improvement: parseFloat(expectedImprovement) / 100,
      variations: parseInt(variations),
      confidence: parseFloat(confidence) / 100,
      statistical_method: statisticalMethod === 'frequentist' ? 'frequentist' : 'bayesian',
      test_type: testType === '1-sided' ? 'one-sided' : 'two-sided',
      power: statisticalMethod === 'frequentist' ? parseFloat(statisticalPower) / 100 : undefined,
      prior_alpha: statisticalMethod === 'bayesian' ? parseFloat(priorAlpha) : undefined,
      prior_beta: statisticalMethod === 'bayesian' ? parseFloat(priorBeta) : undefined
    };

    const response = await fetch('http://localhost:8000/estimate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();
    setCalculationResults(result);
  } catch (error) {
    console.error('Error calculating duration:', error);
  }
};
```

## Testing

Run the test suite:

```bash
pytest
```

## License

MIT 