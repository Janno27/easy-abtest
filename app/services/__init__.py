"""Service package for A/B test calculations"""

from app.services.statistics import estimate_test_duration, FrequentistCalculator, BayesianCalculator

__all__ = ["estimate_test_duration", "FrequentistCalculator", "BayesianCalculator"]

# Services package
# Ce dossier contiendra les services métier pour les calculs statistiques 