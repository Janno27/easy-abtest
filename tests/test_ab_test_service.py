import pytest
from app.models.input import TestParameters
from app.services.frequentist import FrequentistCalculator
from app.services.bayesian import BayesianCalculator
from app.services.duration import DurationCalculator


class TestFrequentistCalculator:
    """Tests unitaires pour le calculateur fréquentiste."""
    
    def test_sample_size_calculation(self):
        """Tester le calcul de taille d'échantillon fréquentiste."""
        # Arrange
        params = TestParameters(
            baseline_conversion_rate=0.1,
            minimum_detectable_effect=0.01,
            alpha=0.05,
            power=0.8,
            statistical_method="frequentist",
            test_type="two-sided",
            traffic_allocation=1.0,
            variations=2,
            daily_visitors=1000
        )
        calculator = FrequentistCalculator(params)
        
        # Act
        sample_size = calculator.calculate_sample_size()
        
        # Assert
        assert sample_size > 0
        assert isinstance(sample_size, int)
        # La taille d'échantillon devrait être proche de la valeur attendue pour ces paramètres
        # (Selon les formules statistiques standard)
        assert 15000 <= sample_size <= 17000


class TestBayesianCalculator:
    """Tests unitaires pour le calculateur bayésien."""
    
    def test_sample_size_calculation(self):
        """Tester le calcul de taille d'échantillon bayésien."""
        # Arrange
        params = TestParameters(
            baseline_conversion_rate=0.1,
            minimum_detectable_effect=0.01,
            alpha=0.05,
            power=0.8,
            statistical_method="bayesian",
            test_type="two-sided",
            traffic_allocation=1.0,
            variations=2,
            daily_visitors=1000,
            prior_alpha=0.5,
            prior_beta=0.5
        )
        calculator = BayesianCalculator(params)
        
        # Act
        sample_size = calculator.calculate_sample_size()
        
        # Assert
        assert sample_size > 0
        assert isinstance(sample_size, int)
        # La taille d'échantillon devrait être du même ordre de grandeur que l'approche fréquentiste
        assert 10000 <= sample_size <= 25000


class TestDurationCalculator:
    """Tests unitaires pour le calculateur de durée."""
    
    def test_duration_estimation_frequentist(self):
        """Tester l'estimation de durée avec méthode fréquentiste."""
        # Arrange
        params = TestParameters(
            baseline_conversion_rate=0.1,
            minimum_detectable_effect=0.01,
            alpha=0.05,
            power=0.8,
            statistical_method="frequentist",
            test_type="two-sided",
            traffic_allocation=0.5,  # 50% du trafic
            variations=2,
            daily_visitors=1000
        )
        calculator = DurationCalculator(params)
        
        # Act
        estimation = calculator.estimate()
        
        # Assert
        assert estimation.sample_size_per_variation > 0
        assert estimation.total_sample > 0
        assert estimation.estimated_days > 0
        assert estimation.total_sample == estimation.sample_size_per_variation * params.variations
        
        # Vérifier la formule de calcul de la durée
        expected_days = (estimation.total_sample / (params.daily_visitors * params.traffic_allocation))
        assert estimation.estimated_days == pytest.approx(expected_days, abs=1)  # Tenir compte de l'arrondi 