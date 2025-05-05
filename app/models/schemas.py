from pydantic import BaseModel, root_validator
from typing import Optional, Literal


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

    @root_validator
    def validate_method_specific(cls, values):
        method = values.get("statistical_method")
        if not method:
            return values
            
        if method == "frequentist" and values.get("power") is None:
            raise ValueError("power required for frequentist method")
        if method == "bayesian" and (values.get("prior_alpha") is None or values.get("prior_beta") is None):
            raise ValueError("prior_alpha and prior_beta required for bayesian method")
        return values
    
    @root_validator
    def validate_improvement(cls, values):
        if values.get("expected_improvement") is not None and values.get("expected_improvement") > 1.0:
            raise ValueError("Expected improvement doit être en pourcentage relatif (0-100)")
        return values
    
    @root_validator
    def validate_mde_feasibility(cls, values):
        if all(key in values for key in ["daily_conversions", "daily_visits", "expected_improvement"]):
            baseline = values["daily_conversions"] / values["daily_visits"]
            mde = baseline * values["expected_improvement"] 
            if mde >= (1 - baseline):
                raise ValueError("L'amélioration attendue est trop élevée et dépasse la limite possible (>= 1)")
        return values

    class Config:
        schema_extra = {
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


class EstimateResponse(BaseModel):
    sample_size_per_variation: int
    total_sample: int
    estimated_days: int

    class Config:
        schema_extra = {
            "example": {
                "sample_size_per_variation": 3840,
                "total_sample": 7680,
                "estimated_days": 15
            }
        } 