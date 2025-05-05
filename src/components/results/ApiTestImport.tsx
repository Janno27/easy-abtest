import React, { useState } from 'react';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

type ApiProvider = 'abtasty' | 'optimizely' | 'dynamicyield';

const ApiTestImport = () => {
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider>('abtasty');
  const [isLoading, setIsLoading] = useState(false);

  const handleImportTests = async () => {
    setIsLoading(true);
    // This function will be implemented later to communicate with APIs
    // Loading simulation
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Select a Source</h3>
        <RadioGroup 
          value={selectedProvider} 
          onValueChange={(value) => setSelectedProvider(value as ApiProvider)}
          className="gap-4"
        >
          <div className="flex items-center space-x-2 border p-4 rounded-lg hover:border-purple-500 transition-colors">
            <RadioGroupItem value="abtasty" id="abtasty" />
            <label htmlFor="abtasty" className="font-medium text-sm cursor-pointer flex-1">
              AB Tasty
            </label>
            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">Recommended</span>
          </div>
          
          <div className="flex items-center space-x-2 border p-4 rounded-lg hover:border-purple-500 transition-colors">
            <RadioGroupItem value="optimizely" id="optimizely" />
            <label htmlFor="optimizely" className="font-medium text-sm cursor-pointer flex-1">
              Optimizely
            </label>
          </div>
          
          <div className="flex items-center space-x-2 border p-4 rounded-lg hover:border-purple-500 transition-colors">
            <RadioGroupItem value="dynamicyield" id="dynamicyield" />
            <label htmlFor="dynamicyield" className="font-medium text-sm cursor-pointer flex-1">
              Dynamic Yield
            </label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">API Configuration</h3>
          <p className="text-sm text-gray-500">
            Configure your API key in settings to access your tests
          </p>
        </div>
        
        <Button 
          onClick={handleImportTests} 
          className="w-full bg-gray-600 hover:bg-gray-700 text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Importing...' : 'Import Tests'}
        </Button>
        
        <p className="text-xs text-gray-500">
          Note: Full API implementation will be available in future versions
        </p>
      </div>
    </div>
  );
};

export default ApiTestImport; 