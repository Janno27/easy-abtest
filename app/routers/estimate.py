from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from typing import Dict, Any, List
from app.models.schemas import EstimateRequest, EstimateResponse
from app.services.statistics import estimate_test_duration
from app.core.config import settings
import math
from scipy import stats

router = APIRouter()


@router.post(
    "/estimate",
    response_model=EstimateResponse,
    summary="Calculate A/B test sample size and duration",
    description="Calculate required sample size and test duration based on provided parameters",
)
async def calculate_estimate(
    request: EstimateRequest,
) -> Dict[str, Any]:
    """
    Calculate the required sample size and test duration for an A/B test.
    
    - **daily_visits**: Number of daily visitors/pageviews
    - **daily_conversions**: Number of daily conversions/goals
    - **traffic_allocation**: Portion of traffic to include in test (0-1)
    - **expected_improvement**: Expected absolute improvement (e.g., 0.01 for 1%)
    - **variations**: Number of variations (including control)
    - **confidence**: Confidence level (e.g., 0.95 for 95%)
    - **statistical_method**: Either "frequentist" or "bayesian"
    - **test_type**: Either "one-sided" or "two-sided"
    - **power**: (frequentist only) Statistical power (e.g., 0.8)
    - **prior_alpha**: (bayesian only) Alpha parameter for Beta prior
    - **prior_beta**: (bayesian only) Beta parameter for Beta prior
    
    Returns:
    - **sample_size_per_variation**: Required sample size per variation
    - **total_sample**: Total required sample size across all variations
    - **estimated_days**: Estimated test duration in days
    """
    try:
        # Log the request
        logger.info(f"Received estimation request: statistical_method={request.statistical_method}")

        # Convert pydantic model to dict
        params = request.dict()
        
        # Calculate estimate
        result = await estimate_test_duration(params)
        
        # Log the result
        logger.info(f"Estimate result: {result}")
        
        return result
    except Exception as e:
        logger.error(f"Error calculating estimate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating estimate: {str(e)}")


@router.post(
    "/estimate/weekly-evolution",
    summary="Calculate weekly evolution of sample size and MDE",
    description="Calculate how MDE evolves over weekly periods based on sample size accumulation",
)
async def calculate_weekly_evolution(
    request: EstimateRequest,
) -> List[Dict[str, Any]]:
    """
    Calculate how the minimum detectable effect (MDE) changes over weekly periods.
    
    Parameters are the same as the /estimate endpoint.
    
    Returns a list of weekly data points with:
    - **week**: Week number
    - **visitors_per_variant**: Cumulative visitors per variant by this week
    - **mde_relative**: Minimum detectable effect (relative) that can be detected by this week
    - **status**: Classification as "too short", "optimal", or "too long"
    - **target_cr**: Target conversion rate (baseline + relative improvement)
    """
    try:
        # Log the request
        logger.info(f"Received weekly evolution request: statistical_method={request.statistical_method}")

        # Convert pydantic model to dict
        params = request.dict()
        
        # Calculate baseline conversion rate
        baseline_rate = params["daily_conversions"] / params["daily_visits"]
        
        # Calculate target conversion rate (baseline + relative improvement)
        target_cr = baseline_rate * (1 + params["expected_improvement"])
        
        # Calculate daily visitors per variant
        daily_visitors_per_variant = (params["daily_visits"] * params["traffic_allocation"]) / params["variations"]
        
        # Get the base sample size requirement
        result = await estimate_test_duration(params)
        sample_size_per_variation = result["sample_size_per_variation"]
        
        # Calculate estimated days and convert to weeks
        total_days = result["estimated_days"]
        estimated_weeks = math.ceil(total_days / 7)
        
        # Generate weekly evolution data
        weekly_evolution = []
        
        # Calculate for 8 weeks or twice the estimated duration, whichever is greater
        max_weeks = max(8, estimated_weeks * 2)
        
        for week in range(1, max_weeks + 1):
            # Calculate visitors per variant accumulated by this week
            days = week * 7
            visitors_per_variant = math.floor(daily_visitors_per_variant * days)
            
            # Calculate the relative MDE that can be detected with this sample size
            # This is based on the inverse of the sample size formula
            if params["statistical_method"] == "frequentist":
                power = params["power"]
                alpha = 1 - params["confidence"]
                
                # Adjust z-alpha based on test type
                if params["test_type"] == "one-sided":
                    z_alpha = _stats_z_score(1 - alpha)
                else:  # two-sided
                    z_alpha = _stats_z_score(1 - alpha / 2)
                    
                z_beta = _stats_z_score(power)
                
                # Calculate MDE as percentage of baseline rate
                if visitors_per_variant > 0:
                    p2 = baseline_rate
                    variance = baseline_rate * (1 - baseline_rate) + p2 * (1 - p2)
                    mde_absolute = math.sqrt((variance * (z_alpha + z_beta)**2) / visitors_per_variant)
                    mde_relative = (mde_absolute / baseline_rate) * 100
                else:
                    mde_relative = float('inf')
            else:  # bayesian
                # Simplified Bayesian estimate
                if visitors_per_variant > 0:
                    # This is a simplification for the relative MDE
                    confidence_factor = 3 if params["confidence"] >= 0.95 else 2  # Higher confidence needs larger effect
                    mde_relative = (confidence_factor * math.sqrt(baseline_rate * (1 - baseline_rate) / visitors_per_variant) / baseline_rate) * 100
                else:
                    mde_relative = float('inf')
            
            # Determine status
            status = "durée optimale"
            if week < estimated_weeks / 2:
                status = "durée trop courte"
            elif week > estimated_weeks * 1.2:
                status = "durée trop longue"
            
            weekly_evolution.append({
                "week": week,
                "visitors_per_variant": visitors_per_variant,
                "mde_relative": round(mde_relative, 1),
                "status": status,
                "target_cr": target_cr
            })
        
        # Log and return result
        logger.info(f"Generated weekly evolution data with {len(weekly_evolution)} weeks")
        return weekly_evolution
    except Exception as e:
        logger.error(f"Error calculating weekly evolution: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating weekly evolution: {str(e)}")


def _stats_z_score(p: float) -> float:
    """
    Calculate z-score from probability.
    This is a simplified version of the function in the statistics service.
    """
    # Simple handling of extreme values
    if p <= 0 or p >= 1:
        return -6 if p < 0.5 else 6
    
    # Use scipy's more accurate implementation
    return stats.norm.ppf(p) 