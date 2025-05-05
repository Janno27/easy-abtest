import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.statistics import FrequentistCalculator, BayesianCalculator

client = TestClient(app)


@pytest.fixture
def frequentist_request():
    return {
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


@pytest.fixture
def bayesian_request():
    return {
        "daily_visits": 1000,
        "daily_conversions": 100,
        "traffic_allocation": 0.5,
        "expected_improvement": 0.02,
        "variations": 2,
        "confidence": 0.95,
        "statistical_method": "bayesian",
        "test_type": "two-sided",
        "prior_alpha": 0.5,
        "prior_beta": 0.5
    }


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert "docs" in response.json()
    assert "version" in response.json()


def test_estimate_endpoint_frequentist(frequentist_request):
    response = client.post("/estimate", json=frequentist_request)
    assert response.status_code == 200
    
    data = response.json()
    assert "sample_size_per_variation" in data
    assert "total_sample" in data
    assert "estimated_days" in data
    
    assert data["sample_size_per_variation"] > 0
    assert data["total_sample"] == data["sample_size_per_variation"] * frequentist_request["variations"]
    
    expected_days = data["total_sample"] / (frequentist_request["daily_visits"] * frequentist_request["traffic_allocation"])
    # Days should be rounded up
    assert data["estimated_days"] >= expected_days


def test_estimate_endpoint_bayesian(bayesian_request):
    response = client.post("/estimate", json=bayesian_request)
    assert response.status_code == 200
    
    data = response.json()
    assert "sample_size_per_variation" in data
    assert "total_sample" in data
    assert "estimated_days" in data
    
    assert data["sample_size_per_variation"] > 0
    assert data["total_sample"] == data["sample_size_per_variation"] * bayesian_request["variations"]


def test_frequentist_validation():
    # Remove power parameter which is required for frequentist
    invalid_request = {
        "daily_visits": 1000,
        "daily_conversions": 100,
        "traffic_allocation": 0.5,
        "expected_improvement": 0.02,
        "variations": 2,
        "confidence": 0.95,
        "statistical_method": "frequentist",
        "test_type": "two-sided"
    }
    
    response = client.post("/estimate", json=invalid_request)
    assert response.status_code == 422  # ValidationError


def test_bayesian_validation():
    # Remove prior parameters which are required for bayesian
    invalid_request = {
        "daily_visits": 1000,
        "daily_conversions": 100,
        "traffic_allocation": 0.5,
        "expected_improvement": 0.02,
        "variations": 2,
        "confidence": 0.95,
        "statistical_method": "bayesian",
        "test_type": "two-sided"
    }
    
    response = client.post("/estimate", json=invalid_request)
    assert response.status_code == 422  # ValidationError


def test_frequentist_calculation():
    """Test the FrequentistCalculator directly"""
    baseline_rate = 0.1  # 10% conversion rate
    mde = 0.02  # 2% absolute improvement
    alpha = 0.05  # 95% confidence
    power = 0.8  # 80% power
    test_type = "two-sided"
    
    sample_size = FrequentistCalculator.calculate_sample_size(
        baseline_rate=baseline_rate,
        mde=mde,
        alpha=alpha,
        power=power,
        test_type=test_type
    )
    
    # Sample size should be reasonable (depends on the parameters)
    assert sample_size > 0
    
    # Test one-sided vs two-sided
    sample_size_one_sided = FrequentistCalculator.calculate_sample_size(
        baseline_rate=baseline_rate,
        mde=mde,
        alpha=alpha,
        power=power,
        test_type="one-sided"
    )
    
    # One-sided tests typically require less sample
    assert sample_size_one_sided <= sample_size


def test_bayesian_simulation():
    """Test the BayesianCalculator's simulation method"""
    p_a = 0.1  # 10% conversion rate for A
    p_b = 0.12  # 12% conversion rate for B
    n = 1000  # Sample size per variation
    prior_alpha = 0.5
    prior_beta = 0.5
    simulation_count = 1000
    
    prob = BayesianCalculator._simulate_test(
        p_a=p_a,
        p_b=p_b,
        n=n,
        prior_alpha=prior_alpha,
        prior_beta=prior_beta,
        simulation_count=simulation_count
    )
    
    # Probability should be between 0 and 1
    assert 0 <= prob <= 1
    
    # With a 2% lift and 1000 samples, probability should be reasonably high
    assert prob > 0.5 