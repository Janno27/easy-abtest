import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '../ui/dialog';

interface DetailedCalculationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testData: {
    dailyVisits: number;
    dailyConversions: number;
    trafficAllocation: number;
    expectedImprovement: number;
    variations: number;
    confidence: number;
    conversionRate: number;
    statisticalMethod: string;
    test_type?: string;
    power?: number;
    prior_alpha?: number;
    prior_beta?: number;
  };
  results: {
    sample_size_per_variation: number;
    total_sample: number;
    estimated_days: number;
  };
}

export const DetailedCalculationView: React.FC<DetailedCalculationProps> = ({
  open,
  onOpenChange,
  testData,
  results
}) => {
  // Convert values for appropriate display
  const conversionRate = testData.conversionRate;
  const baselineRate = conversionRate / 100;
  const relativeImprovement = parseFloat(testData.expectedImprovement.toString()) / 100;
  const mde = baselineRate * relativeImprovement; // Conversion en différence absolue
  const targetRate = baselineRate * (1 + relativeImprovement);
  
  // Calculate traffic allocation and per variant numbers
  const dailyTestTraffic = testData.dailyVisits * (testData.trafficAllocation/100);
  const dailyTrafficPerVariant = dailyTestTraffic / testData.variations;
  
  // Calculate the variance for the frequentist method
  const p2 = baselineRate + mde;
  const variance = baselineRate * (1 - baselineRate) + p2 * (1 - p2);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detailed Calculation</DialogTitle>
          <DialogClose />
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Daily Visits</h3>
            <p className="text-lg">{testData.dailyVisits}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Daily Conversions</h3>
            <p className="text-lg">{testData.dailyConversions}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Baseline Conversion Rate</h3>
            <p className="text-lg">{(baselineRate * 100).toFixed(2)}%</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Target Conversion Rate</h3>
            <p className="text-lg">{(targetRate * 100).toFixed(2)}%</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Traffic Allocation</h3>
            <p className="text-lg">{testData.trafficAllocation}%</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Number of Variations</h3>
            <p className="text-lg">{testData.variations}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Expected Improvement</h3>
            <p className="text-lg">+{testData.expectedImprovement}%</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Statistical Confidence</h3>
            <p className="text-lg">{testData.confidence}%</p>
          </div>
          
          {testData.statisticalMethod === 'frequentist' && testData.power && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Statistical Power</h3>
              <p className="text-lg">{testData.power * 100}%</p>
            </div>
          )}
          
          {testData.statisticalMethod === 'bayesian' && testData.prior_alpha && testData.prior_beta && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Bayesian Prior</h3>
              <p className="text-lg">Beta({testData.prior_alpha}, {testData.prior_beta})</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-bold mb-4">{testData.statisticalMethod === 'bayesian' ? 'Bayesian' : 'Frequentist'} Calculation</h2>
          
          {testData.statisticalMethod === 'bayesian' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 1: Calculate baseline conversion rate</h3>
                <p className="text-sm text-gray-600">
                  p = conversions / visits = {testData.dailyConversions} / {testData.dailyVisits} = {baselineRate.toFixed(4)} ({(baselineRate * 100).toFixed(2)}%)
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 2: Define target conversion rate</h3>
                <p className="text-sm text-gray-600">
                  Target CR = baseline × (1 + relative improvement) = {baselineRate.toFixed(4)} × (1 + {relativeImprovement.toFixed(4)}) = {targetRate.toFixed(6)} ({(targetRate * 100).toFixed(2)}%)
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 3: Define prior distribution</h3>
                <p className="text-sm text-gray-600">
                  Using Beta({testData.prior_alpha || 0.5}, {testData.prior_beta || 0.5}) prior
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 4: Calculate minimum detectable effect (MDE)</h3>
                <p className="text-sm text-gray-600">
                  Relative improvement = {(relativeImprovement * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">
                  MDE = {baselineRate.toFixed(4)} × {relativeImprovement.toFixed(4)} = {mde.toFixed(6)} (absolute difference)
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 5: Simulate posterior distributions</h3>
                <p className="text-sm text-gray-600">
                  Using Monte Carlo simulation (50,000 iterations) to determine the sample size required to achieve {testData.confidence}% probability that the treatment is better than control.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 6: Calculate required sample size</h3>
                <p className="text-sm text-gray-600">
                  Estimated sample size: {results.sample_size_per_variation.toLocaleString()} per variation ({results.total_sample.toLocaleString()} total)
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 7: Calculate required days</h3>
                <p className="text-sm text-gray-600">
                  Daily total test traffic = visits × traffic allocation = {testData.dailyVisits} × {testData.trafficAllocation/100} = {dailyTestTraffic}
                </p>
                <p className="text-sm text-gray-600">
                  Daily traffic per variation = {dailyTrafficPerVariant.toFixed(0)}
                </p>
                <p className="text-sm text-gray-600">
                  Required days = total sample / daily test traffic = {results.total_sample.toLocaleString()} / {dailyTestTraffic} = {results.estimated_days} days
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 1: Calculate baseline conversion rate</h3>
                <p className="text-sm text-gray-600">
                  p = conversions / visits = {testData.dailyConversions} / {testData.dailyVisits} = {baselineRate.toFixed(4)} ({(baselineRate * 100).toFixed(2)}%)
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 2: Define target conversion rate</h3>
                <p className="text-sm text-gray-600">
                  Target CR = baseline × (1 + relative improvement) = {baselineRate.toFixed(4)} × (1 + {relativeImprovement.toFixed(4)}) = {targetRate.toFixed(6)} ({(targetRate * 100).toFixed(2)}%)
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 3: Calculate z-scores for significance level and power</h3>
                <p className="text-sm text-gray-600">
                  α = {(1 - testData.confidence/100).toFixed(2)} (for {testData.confidence}% confidence)
                </p>
                <p className="text-sm text-gray-600">
                  z<sub>α</sub> = {testData.confidence === 95 ? '1.96' : testData.confidence === 99 ? '2.58' : testData.confidence === 90 ? '1.64' : '1.96'} ({testData.test_type || "two-sided"})
                </p>
                <p className="text-sm text-gray-600">
                  z<sub>β</sub> = {testData.power ? (testData.power === 0.8 ? '0.84' : testData.power === 0.9 ? '1.28' : '0.84') : '0.84'} (for {testData.power ? testData.power * 100 : 80}% power)
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 4: Calculate minimum detectable effect (MDE)</h3>
                <p className="text-sm text-gray-600">
                  Relative improvement = {(relativeImprovement * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">
                  MDE = {baselineRate.toFixed(4)} × {relativeImprovement.toFixed(4)} = {mde.toFixed(6)} (absolute difference)
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 5: Calculate variances for both groups</h3>
                <p className="text-sm text-gray-600">
                  Control Group Variance = p<sub>A</sub>(1-p<sub>A</sub>) = {baselineRate.toFixed(4)} × (1-{baselineRate.toFixed(4)}) = {(baselineRate * (1-baselineRate)).toFixed(6)}
                </p>
                <p className="text-sm text-gray-600">
                  Treatment Group Variance = p<sub>B</sub>(1-p<sub>B</sub>) = {p2.toFixed(6)} × (1-{p2.toFixed(6)}) = {(p2 * (1-p2)).toFixed(6)}
                </p>
                <p className="text-sm text-gray-600">
                  Combined Variance = {variance.toFixed(6)}
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 6: Calculate sample size using exact formula</h3>
                <p className="text-sm text-gray-600 mt-2">
                  n = (z<sub>α</sub> + z<sub>β</sub>)<sup>2</sup> × variance / (MDE)<sup>2</sup>
                </p>
                <p className="text-sm text-gray-600">
                  n = ({testData.confidence === 95 ? '1.96' : testData.confidence === 99 ? '2.58' : testData.confidence === 90 ? '1.64' : '1.96'} + {testData.power ? (testData.power === 0.8 ? '0.84' : testData.power === 0.9 ? '1.28' : '0.84') : '0.84'})<sup>2</sup> × {variance.toFixed(6)} / ({mde.toFixed(6)})<sup>2</sup>
                </p>
                <p className="text-sm text-gray-600">
                  n = {results.sample_size_per_variation.toLocaleString()} per variation
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 7: Calculate total sample size</h3>
                <p className="text-sm text-gray-600">
                  Total sample = sample size per variation × number of variations = {results.sample_size_per_variation.toLocaleString()} × {testData.variations} = {results.total_sample.toLocaleString()}
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Step 8: Calculate required days</h3>
                <p className="text-sm text-gray-600">
                  Daily total test traffic = visits × traffic allocation = {testData.dailyVisits} × {testData.trafficAllocation/100} = {dailyTestTraffic}
                </p>
                <p className="text-sm text-gray-600">
                  Daily traffic per variation = {dailyTrafficPerVariant.toFixed(0)}
                </p>
                <p className="text-sm text-gray-600">
                  Required days = total sample / daily test traffic = {results.total_sample.toLocaleString()} / {dailyTestTraffic} = {results.estimated_days} days
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-right">
          <button 
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 