import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Settings } from 'lucide-react';
import { Button } from '../ui/button';

export function SettingsDialog() {
  const [apiKeys, setApiKeys] = useState({
    abtasty: '',
    optimizely: '',
    dynamicyield: ''
  });

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your AB Tasty Toolkit preferences
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">API Configuration</h3>
            <div className="space-y-1">
              <label className="text-sm text-gray-500">AB Tasty API Key</label>
              <input
                type="password"
                className="w-full rounded-md border px-3 py-2"
                value={apiKeys.abtasty || '••••••••••••••••'}
                onChange={(e) => handleApiKeyChange('abtasty', e.target.value)}
                placeholder="Enter your AB Tasty API key"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Analysis Tools</h3>
            
            <div className="space-y-3">
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Optimizely</h4>
                    <p className="text-xs text-gray-500">Connect to import test results</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="text"
                      className="rounded-md border px-3 py-1 text-sm w-48"
                      placeholder="API Key"
                      value={apiKeys.optimizely}
                      onChange={(e) => handleApiKeyChange('optimizely', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Dynamic Yield</h4>
                    <p className="text-xs text-gray-500">Connect to import test results</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="text"
                      className="rounded-md border px-3 py-1 text-sm w-48"
                      placeholder="API Key"
                      value={apiKeys.dynamicyield}
                      onChange={(e) => handleApiKeyChange('dynamicyield', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Google Optimize</h4>
                    <p className="text-xs text-gray-500">Legacy support - CSV only</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-8" disabled>
                    Not Available
                  </Button>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              API keys are securely stored in your browser's local storage
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}