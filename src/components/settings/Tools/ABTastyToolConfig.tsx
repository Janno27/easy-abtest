import React, { useState, useEffect } from 'react'; 
import { Button } from '../../ui/button'; 
import { Input } from '../../ui/input'; 
import { toast } from '../../ui/use-toast'; 
import { Label } from "../../ui/label";
import { encryptSecret } from "./encryption";

// Structure correcte des credentials AB Tasty
export interface ABTastyCredentials {
  clientId: string;
  clientSecret: string;
  accountId: string;  // Tag ID (hexadécimal 32 caractères)
  numericAccountId?: string; // Account ID (5-6 digits) - optionnel
}

interface ABTastyToolConfigProps {
  isConnected: boolean;
  onConnect: (credentials: ABTastyCredentials) => Promise<boolean>;
  onDisconnect: () => void;
}

const ABTastyToolConfig: React.FC<ABTastyToolConfigProps> = ({
  isConnected,
  onConnect,
  onDisconnect
}) => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [credentials, setCredentials] = useState<ABTastyCredentials>({
    clientId: '',
    clientSecret: '',
    accountId: '',
    numericAccountId: ''
  });

  // Chargement des credentials depuis localStorage au montage
  useEffect(() => {
    const savedCredentials = localStorage.getItem('abtastyConfig');
    if (savedCredentials) {
      try {
        setCredentials(JSON.parse(savedCredentials));
      } catch (e) {
        console.error('Failed to parse saved credentials', e);
      }
    }
  }, []);

  const handleConnect = async () => {
    // Validation de l'accountId (doit être 32 caractères hexadécimaux)
    if (!/^[a-f0-9]{32}$/.test(credentials.accountId)) {
      toast({
        variant: "destructive",
        title: "Invalid Account Identifier",
        description: "Account Identifier (Tag ID) must be a 32-character hexadecimal string."
      });
      return;
    }

    setIsSaving(true);
    try {
      // Stockage dans localStorage AVANT l'appel API
      localStorage.setItem('abtastyConfig', JSON.stringify(credentials));
      
      const success = await onConnect(credentials);
      if (success) {
        setIsConfiguring(false);
        toast({
          title: "Connected to AB Tasty",
          description: "Your credentials have been saved"
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: e.message || "Failed to connect to AB Tasty"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">AB Tasty</h3>
        {isConnected && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Connected
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-500">
        Connect to your AB Tasty account to import test results.
      </p>

      {/* Formulaire de connexion */}
      {isConfiguring && !isConnected && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input 
              id="clientId"
              value={credentials.clientId} 
              onChange={e => setCredentials({...credentials, clientId: e.target.value})}
              placeholder="Enter your AB Tasty Client ID"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientSecret">Client Secret</Label>
            <Input 
              id="clientSecret"
              type="password"
              value={credentials.clientSecret} 
              onChange={e => setCredentials({...credentials, clientSecret: e.target.value})}
              placeholder="Enter your AB Tasty Client Secret"
            />
            <p className="text-xs text-gray-500">Leave blank to keep your current secret</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountId">Account Identifier (Tag ID)</Label>
            <Input 
              id="accountId"
              value={credentials.accountId} 
              onChange={e => setCredentials({...credentials, accountId: e.target.value})}
              placeholder="32-character hexadecimal identifier"
            />
            <p className="text-xs text-gray-500">Unique 32-character hexadecimal identifier for your AB Tasty tag</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numericAccountId">Account ID (5-6 digits)</Label>
            <Input 
              id="numericAccountId"
              value={credentials.numericAccountId || ''} 
              onChange={e => setCredentials({...credentials, numericAccountId: e.target.value})}
              placeholder="Enter your AB Tasty Account ID (5-6 digits)"
            />
            <p className="text-xs text-gray-500">Numeric account ID used for Core API access (5-6 digits)</p>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button onClick={handleConnect} disabled={isSaving}>
              {isSaving ? 'Connecting...' : 'Connect'}
            </Button>
            <Button variant="outline" onClick={() => setIsConfiguring(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {isConnected ? (
        <div className="space-y-4">
          <p className="text-sm">
            Your AB Tasty connection is active. You can now import test results from your AB Tasty account.
          </p>
          <Button variant="outline" onClick={onDisconnect}>
            Disconnect
          </Button>
        </div>
      ) : (
        <Button onClick={() => setIsConfiguring(true)} disabled={isConfiguring}>
          Connect
        </Button>
      )}
    </div>
  );
};

export default ABTastyToolConfig;
