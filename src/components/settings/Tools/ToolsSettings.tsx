import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { updateExternalToolApiKey } from '../../../services/api';
import { toast } from '../../ui/use-toast';

const ToolsSettings = () => {
  const [apiKeys, setApiKeys] = useState({
    abtasty: '',
    optimizely: '',
  });
  
  const [activeConnections, setActiveConnections] = useState({
    abtasty: false,
    optimizely: false,
  });

  const [configuringTool, setConfiguringTool] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Charger les clés API depuis localStorage lors du chargement initial
  useEffect(() => {
    const savedKeys = localStorage.getItem('api_keys');
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        setApiKeys(prevKeys => ({
          ...prevKeys,
          ...parsedKeys
        }));
        
        // Mettre à jour le statut des connexions
        const connections = Object.entries(parsedKeys).reduce((acc, [key, value]) => {
          return { ...acc, [key]: !!value };
        }, { ...activeConnections });
        
        setActiveConnections(connections);
      } catch (e) {
        console.error('Erreur lors du chargement des clés API:', e);
      }
    }
  }, []);

  const handleApiKeyChange = (provider: keyof typeof apiKeys, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const handleSaveApiKey = async (provider: keyof typeof apiKeys) => {
    try {
      setIsSaving(true);
      
      // Sauvegarder dans localStorage
      localStorage.setItem('api_keys', JSON.stringify(apiKeys));
      
      // Mettre à jour le statut de la connexion
      if (apiKeys[provider]) {
        setActiveConnections(prev => ({
          ...prev,
          [provider]: true
        }));
        
        // Synchroniser avec le backend
        await updateExternalToolApiKey(provider as string, apiKeys[provider]);
        
        toast({
          title: "API key saved",
          description: `The ${provider} API key has been saved successfully.`,
        });
        
        // Fermer la configuration après la sauvegarde
        setConfiguringTool(null);
      }
    } catch (error) {
      console.error(`Error updating ${provider} API key:`, error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not update ${provider} API key.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async (provider: keyof typeof apiKeys) => {
    // Supprimer la clé API
    const newApiKeys = { ...apiKeys, [provider]: '' };
    setApiKeys(newApiKeys);
    
    // Mettre à jour le statut de la connexion
    setActiveConnections(prev => ({
      ...prev,
      [provider]: false
    }));
    
    // Sauvegarder dans localStorage
    localStorage.setItem('api_keys', JSON.stringify(newApiKeys));
    
    // Synchroniser avec le backend
    try {
      await updateExternalToolApiKey(provider as string, '');
      
      toast({
        title: "Disconnected",
        description: `Successfully disconnected from ${provider}.`,
      });
    } catch (error) {
      console.error(`Error disconnecting from ${provider}:`, error);
    }
  };

  const renderTool = (
    name: string, 
    key: keyof typeof apiKeys, 
    description: string,
    isConnected: boolean,
    isDisabled = false
  ) => (
    <div className={`flex justify-between items-center py-4 border-b last:border-b-0 ${isDisabled ? 'opacity-60' : ''}`}>
      <div className="flex-1">
        <h3 className="font-medium">{name}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
        
        {configuringTool === key && !isDisabled && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKeys[key]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleApiKeyChange(key, e.target.value)
                }
                placeholder={`Enter your ${name} API key`}
                className="max-w-md"
              />
              <Button 
                onClick={() => handleSaveApiKey(key)}
                disabled={isSaving || !apiKeys[key]}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setConfiguringTool(null)}
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              You can find your API key in your {name} account settings.
            </p>
          </div>
        )}
      </div>
      
      <div>
        {isDisabled ? (
          <Button disabled variant="outline" size="sm">
            Coming Soon
          </Button>
        ) : isConnected ? (
          <Button
            variant="outline"
            onClick={() => handleDisconnect(key)}
          >
            Disconnect
          </Button>
        ) : (
          <Button 
            onClick={() => setConfiguringTool(key)}
            disabled={configuringTool === key}
          >
            Connect
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">External Tools</h2>
        <p className="text-gray-500 mt-1">Connect to your A/B testing platforms and other tools</p>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        {renderTool(
          "AB Tasty", 
          "abtasty", 
          "Import test results from AB Tasty and analyze experiments.",
          activeConnections.abtasty
        )}
        
        {renderTool(
          "Optimizely", 
          "optimizely", 
          "Connect to Optimizely to import and analyze test results.",
          activeConnections.optimizely,
          true // Désactivé pour l'instant
        )}
      </div>
      
      <div className="bg-purple-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-purple-800">Coming Soon</h3>
        <p className="text-sm text-purple-600 mt-1">
          We're working on adding support for more A/B testing tools, including VWO and Google Optimize.
        </p>
      </div>
      
      <p className="text-xs text-gray-500">
        API keys are stored securely in your browser and synchronized with the server.
      </p>
    </div>
  );
};

export default ToolsSettings; 