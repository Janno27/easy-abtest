import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { updateModelApiKey } from '../../../services/api';
import { toast } from '../../ui/use-toast';

const ModelsSettings = () => {
  const [modelKeys, setModelKeys] = useState({
    huggingface: '',
    deepseek: ''
  });
  
  const [defaultModel, setDefaultModel] = useState('deepseek-reasoner');
  const [isSaving, setIsSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  
  // Charger les clés API depuis localStorage lors du chargement initial
  useEffect(() => {
    const savedKeys = localStorage.getItem('model_api_keys');
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        setModelKeys(prevKeys => ({
          ...prevKeys,
          ...parsedKeys
        }));
      } catch (e) {
        console.error('Erreur lors du chargement des clés API des modèles:', e);
      }
    }
    
    const savedDefaultModel = localStorage.getItem('default_model');
    if (savedDefaultModel) {
      setDefaultModel(savedDefaultModel);
    }
  }, []);

  const handleApiKeyChange = (provider: keyof typeof modelKeys, value: string) => {
    setModelKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const handleSaveApiKey = async (provider: keyof typeof modelKeys) => {
    try {
      setIsSaving(true);
      
      // Sauvegarder dans localStorage
      localStorage.setItem('model_api_keys', JSON.stringify(modelKeys));
      
      // Synchroniser avec le backend
      await updateModelApiKey(provider as string, modelKeys[provider]);
      
      toast({
        title: "API key saved",
        description: `The ${provider} API key has been updated successfully.`,
      });
      
      // Fermer l'édition
      setEditingKey(null);
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
  
  const handleDefaultModelChange = (value: string) => {
    setDefaultModel(value);
    localStorage.setItem('default_model', value);
    
    toast({
      title: "Default model updated",
      description: `The default model has been changed to ${value}.`,
    });
  };

  const renderApiKeySection = (
    title: string,
    provider: keyof typeof modelKeys,
    description: string
  ) => (
    <div className="py-4 border-b last:border-b-0">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        {editingKey !== provider && (
          <Button 
            variant={modelKeys[provider] ? "outline" : "default"}
            onClick={() => setEditingKey(provider)}
            size="sm"
          >
            {modelKeys[provider] ? 'Change' : 'Add Key'}
          </Button>
        )}
      </div>
      
      {editingKey === provider && (
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <Input
              type="password"
              value={modelKeys[provider]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleApiKeyChange(provider, e.target.value)
              }
              placeholder={`Enter your ${title} API Key`}
              className="max-w-md"
            />
            <Button 
              onClick={() => handleSaveApiKey(provider)}
              disabled={isSaving || !modelKeys[provider]}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setEditingKey(null)}
            >
              Cancel
            </Button>
          </div>
          {modelKeys[provider] && (
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
              <span className="text-xs text-gray-500">API Key configured</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">AI Models</h2>
        <p className="text-gray-500 mt-1">Configure AI model settings and API keys</p>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Default Model</h3>
        <div className="max-w-md">
          <Select value={defaultModel} onValueChange={handleDefaultModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="llama">Llama 3 (Hugging Face)</SelectItem>
              <SelectItem value="deepseek">Deepseek Chat</SelectItem>
              <SelectItem value="deepseek-reasoner">Deepseek Reasoner (recommended)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-2">
            This model will be used by default when generating hypotheses.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">API Keys</h3>
        <div className="bg-white rounded-lg overflow-hidden">
          {renderApiKeySection(
            "Hugging Face",
            "huggingface",
            "Required for using Llama 3 models."
          )}
          
          {renderApiKeySection(
            "Deepseek",
            "deepseek",
            "Required for using Deepseek Chat and Deepseek Reasoner models."
          )}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Available Models</h3>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium">Llama 3</h4>
            <p className="text-sm text-gray-500 mt-1">
              Meta's Llama 3 model via Hugging Face API. Good for general hypothesis generation.
            </p>
            <div className="flex items-center mt-2">
              <div className={`h-2 w-2 rounded-full mr-2 ${modelKeys.huggingface ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">
                {modelKeys.huggingface ? 'Available' : 'API Key required'}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Deepseek Models</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Includes Deepseek Chat and Deepseek Reasoner for detailed analysis.
                </p>
              </div>
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                Recommended
              </div>
            </div>
            <div className="flex items-center mt-2">
              <div className={`h-2 w-2 rounded-full mr-2 ${modelKeys.deepseek ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">
                {modelKeys.deepseek ? 'Available' : 'API Key required'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelsSettings; 