import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { toast } from '../../ui/use-toast';

interface VWOToolConfigProps {
  isConnected: boolean;
  onConnect: (credentials: VWOCredentials) => Promise<boolean>;
  onDisconnect: () => void;
}

export interface VWOCredentials {
  apiKey: string;
  accountId: string;
  projectId: string;
}

const VWOToolConfig: React.FC<VWOToolConfigProps> = ({ 
  isConnected, 
  onConnect, 
  onDisconnect 
}) => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [credentials, setCredentials] = useState<VWOCredentials>({
    apiKey: '',
    accountId: '',
    projectId: ''
  });

  const handleInputChange = (field: keyof VWOCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConnect = async () => {
    if (!credentials.apiKey || !credentials.accountId || !credentials.projectId) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "All fields are required"
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const success = await onConnect(credentials);
      if (success) {
        setIsConfiguring(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex justify-between items-center py-4 border-b last:border-b-0 opacity-60">
      <div className="flex-1">
        <div className="flex items-center">
          <h3 className="font-medium">VWO</h3>
          {isConnected && (
            <span className="ml-2 bg-green-50 text-green-700 text-xs px-2 py-1 rounded">Connected</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Import and analyze test results from Visual Website Optimizer.
        </p>
        
        {isConfiguring && !isConnected && (
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <label htmlFor="apiKey" className="block text-xs font-medium text-gray-700">
                API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                value={credentials.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                placeholder="Enter your VWO API Key"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="accountId" className="block text-xs font-medium text-gray-700">
                Account ID
              </label>
              <Input
                id="accountId"
                value={credentials.accountId}
                onChange={(e) => handleInputChange('accountId', e.target.value)}
                placeholder="Enter your VWO Account ID"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="projectId" className="block text-xs font-medium text-gray-700">
                Project ID
              </label>
              <Input
                id="projectId"
                value={credentials.projectId}
                onChange={(e) => handleInputChange('projectId', e.target.value)}
                placeholder="Enter your VWO Project ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can find your Project ID in the VWO dashboard settings.
              </p>
            </div>
            
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfiguring(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isSaving}
              >
                {isSaving ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div>
        <Button disabled variant="outline" size="sm">
          Coming Soon
        </Button>
      </div>
    </div>
  );
};

export default VWOToolConfig; 