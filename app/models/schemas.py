from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, Literal, Dict, Any


class EstimateRequest(BaseModel):
    daily_visits: int
    daily_conversions: int
    traffic_allocation: float       # 0–1
    expected_improvement: float     # relatif (e.g. 0.05 pour 5%)
    variations: int
    confidence: float               # e.g. 0.95
    statistical_method: Literal["frequentist", "bayesian"]
    test_type: Literal["one-sided", "two-sided"]
    # Only for frequentist:
    power: Optional[float] = None   # e.g. 0.8–0.95
    # Only for bayesian:
    prior_alpha: Optional[float] = None
    prior_beta: Optional[float] = None

    @model_validator(mode='after')
    def validate_method_specific(self) -> 'EstimateRequest':
        method = self.statistical_method
        if not method:
            return self
            
        if method == "frequentist" and self.power is None:
            raise ValueError("power required for frequentist method")
        if method == "bayesian" and (self.prior_alpha is None or self.prior_beta is None):
            raise ValueError("prior_alpha and prior_beta required for bayesian method")
        return self
    
    @field_validator('expected_improvement')
    def validate_improvement(cls, v: float) -> float:
        if v is not None and v > 1.0:
            raise ValueError("Expected improvement doit être en pourcentage relatif (0-100)")
        return v
    
    @model_validator(mode='after')
    def validate_mde_feasibility(self) -> 'EstimateRequest':
        if all(hasattr(self, key) for key in ["daily_conversions", "daily_visits", "expected_improvement"]):
            baseline = self.daily_conversions / self.daily_visits
            mde = baseline * self.expected_improvement 
            if mde >= (1 - baseline):
                raise ValueError("L'amélioration attendue est trop élevée et dépasse la limite possible (>= 1)")
        return self

    model_config = {
        "json_schema_extra": {
            "example": {
                "daily_visits": 1000,
                "daily_conversions": 100,
                "traffic_allocation": 0.5,
                "expected_improvement": 0.05,  # 5% d'amélioration relative
                "variations": 2,
                "confidence": 0.95,
                "statistical_method": "frequentist",
                "test_type": "two-sided",
                "power": 0.8
            }
        }
    }


class EstimateResponse(BaseModel):
    sample_size_per_variation: int
    total_sample: int
    estimated_days: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "sample_size_per_variation": 3840,
                "total_sample": 7680,
                "estimated_days": 15
            }
        }
    } 