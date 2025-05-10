import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Settings } from 'lucide-react';
import { Button } from '../ui/button';
import AccountSettings from './Account/AccountSettings';
import ToolsSettings from './Tools/ToolsSettings';
import ModelsSettings from './Models/ModelsSettings';

type SettingsTab = 'account' | 'tools' | 'models';

export function SettingsDialog() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isOpen, setIsOpen] = useState(false);

  // Listen for custom event to open settings with specific tab
  useEffect(() => {
    const handleOpenSettings = (e: CustomEvent) => {
      const requestedTab = e.detail?.activeTab;
      if (requestedTab && ['account', 'tools', 'models'].includes(requestedTab)) {
        setActiveTab(requestedTab as SettingsTab);
      }
      setIsOpen(true);
    };

    window.addEventListener('openSettings', handleOpenSettings as EventListener);
    
    return () => {
      window.removeEventListener('openSettings', handleOpenSettings as EventListener);
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] p-0 gap-0 overflow-hidden">
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="text-xl">Settings</DialogTitle>
            </DialogHeader>
            <nav className="p-4 space-y-1">
              <SidebarItem 
                label="Account" 
                isActive={activeTab === 'account'} 
                onClick={() => setActiveTab('account')}
              />
              <SidebarItem 
                label="External Tools" 
                isActive={activeTab === 'tools'} 
                onClick={() => setActiveTab('tools')}
              />
              <SidebarItem 
                label="AI Models" 
                isActive={activeTab === 'models'} 
                onClick={() => setActiveTab('models')}
              />
            </nav>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'account' && <AccountSettings />}
              {activeTab === 'tools' && <ToolsSettings />}
              {activeTab === 'models' && <ModelsSettings />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type SidebarItemProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

const SidebarItem: React.FC<SidebarItemProps> = ({ label, isActive, onClick }) => (
  <button
    className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-purple-100 text-purple-700' 
        : 'text-gray-700 hover:bg-gray-100'
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);