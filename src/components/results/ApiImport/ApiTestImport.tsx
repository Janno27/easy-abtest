import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Card, CardContent } from '../../ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { ABTastyList } from './ABTasty';

type ApiProvider = 'abtasty' | 'optimizely' | 'dynamicyield';

interface ApiConfig {
  abtasty?: string;
  optimizely?: string;
  dynamicyield?: string;
}

// Interface pour une propriété AB Tasty
interface ABTastyProperty {
  name: string;
  clientId: string;
  clientSecret: string;
  accountId: string;
  numericAccountId: string;
}

const ApiTestImport = () => {
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider>('abtasty');
  const [isLoading, setIsLoading] = useState(false);
  const [apiConfig, setApiConfig] = useLocalStorage<ApiConfig>('api_keys', {});
  const [tests, setTests] = useState<any[]>([]);
  const [hasImported, setHasImported] = useState(false);

  // Check if selected API is configured
  const isApiConfigured = () => {
    if (selectedProvider === 'abtasty') {
      // Vérifier si abtastyConfig existe et contient au moins une propriété
      const configStr = localStorage.getItem('abtastyConfig');
      if (!configStr) return false;
      
      try {
        const config = JSON.parse(configStr);
        return !!(config.properties && config.properties.length > 0);
      } catch (e) {
        console.error('Failed to parse abtastyConfig', e);
        return false;
      }
    }
    return !!apiConfig[selectedProvider];
  };

  const handleImportTests = async () => {
    if (!isApiConfigured()) {
      return;
    }

    setIsLoading(true);
    // Simulation of import - in a real case, call the API
    setTimeout(() => {
      setHasImported(true);
      setIsLoading(false);
    }, 1500);
  };

  const openSettingsWithToolsTab = () => {
    // Create and dispatch custom event to open settings with tools tab
    const event = new CustomEvent('openSettings', { 
      detail: { activeTab: 'tools' } 
    });
    window.dispatchEvent(event);
  };

  // Si AB Tasty est configuré et sélectionné, afficher directement la liste des tests
  if (selectedProvider === 'abtasty' && isApiConfigured()) {
    return <ABTastyList />;
  }

  return (
    <div className="space-y-6">
      {!isApiConfigured() ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Configuration required</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You need to configure your {selectedProvider} API key in settings before importing tests.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 text-xs bg-yellow-100 hover:bg-yellow-200 border-yellow-200 text-yellow-800"
                onClick={openSettingsWithToolsTab}
              >
                Go to settings
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Select a source</h3>
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
              {isApiConfigured() && selectedProvider === 'abtasty' && (
                <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">Configured</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 border p-4 rounded-lg hover:border-purple-500 transition-colors">
              <RadioGroupItem value="optimizely" id="optimizely" />
              <label htmlFor="optimizely" className="font-medium text-sm cursor-pointer flex-1">
                Optimizely
              </label>
              {apiConfig.optimizely && (
                <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">Configured</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 border p-4 rounded-lg hover:border-purple-500 transition-colors opacity-60">
              <RadioGroupItem value="dynamicyield" id="dynamicyield" disabled />
              <label htmlFor="dynamicyield" className="font-medium text-sm cursor-pointer flex-1">
                Dynamic Yield
              </label>
              <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">Coming soon</span>
            </div>
          </RadioGroup>
        </div>
      )}

      {isApiConfigured() && selectedProvider !== 'abtasty' && (
        <Button 
          onClick={handleImportTests} 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <RefreshCw className="animate-spin mr-2 h-4 w-4" />
              Importing tests...
            </span>
          ) : (
            'Import tests'
          )}
        </Button>
      )}
      
      {/* Imported tests */}
      {hasImported && tests.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium">Imported tests</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={handleImportTests}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTestImport; 