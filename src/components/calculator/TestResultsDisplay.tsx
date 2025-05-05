import React, { useState, useEffect } from 'react';
import { DetailedCalculationView } from './DetailedCalculationView';

interface TestResults {
  sample_size_per_variation: number;
  total_sample: number;
  estimated_days: number;
}

interface WeeklyEvolution {
  week: number;
  visitors_per_variant: number;
  mde_relative: number;
  status: string;
  target_rate?: number; // Taux de conversion cible
}

interface TestResultsDisplayProps {
  results: TestResults;
  testData?: any; // Additional data for detailed calculation
}

export const TestResultsDisplay: React.FC<TestResultsDisplayProps> = ({ results, testData }) => {
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [weeklyEvolution, setWeeklyEvolution] = useState<WeeklyEvolution[]>([]);
  const [isLoadingEvolution, setIsLoadingEvolution] = useState(false);
  
  // Load weekly evolution data
  useEffect(() => {
    if (testData && results) {
      fetchWeeklyEvolution();
    }
  }, [testData, results]);
  
  const fetchWeeklyEvolution = async () => {
    if (!testData) return;
    
    setIsLoadingEvolution(true);
    try {
      // Prepare data for API
      const requestData = {
        daily_visits: testData.dailyVisits,
        daily_conversions: testData.dailyConversions,
        traffic_allocation: testData.trafficAllocation / 100,
        expected_improvement: testData.expectedImprovement / 100,
        variations: testData.variations,
        confidence: testData.confidence / 100,
        statistical_method: testData.statisticalMethod,
        test_type: testData.statisticalMethod === 'frequentist' 
          ? (testData.test_type || 'two-sided') 
          : (testData.test_type || 'two-sided'),
        power: testData.statisticalMethod === 'frequentist' 
          ? (testData.power || 0.8) 
          : undefined,
        prior_alpha: testData.statisticalMethod === 'bayesian' 
          ? (testData.prior_alpha || 0.5) 
          : undefined,
        prior_beta: testData.statisticalMethod === 'bayesian' 
          ? (testData.prior_beta || 0.5) 
          : undefined
      };
      
      // Get API URL from environment variables
      const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8000';
      
      // API call
      const response = await fetch(`${apiUrl}/estimate/weekly-evolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Calculate baseline conversion rate
      const baselineRate = testData.conversionRate / 100;
      
      // Add target conversion rate to each week's data
      const enhancedData = data.map((week: WeeklyEvolution) => {
        // Calculate target conversion rate: baseline + relative improvement
        const targetRate = baselineRate * (1 + (testData.expectedImprovement / 100));
        return {
          ...week,
          target_rate: targetRate
        };
      });
      
      setWeeklyEvolution(enhancedData);
    } catch (error) {
      console.error("Error loading weekly evolution data:", error);
    } finally {
      setIsLoadingEvolution(false);
    }
  };
  
  // Determine CSS class for status background color
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'durée trop courte':
      case 'too short':
        return 'bg-purple-50';
      case 'durée optimale':
      case 'optimal duration':
        return 'bg-purple-100';
      case 'durée trop longue':
      case 'too long':
        return 'bg-red-50';
      default:
        return '';
    }
  };
  
  // Determine CSS class for status text
  const getStatusTextClass = (status: string) => {
    switch (status) {
      case 'durée trop courte':
      case 'too short':
        return 'text-purple-700';
      case 'durée optimale':
      case 'optimal duration':
        return 'text-purple-900';
      case 'durée trop longue':
      case 'too long':
        return 'text-red-700';
      default:
        return '';
    }
  };

  // Translate status to English
  const translateStatus = (status: string) => {
    switch (status) {
      case 'durée trop courte':
        return 'too short';
      case 'durée optimale':
        return 'optimal duration';
      case 'durée trop longue':
        return 'too long';
      default:
        return status;
    }
  };
  
  // Format conversion rate as percentage with 2 decimal places
  const formatConversionRate = (rate: number) => {
    return (rate * 100).toFixed(2) + '%';
  };
  
  return (
    <div className="test-results-container">      
      <div className="grid grid-cols-1 gap-4 items-center">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-800">{results.estimated_days} days</div>
            <p className="text-sm text-gray-600 mt-1">Test Duration</p>
          </div>
          
          <div className="hidden md:block">
            <div className="px-4 py-2 bg-gray-100 rounded-full text-gray-600 text-sm font-medium">
              AND
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center">
              <div className="text-4xl font-bold text-gray-800">{results.total_sample.toLocaleString()}</div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Total Sample Size</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center mt-2">
          <div className="h-8 border-l border-gray-300"></div>
          <div className="text-gray-400 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Sample Size per Variation</p>
            <div className="text-xl font-semibold">{results.sample_size_per_variation.toLocaleString()}</div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <button 
          className="text-xs text-gray-500 hover:text-gray-700 underline flex items-center justify-center gap-1 mx-auto"
          onClick={() => setShowDetailedView(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View detailed calculation
        </button>
      </div>
      
      <div className="mt-4">
        {isLoadingEvolution && (
          <div className="text-center py-4">
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        )}
        
        {weeklyEvolution.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full overflow-hidden divide-y divide-gray-200 text-sm border border-gray-200 rounded-md shadow-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 border-b">Duration (weeks)</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 border-b">Visitors per variant</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 border-b">MDE (relative)</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 border-b">Target CR</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {weeklyEvolution.map((week) => (
                  <tr key={week.week} className={getStatusClass(week.status)}>
                    <td className="px-4 py-3">
                      {week.week} week{week.week > 1 ? 's' : ''}{' '}
                      <span className={`text-xs ${getStatusTextClass(week.status)}`}>
                        ({translateStatus(week.status)})
                      </span>
                    </td>
                    <td className="px-4 py-3">{week.visitors_per_variant.toLocaleString()}</td>
                    <td className="px-4 py-3">{week.mde_relative}%</td>
                    <td className="px-4 py-3">{week.target_rate ? formatConversionRate(week.target_rate) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {testData && (
        <DetailedCalculationView 
          open={showDetailedView} 
          onOpenChange={setShowDetailedView} 
          testData={testData} 
          results={results} 
        />
      )}
    </div>
  );
}; 