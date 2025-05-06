import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Slider } from '../ui/slider';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Button } from '../ui/button';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { TestResultsDisplay } from './TestResultsDisplay';
import { GradientBorderEffect } from '../ui/GradientBorderEffect';
import Dropdown, { DropdownOption } from '../ui/dropdown';

// Composant réutilisable pour les tooltips
const InfoTooltip = ({ content, size = "small" }: { content: React.ReactNode, size?: "small" | "large" }) => (
  <div className="relative">
    <div className="tooltip">
      <Info className="h-4 w-4 text-gray-400 cursor-help" />
      <div className={`tooltip-content tooltip-${size} right-6 ml-5 top-1/2 -translate-y-1/2 tooltip-auto-position`}>
        {content}
      </div>
    </div>
  </div>
);

// Définir l'interface pour les résultats
interface TestResults {
  sample_size_per_variation: number;
  total_sample: number;
  estimated_days: number;
}

const DurationCalculator = () => {
  const [dailyVisits, setDailyVisits] = useState('1000');
  const [dailyConversions, setDailyConversions] = useState('100');
  const [trafficAllocation, setTrafficAllocation] = useState([100]);
  const [statisticalMethod, setStatisticalMethod] = useState('frequentist');
  const [testType, setTestType] = useState('2-sided');
  const [expectedImprovement, setExpectedImprovement] = useState('1');
  const [confidence, setConfidence] = useState('95');
  const [variations, setVariations] = useState('2');
  const [customImprovementValue, setCustomImprovementValue] = useState('');
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [isVisitsOpen, setIsVisitsOpen] = useState(false);
  const [isConversionsOpen, setIsConversionsOpen] = useState(false);
  const [isVariationsOpen, setIsVariationsOpen] = useState(false);
  const [isImprovementOpen, setIsImprovementOpen] = useState(false);
  const [isConfidenceOpen, setIsConfidenceOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [statisticalPower, setStatisticalPower] = useState('80');
  const [priorAlpha, setPriorAlpha] = useState('0.5');
  const [priorBeta, setPriorBeta] = useState('0.5');
  const [isPowerOpen, setIsPowerOpen] = useState(false);
  const [calculationResults, setCalculationResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Calcul du taux de conversion
  const conversionRate = useMemo(() => {
    const visits = parseFloat(dailyVisits) || 0;
    const conversions = parseFloat(dailyConversions) || 0;
    
    if (visits === 0) return "0.00";
    
    const rate = (conversions / visits) * 100;
    return rate.toFixed(2);
  }, [dailyVisits, dailyConversions]);

  const handleImprovementChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomDialogOpen(true);
    } else {
      setExpectedImprovement(value);
    }
    setIsImprovementOpen(false);
  };

  const handleCustomImprovementSubmit = () => {
    if (customImprovementValue) {
      setExpectedImprovement(customImprovementValue);
      setIsCustomDialogOpen(false);
    }
  };

  // Fonction pour calculer les résultats du test
  const calculateDuration = async () => {
    setIsLoading(true);
    try {
      const convRate = parseFloat(conversionRate) / 100;
      
      // Préparation des données pour l'API
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

      // Récupérer l'URL de l'API depuis les variables d'environnement
      const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8000';
      
      // Appel à l'API
      const response = await fetch(`${apiUrl}/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      setCalculationResults(result);

      // Scroll vers les résultats après le chargement
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error("Error calculating test duration:", error);
      // Gérer l'erreur de manière appropriée
    } finally {
      setIsLoading(false);
    }
  };

  // Tooltips content
  const frequentistTooltipContent = (
    <div className="p-5 max-w-lg">
      <h3 className="font-bold text-base mb-3">Frequentist Method</h3>
      <p className="text-gray-600 text-xs mb-4">
        Based on hypothesis testing - calculates the probability of
        observing your test results if there truly is no difference
        between variations.
      </p>
      <div className="space-y-3 mb-3">
        <h4 className="font-semibold text-xs">Key Calculations:</h4>
        <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
          <p className="font-mono text-xs mb-1 font-medium">z-score = (p₂ - p₁) / √[variance]</p>
          <p className="text-xs text-gray-500">where variance is the combined variance of both groups</p>
        </div>
        <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
          <p className="font-mono text-xs mb-1 font-medium">sample size = (zα + zβ)² × variance / MDE²</p>
          <p className="text-xs text-gray-500">using exact variance calculation</p>
        </div>
        <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
          <p className="font-mono text-xs mb-1 font-medium">variance = pA(1-pA) + pB(1-pB)</p>
          <p className="text-xs text-gray-500">accounting for both control and treatment groups</p>
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-xs mb-2">Advantages:</h4>
        <ul className="text-xs list-disc list-inside space-y-1 text-gray-600">
          <li><span className="font-medium">Industry standard</span> approach</li>
          <li><span className="font-medium">Fixed sample size</span> calculation</li>
          <li>Well-suited for <span className="font-medium">high-traffic</span> sites</li>
        </ul>
      </div>
    </div>
  );

  const bayesianTooltipContent = (
    <div className="p-5 max-w-lg">
      <h3 className="font-bold text-base mb-3">Bayesian Method</h3>
      <p className="text-gray-600 text-xs mb-4">
        Uses probability distributions to directly calculate the
        likelihood that one variation is better than another. Updates
        continuously with new data.
      </p>
      <div className="space-y-3 mb-3">
        <h4 className="font-semibold text-xs">Key Calculations:</h4>
        <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
          <p className="font-mono text-xs mb-1 font-medium">Formule: P(B{'>'}A) = ∫ P(pᵦ | data) × [∫ P(pₐ | data) × 1(pᵦ {'>'}pₐ) dpₐ] dpᵦ</p>
        </div>
        <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
          <p className="font-mono text-xs mb-1 font-medium">Prior: Beta(α,β) - Jeffrey's prior uses α=β=0.5</p>
        </div>
        <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
          <p className="font-mono text-xs mb-1 font-medium">Monte Carlo simulation: 50,000 iterations</p>
          <p className="text-xs text-gray-500">for accurate probability calculation</p>
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-xs mb-2">Advantages:</h4>
        <ul className="text-xs list-disc list-inside space-y-1 text-gray-600">
          <li>More <span className="font-medium">intuitive probabilities</span> (direct P(B{'>'}A))</li>
          <li><span className="font-medium">Better for small sample</span> sizes</li>
          <li>Allows <span className="font-medium">early stopping</span> when confidence is reached</li>
          <li>Incorporates <span className="font-medium">prior knowledge</span></li>
        </ul>
      </div>
    </div>
  );

  const testTypeTooltipContent = (
    <div className="p-5 max-w-lg">
      <h3 className="font-bold text-base mb-3">Test Types</h3>
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-xs mb-1">2-sided Test</h4>
          <p className="text-xs text-gray-600">
            Tests whether there is <span className="font-medium">any difference</span> between variations 
            (positive or negative), without assuming the direction of change.
            More conservative and generally recommended.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-xs mb-1">1-sided Test</h4>
          <p className="text-xs text-gray-600">
            Tests only whether the variation is <span className="font-medium">better than</span> the control.
            Requires less data but should only be used when you&apos;re certain
            your change won&apos;t have a negative impact.
          </p>
        </div>
      </div>
    </div>
  );

  const variationsTooltipContent = (
    <div className="p-5 max-w-lg">
      <h3 className="font-bold text-base mb-3">Number of Variations</h3>
      <p className="text-xs text-gray-600">
        <span className="font-medium">Two variations</span> means one Control (A) and one Treatment (B).
        Adding more variations <span className="font-medium">increases the test duration</span> needed for statistical significance.
      </p>
    </div>
  );

  // Options pour les dropdowns
  const variationsOptions: DropdownOption[] = [
    { value: '2', label: '2 variations' },
    { value: '3', label: '3 variations' },
    { value: '4', label: '4 variations' },
    { value: '5', label: '5 variations' }
  ];
  
  const confidenceOptions: DropdownOption[] = [
    { value: '80', label: '80%' },
    { value: '85', label: '85%' },
    { value: '90', label: '90%' },
    { value: '95', label: '95%' },
    { value: '99', label: '99%' }
  ];

  const getCustomImprovementLabel = () => {
    if (customImprovementValue && expectedImprovement === customImprovementValue) {
      return `+${customImprovementValue}% (Custom)`;
    }
    return 'Custom value';
  };
  
  const improvementOptions: DropdownOption[] = [
    { value: '1', label: '+1%' },
    { value: '2', label: '+2%' },
    { value: '3', label: '+3%' },
    { value: '4', label: '+4%' },
    { value: '5', label: '+5%' },
    { value: '6', label: '+6%' },
    { value: '7', label: '+7%' },
    { value: '8', label: '+8%' },
    { value: customImprovementValue || 'custom', label: getCustomImprovementLabel() }
  ];

  // Fermeture des dropdowns lors des clics en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isVisitsOpen || isConversionsOpen || isVariationsOpen || isImprovementOpen || isConfidenceOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.custom-dropdown')) {
          setIsVisitsOpen(false);
          setIsConversionsOpen(false);
          setIsVariationsOpen(false);
          setIsImprovementOpen(false);
          setIsConfidenceOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisitsOpen, isConversionsOpen, isVariationsOpen, isImprovementOpen, isConfidenceOpen]);

  return (
    <div className="max-w-4xl mx-auto">
      <GradientBorderEffect 
        className="w-full"
        gradientColors={["#9333ea", "#3b82f6", "#ec4899"]}
        borderWidth={1}
        gradientOpacity={0.15}
      >
        <div className="bg-purple-50/30 rounded-2xl p-8 shadow-sm">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-medium">Daily Visits</label>
              <input
                type="text"
                value={dailyVisits}
                onChange={(e) => setDailyVisits(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Daily Conversions</label>
              <input
                type="text"
                value={dailyConversions}
                onChange={(e) => setDailyConversions(e.target.value)}
                placeholder="e.g. 100"
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div className="col-span-2 -mt-4 mb-2">
              <p className="text-sm text-gray-500">Conversion Rate: {conversionRate}%</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Traffic Allocation</label>
              <Slider
                value={trafficAllocation}
                onValueChange={setTrafficAllocation}
                max={100}
                step={1}
              />
              <p className="text-sm text-gray-500 mt-1">{trafficAllocation}% of traffic included in test</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Number of Variations</label>
                <InfoTooltip content={variationsTooltipContent} size="small" />
              </div>
              <Dropdown
                value={variations}
                onChange={setVariations}
                options={variationsOptions}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Statistical Method</h3>
              </div>
              <RadioGroup value={statisticalMethod} onValueChange={setStatisticalMethod} className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="frequentist" id="frequentist" />
                      <label htmlFor="frequentist" className="text-sm">Frequentist</label>
                      <InfoTooltip content={frequentistTooltipContent} size="large" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bayesian" id="bayesian" />
                  <label htmlFor="bayesian" className="text-sm">Bayesian</label>
                  <InfoTooltip content={bayesianTooltipContent} size="large" />
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Test Type</h3>
                <InfoTooltip content={testTypeTooltipContent} size="small" />
              </div>
              <RadioGroup value={testType} onValueChange={setTestType} className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2-sided" id="2-sided" />
                  <label htmlFor="2-sided" className="text-sm">2-sided</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1-sided" id="1-sided" />
                  <label htmlFor="1-sided" className="text-sm">1-sided</label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Expected Improvement</label>
              <Dropdown
                value={expectedImprovement}
                onChange={handleImprovementChange}
                options={improvementOptions}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statistical Confidence</label>
              <Dropdown
                value={confidence}
                onChange={setConfidence}
                options={confidenceOptions}
                className="bg-white"
              />
            </div>
            
            <div className="col-span-2">
              <div className="flex justify-between items-center pt-4 mt-2">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-gray-800 hover:text-gray-600 flex items-center gap-1"
                >
                  <span>Advanced Settings</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className={`transition-transform ${showAdvanced ? 'transform rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>
            </div>
            
            {showAdvanced && (
              <>
                <div className="col-span-2 grid grid-cols-2 gap-6">
                  {/* Statistical Power - 50% */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <label className="text-sm font-medium">Statistical Power (1-β)</label>
                        <InfoTooltip 
                          content={
                            <div className="p-3">
                              <p className="text-xs text-gray-600">
                                Probability of detecting an effect if it really exists.
                                Higher values provide more confidence but require larger sample sizes.
                              </p>
                            </div>
                          } 
                          size="small" 
                        />
                      </div>
                      <span className="text-sm font-medium">{statisticalPower}%</span>
                    </div>
                    <div className="relative pt-1">
                      <input
                        type="range"
                        min="70"
                        max="95"
                        step="5"
                        value={statisticalPower}
                        onChange={(e) => setStatisticalPower(e.target.value)}
                        disabled={statisticalMethod !== 'frequentist'}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer 
                          ${statisticalMethod === 'frequentist' 
                            ? 'bg-purple-200 accent-purple-600' 
                            : 'bg-gray-200 opacity-40'}`}
                      />
                      <div className="flex justify-between w-full px-0 pt-1">
                        <span className="text-xs text-gray-600 relative" style={{ left: '0%' }}>70%</span>
                        <span className="text-xs text-gray-600 relative" style={{ left: '-5%' }}>80%</span>
                        <span className="text-xs text-gray-600 relative" style={{ left: '-5%' }}>90%</span>
                        <span className="text-xs text-gray-600 relative" style={{ right: '0%' }}>95%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bayesian Prior Parameters - 50% */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">Bayesian Prior Parameters</span>
                        <InfoTooltip 
                          content={
                            <div className="p-3">
                              <p className="text-xs text-gray-600">
                                Beta(α₀,β₀) prior distribution. Default 0.5 is Jeffrey's non-informative prior.
                                Higher values represent stronger prior beliefs.
                              </p>
                            </div>
                          } 
                          size="small" 
                        />
                      </div>
                      <span className="text-sm">
                        <span className={`font-medium ${statisticalMethod === 'bayesian' ? 'text-purple-600' : 'text-gray-400'}`}>
                          Beta({parseFloat(priorAlpha).toFixed(1)}, {parseFloat(priorBeta).toFixed(1)})
                        </span>
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`text-xs ${statisticalMethod === 'bayesian' ? 'text-gray-700' : 'text-gray-400'}`}>
                          Failures (β₀): {parseFloat(priorBeta).toFixed(1)}
                        </div>
                        <div className={`text-xs text-right ${statisticalMethod === 'bayesian' ? 'text-gray-700' : 'text-gray-400'}`}>
                          Successes (α₀): {parseFloat(priorAlpha).toFixed(1)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-500">0.1</span>
                        <div className="flex-1 grid grid-cols-2 gap-1">
                          <Slider
                            value={[parseFloat(priorBeta)]}
                            onValueChange={(value) => setPriorBeta(value[0].toString())}
                            min={0.1}
                            max={5}
                            step={0.1}
                            disabled={statisticalMethod !== 'bayesian'}
                            className={`${statisticalMethod === 'bayesian' ? 'accent-purple-600' : 'opacity-40'}`}
                          />
                          <Slider
                            value={[parseFloat(priorAlpha)]}
                            onValueChange={(value) => setPriorAlpha(value[0].toString())}
                            min={0.1}
                            max={5}
                            step={0.1}
                            disabled={statisticalMethod !== 'bayesian'}
                            className={`${statisticalMethod === 'bayesian' ? 'accent-purple-600' : 'opacity-40'}`}
                          />
                        </div>
                        <span className="text-xs text-gray-500">5.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="col-span-2 flex justify-center mt-2">
              <Button 
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm flex items-center gap-2"
                onClick={calculateDuration}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calculating...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Calculate Duration
                  </>
                )}
              </Button>
            </div>
          </div>

          {calculationResults && (
            <div ref={resultsRef} className="mt-8 pt-8 border-t border-gray-200 transition-all duration-500 ease-in-out">
              <TestResultsDisplay 
                results={calculationResults} 
                testData={{
                  dailyVisits: parseInt(dailyVisits),
                  dailyConversions: parseInt(dailyConversions),
                  trafficAllocation: trafficAllocation[0],
                  expectedImprovement: parseFloat(expectedImprovement),
                  variations: parseInt(variations),
                  confidence: parseFloat(confidence),
                  conversionRate: parseFloat(conversionRate),
                  statisticalMethod: statisticalMethod,
                  testType: testType
                }} 
              />
            </div>
          )}
        </div>
      </GradientBorderEffect>

      {/* Custom Improvement Dialog */}
      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Custom Improvement Value</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Improvement percentage (e.g. 2.5)</label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={customImprovementValue}
                  onChange={(e) => setCustomImprovementValue(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  placeholder="Enter value"
                />
                <span className="ml-2">%</span>
              </div>
            </div>
            <Button onClick={handleCustomImprovementSubmit} className="w-full">
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>
        {`
        .tooltip {
          position: relative;
          display: inline-block;
        }
        
        .tooltip .tooltip-content {
          visibility: hidden;
          position: absolute;
          z-index: 50;
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          width: max-content;
          max-width: 16rem;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .tooltip .tooltip-large {
          max-width: 28rem;
        }
        
        .tooltip .tooltip-small {
          max-width: 20rem;
        }
        
        .tooltip:hover .tooltip-content {
          visibility: visible;
          opacity: 1;
        }

        .tooltip .tooltip-content.right-4 {
          left: auto;
          right: 4px;
        }
        
        .tooltip .tooltip-content.transform-none {
          transform: none;
        }
        
        .tooltip .tooltip-content.top-1\\/2 {
          top: 50%;
          margin-top: 0;
        }
        
        .tooltip .tooltip-content.-translate-y-1\\/2 {
          transform: translateY(-50%);
        }
        
        .tooltip .tooltip-content.ml-5 {
          margin-left: 5px;
        }
        
        @media (max-width: 768px) {
          .tooltip .tooltip-auto-position {
            right: auto;
            left: -240px;
          }
        }
        `}
      </style>
    </div>
  );
};

export default DurationCalculator;