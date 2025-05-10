import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

const AccountSettings = () => {
  const [userData, setUserData] = useState({
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    company: 'AB Test Experts',
    role: 'Analyst'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({...userData});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    setUserData({...formData});
    setIsEditing(false);
    // Dans le futur, envoyer les données à Supabase ici
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Account Settings</h2>
        <p className="text-gray-500 mt-1">Manage your account information</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                  />
                ) : (
                  <p className="text-sm py-2">{userData.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                {isEditing ? (
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="text-sm py-2">{userData.email}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                {isEditing ? (
                  <Input 
                    id="company" 
                    name="company" 
                    value={formData.company} 
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="text-sm py-2">{userData.company}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                {isEditing ? (
                  <Input 
                    id="role" 
                    name="role" 
                    value={formData.role} 
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="text-sm py-2">{userData.role}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              {isEditing ? (
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => {
                    setFormData({...userData});
                    setIsEditing(false);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Information</Button>
              )}
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Subscription</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between">
                <div>
                  <h4 className="font-medium">Pro Plan</h4>
                  <p className="text-gray-500 text-sm mt-1">
                    Access to all features, including advanced analytics and unlimited tests
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs font-medium">Active</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Renews on: May 15, 2023</span>
              <Button variant="outline" size="sm">Manage Subscription</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings; 