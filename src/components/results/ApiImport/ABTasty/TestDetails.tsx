import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../../../ui/button';
import { ChevronLeft, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs";
import { MainDetails, HypothesisDetails, VariationDetails } from './details';
import DeepAnalysis from './details/DeepAnalysis/DeepAnalysis';

interface TestDetailsProps {
  testId: number;
  accountId: string;
  clientId: string;
  clientSecret: string;
  onBack: () => void;
}

interface TestDetail {
  id: number;
  name: string;
  type: string;
  state: string;
  creation_date: string;
  description: string | null;
  url: string;
  traffic: number;
  active: boolean;
  [key: string]: any;
}

interface TestVariation {
  id: number;
  name: string;
  traffic_allocation?: number;
  traffic?: number;
  is_reference?: boolean;
  description?: string | null;
  type?: string;
  [key: string]: any;
}

const TestDetails: React.FC<TestDetailsProps> = ({ 
  testId, 
  accountId, 
  clientId, 
  clientSecret, 
  onBack 
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [testDetails, setTestDetails] = useState<TestDetail | null>(null);
  const [variations, setVariations] = useState<TestVariation[]>([]);
  const [hypothesis, setHypothesis] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("information");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await fetchTestDetails();
        await fetchVariations();
      } catch (err) {
        console.error('Error fetching test data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [testId, accountId]);

  const fetchTestDetails = async () => {
    try {
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('account_id', accountId);

      const response = await axios.get(`http://localhost:8000/api/test-details/${testId}`, { params });
      setTestDetails(response.data);
      
      // Initialize hypothesis and context from localStorage if available
      const savedData = localStorage.getItem(`abtest_notes_${testId}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setHypothesis(parsed.hypothesis || '');
        setContext(parsed.context || '');
      }
    } catch (err: any) {
      console.error('Error fetching test details:', err);
      const errorDetail = err.response?.data?.detail || 'Failed to load test details';
      setError(errorDetail);
    }
  };

  const fetchVariations = async () => {
    try {
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('account_id', accountId);

      const response = await axios.get(`http://localhost:8000/api/test-variations/${testId}`, { params });
      
      // Extract variations from response
      let variationsData: TestVariation[] = [];
      
      // Check if we have embedded items
      if (response.data._embedded && Array.isArray(response.data._embedded.items)) {
        variationsData = response.data._embedded.items;
      } 
      // Check if we have a direct array
      else if (Array.isArray(response.data)) {
        variationsData = response.data;
      }
      // Check if we have a nested array structure (based on logs)
      else if (response.data && Array.isArray(response.data[0])) {
        variationsData = response.data[0];
      }
      
      // Process variations to ensure they have all required properties
      const processedVariations = variationsData.map((variation: any) => ({
        ...variation,
        id: variation.id || 0,
        name: variation.name || 'Unnamed',
        description: variation.description || '',
        traffic: variation.traffic || variation.traffic_allocation || 0,
        type: variation.type || 'unknown'
      }));
      
      setVariations(processedVariations);
      
      // If no variations found, create default ones based on logs
      if (processedVariations.length === 0) {
        setVariations([
          {
            id: 0,
            name: "Original",
            type: "onthefly",
            traffic: 0,
            description: ""
          },
          {
            id: 1,
            name: "Variation 1",
            type: "onthefly",
            traffic: 100,
            description: ""
          }
        ]);
      }
    } catch (err: any) {
      console.error('Error fetching test variations:', err);
      // Create default variations even on error
      setVariations([
        {
          id: 0,
          name: "Original",
          type: "onthefly",
          traffic: 0,
          description: ""
        },
        {
          id: 1,
          name: "Variation 1",
          type: "onthefly",
          traffic: 100,
          description: ""
        }
      ]);
    }
  };

  const saveNotes = () => {
    setSaving(true);
    try {
      localStorage.setItem(`abtest_notes_${testId}`, JSON.stringify({
        hypothesis,
        context,
        lastUpdated: new Date().toISOString()
      }));
      // Simulate delay to show saving indicator
      setTimeout(() => {
        setSaving(false);
      }, 500);
    } catch (err) {
      console.error('Error saving notes:', err);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <span className="ml-2 text-gray-500">Loading test details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <button 
          onClick={onBack} 
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to tests
        </button>
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!testDetails) {
    return (
      <div className="p-4">
        <button 
          onClick={onBack} 
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to tests
        </button>
        <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg">
          No test details found.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to tests
        </button>
        
        <button 
          onClick={saveNotes}
          disabled={saving}
          className="text-gray-600 hover:text-gray-900 transition-colors"
          title="Save notes"
        >
          <Save className={`h-5 w-5 ${saving ? 'opacity-50' : ''}`} />
        </button>
      </div>

      <Tabs defaultValue="information" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center">
          <TabsList className="w-[240px] mb-6">
            <TabsTrigger value="information">Information</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="information" className="space-y-8">
          <MainDetails testDetails={testDetails} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <HypothesisDetails 
              hypothesis={hypothesis}
              context={context}
              setHypothesis={setHypothesis}
              setContext={setContext}
            />
            
            <VariationDetails 
              variations={variations} 
              testDetails={testDetails} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="analysis">
          <DeepAnalysis testId={testId} accountId={accountId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestDetails; 