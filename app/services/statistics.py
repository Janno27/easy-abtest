import math
import numpy as np
import scipy.stats as stats
from loguru import logger
from typing import Dict, Any, Tuple


class FrequentistCalculator:
    """
    Implements frequentist hypothesis testing for proportion differences
    """
    
    @staticmethod
    def calculate_sample_size(
        baseline_rate: float,
        mde: float,
        alpha: float,
        power: float,
        test_type: str
    ) -> int:
        """
        Calculate the sample size per variation required for a frequentist A/B test
        
        Args:
            baseline_rate: The baseline conversion rate (e.g., 0.1 for 10%)
            mde: Minimum Detectable Effect as absolute difference (e.g., 0.02 for 2%)
            alpha: Significance level (1 - confidence level, e.g., 0.05 for 95% confidence)
            power: Statistical power (e.g., 0.8 for 80% power)
            test_type: Either "one-sided" or "two-sided"
            
        Returns:
            int: The required sample size per variation
        """
        # Adjust z-alpha based on test type
        if test_type == "one-sided":
            z_alpha = stats.norm.ppf(1 - alpha)
        else:  # two-sided
            z_alpha = stats.norm.ppf(1 - alpha / 2)
            
        z_beta = stats.norm.ppf(power)
        
        # Utiliser la méthode exacte avec les variances individuelles des proportions
        p2 = baseline_rate + mde
        variance = baseline_rate * (1 - baseline_rate) + p2 * (1 - p2)
        n = (z_alpha + z_beta)**2 * variance / (mde**2)
        
        # Round up to the nearest integer
        return math.ceil(n)


class BayesianCalculator:
    """
    Implements Bayesian hypothesis testing for proportion differences
    """
    
    @staticmethod
    def calculate_sample_size(
        baseline_rate: float,
        mde: float,
        confidence: float,
        prior_alpha: float,
        prior_beta: float,
        test_type: str,
        simulation_count: int = 50000  # Augmente la précision de la simulation Monte Carlo
    ) -> int:
        """
        Calculate the sample size per variation required for a Bayesian A/B test
        
        Args:
            baseline_rate: The baseline conversion rate (e.g., 0.1 for 10%)
            mde: Minimum Detectable Effect as absolute difference (e.g., 0.02 for 2%)
            confidence: Required probability of B>A (e.g., 0.95 for 95% confidence)
            prior_alpha: Alpha parameter for Beta prior (successes)
            prior_beta: Beta parameter for Beta prior (failures)
            test_type: Either "one-sided" or "two-sided"
            simulation_count: Number of Monte Carlo simulations
            
        Returns:
            int: The required sample size per variation
        """
        # Initialize search
        min_n = 10
        max_n = 1000000
        current_n = min_n
        
        # Calculer le taux de conversion attendu pour le variant B (mde est une différence absolue)
        expected_cr = baseline_rate + mde
        
        # Binary search to find the minimum sample size that meets our confidence requirement
        while min_n <= max_n:
            mid_n = (min_n + max_n) // 2
            
            # Calculate the probability of B>A with this sample size
            prob_b_better = BayesianCalculator._simulate_test(
                baseline_rate, 
                expected_cr,
                mid_n, 
                prior_alpha, 
                prior_beta,
                simulation_count
            )
            
            if test_type == "two-sided":
                # For two-sided, we want to be confident that there is a difference (in either direction)
                # So we check if the probability is high enough or low enough
                prob_difference = max(prob_b_better, 1 - prob_b_better)
                is_confident = prob_difference >= confidence
            else:  # one-sided
                # For one-sided, we only care if B>A
                is_confident = prob_b_better >= confidence
            
            if is_confident:
                # We found a viable sample size, try a smaller one
                current_n = mid_n
                max_n = mid_n - 1
            else:
                # Not enough confidence, try a larger sample size
                min_n = mid_n + 1
        
        return current_n
    
    @staticmethod
    def _simulate_test(
        p_a: float, 
        p_b: float, 
        n: int, 
        prior_alpha: float, 
        prior_beta: float,
        simulation_count: int
    ) -> float:
        """
        Simulate a Bayesian A/B test and return the probability that B is better than A
        
        Args:
            p_a: The true conversion rate of variation A
            p_b: The true conversion rate of variation B
            n: The sample size per variation
            prior_alpha: Alpha parameter for Beta prior
            prior_beta: Beta parameter for Beta prior
            simulation_count: Number of Monte Carlo simulations
            
        Returns:
            float: The probability that B is better than A
        """
        # Simulate conversions based on true rates
        conversions_a = np.random.binomial(n, p_a, simulation_count)
        conversions_b = np.random.binomial(n, p_b, simulation_count)
        
        # Calculate posterior parameters
        post_alpha_a = prior_alpha + conversions_a
        post_beta_a = prior_beta + (n - conversions_a)
        post_alpha_b = prior_alpha + conversions_b
        post_beta_b = prior_beta + (n - conversions_b)
        
        # Sample from posterior distributions
        samples_a = np.random.beta(post_alpha_a, post_beta_a)
        samples_b = np.random.beta(post_alpha_b, post_beta_b)
        
        # Calculate probability that B > A
        return np.mean(samples_b > samples_a)


async def estimate_test_duration(params: Dict[Any, Any]) -> Dict[str, int]:
    """
    Calculate the required sample size and test duration based on input parameters
    
    Args:
        params: Dictionary with test parameters:
            daily_visits: Number of daily visitors
            daily_conversions: Number of daily conversions
            traffic_allocation: Portion of traffic to include in test (0-1)
            expected_improvement: Expected absolute improvement (e.g., 0.02 for 2%)
            variations: Number of variations (including control)
            confidence: Confidence level (e.g., 0.95 for 95%)
            statistical_method: "frequentist" or "bayesian"
            test_type: "one-sided" or "two-sided"
            power: (frequentist only) Statistical power (e.g., 0.8)
            prior_alpha: (bayesian only) Alpha parameter for Beta prior
            prior_beta: (bayesian only) Beta parameter for Beta prior
            
    Returns:
        Dictionary with sample_size_per_variation, total_sample, and estimated_days
    """
    # Extract parameters
    daily_visits = params["daily_visits"]
    daily_conversions = params["daily_conversions"]
    traffic_allocation = params["traffic_allocation"]
    expected_improvement = params["expected_improvement"]
    variations = params["variations"]
    confidence = params["confidence"]
    statistical_method = params["statistical_method"]
    test_type = params["test_type"]
    
    # Calculate baseline conversion rate
    baseline_rate = daily_conversions / daily_visits
    
    # Convert expected_improvement (relative) to absolute MDE
    # expected_improvement est exprimé en valeur relative (e.g., 0.05 pour 5%)
    mde_absolute = baseline_rate * expected_improvement
    
    # Log input parameters
    logger.info(f"Calculating test duration with method: {statistical_method}")
    logger.info(f"Baseline rate: {baseline_rate:.4f}, Expected relative improvement: {expected_improvement:.4f}")
    logger.info(f"Absolute MDE: {mde_absolute:.6f}")
    
    # Calculate sample size per variation based on method
    if statistical_method == "frequentist":
        power = params["power"]
        alpha = 1 - confidence
        sample_size_per_variation = FrequentistCalculator.calculate_sample_size(
            baseline_rate=baseline_rate,
            mde=mde_absolute,
            alpha=alpha,
            power=power,
            test_type=test_type
        )
    else:  # bayesian
        prior_alpha = params["prior_alpha"]
        prior_beta = params["prior_beta"]
        sample_size_per_variation = BayesianCalculator.calculate_sample_size(
            baseline_rate=baseline_rate,
            mde=mde_absolute,
            confidence=confidence,
            prior_alpha=prior_alpha,
            prior_beta=prior_beta,
            test_type=test_type
        )
    
    # Calculate total sample size
    total_sample = sample_size_per_variation * variations
    
    # Calculate estimated duration in days
    daily_test_traffic = daily_visits * traffic_allocation
    daily_traffic_per_variant = daily_test_traffic / variations
    estimated_days = math.ceil(total_sample / daily_test_traffic)
    
    # Log traffic and timing details
    logger.info(f"Daily test traffic: {daily_test_traffic}, Per variant: {daily_traffic_per_variant}")
    logger.info(f"Estimated days: {estimated_days} for {total_sample} total sample")
    
    # Return results
    return {
        "sample_size_per_variation": sample_size_per_variation,
        "total_sample": total_sample,
        "estimated_days": estimated_days
    } 