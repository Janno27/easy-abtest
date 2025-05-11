import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

interface GenericToolConfigProps {
  name: string;
  description: string;
  isConnected: boolean;
  isDisabled?: boolean;
  onConnect: (apiKey: string) => Promise<boolean>;
  onDisconnect: () => void;
}

const GenericToolConfig: React.FC<GenericToolConfigProps> = ({ 
  name, 
  description, 
  isConnected, 
  isDisabled = false, 
  onConnect, 
  onDisconnect 
}) => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleConnect = async () => {
    if (!apiKey) return;
    
    setIsSaving(true);
    try {
      const success = await onConnect(apiKey);
      if (success) {
        setIsConfiguring(false);
        setApiKey('');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`flex justify-between items-center py-4 border-b last:border-b-0 ${isDisabled ? 'opacity-60' : ''}`}>
      <div className="flex-1">
        <div className="flex items-center">
          <h3 className="font-medium">{name}</h3>
          {isConnected && (
            <span className="ml-2 bg-green-50 text-green-700 text-xs px-2 py-1 rounded">Connected</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
        
        {isConfiguring && !isConnected && !isDisabled && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${name} API key`}
                className="max-w-md"
              />
              <Button 
                onClick={handleConnect}
                disabled={isSaving || !apiKey}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsConfiguring(false)}
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
            onClick={onDisconnect}
          >
            Disconnect
          </Button>
        ) : (
          <Button 
            onClick={() => setIsConfiguring(true)}
            disabled={isConfiguring}
          >
            Connect
          </Button>
        )}
      </div>
    </div>
  );
};

export default GenericToolConfig; 