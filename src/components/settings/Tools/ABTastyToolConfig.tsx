import React, { useState, useEffect } from 'react'; 
import { Button } from '../../ui/button'; 
import { Input } from '../../ui/input'; 
import { toast } from '../../ui/use-toast'; 
import { Label } from "../../ui/label";
import { encryptSecret } from "./encryption";
import axios from 'axios';
import { X, Plus, Edit, Trash2 } from 'lucide-react';

// Structure pour une propriété AB Tasty
interface ABTastyProperty {
  name: string;
  clientId: string;
  clientSecret: string;
  accountId: string;  // Tag ID (hexadécimal 32 caractères)
  numericAccountId: string; // Account ID (5-6 digits)
}

// Structure correcte des credentials AB Tasty
export interface ABTastyCredentials {
  properties: ABTastyProperty[];
}

interface ABTastyToolConfigProps {
  isConnected: boolean;
  onConnect: (credentials: ABTastyCredentials) => Promise<boolean>;
  onDisconnect: () => void;
}

// Fonction utilitaire pour afficher de manière sécurisée le début du client ID
const displayClientId = (clientId: string | undefined): string => {
  if (!clientId) return "N/A";
  return clientId.length > 10 ? `${clientId.substring(0, 10)}...` : clientId;
};

const ABTastyToolConfig: React.FC<ABTastyToolConfigProps> = ({
  isConnected,
  onConnect,
  onDisconnect
}) => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [editingPropertyIndex, setEditingPropertyIndex] = useState<number | null>(null);
  const [verifyingProperty, setVerifyingProperty] = useState<number | null>(null);
  
  const [newProperty, setNewProperty] = useState<ABTastyProperty>({
    name: '',
    clientId: '',
    clientSecret: '',
    accountId: '',
    numericAccountId: ''
  });
  
  const [credentials, setCredentials] = useState<ABTastyCredentials>({
    properties: []
  });

  // Chargement des credentials depuis localStorage au montage
  useEffect(() => {
    const savedConfig = localStorage.getItem('abtastyConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        
        // Conversion de l'ancien format vers le nouveau si nécessaire
        let properties: ABTastyProperty[] = config.properties || [];
        
        setCredentials({
          ...config,
          properties
        });
      } catch (e) {
        console.error('Failed to parse saved credentials', e);
      }
    }
  }, []);

  const verifyProperty = async (property: ABTastyProperty, index?: number): Promise<boolean> => {
    try {
      if (index !== undefined) {
        setVerifyingProperty(index);
      }
      
      console.log("Vérification des credentials avec:", {
        client_id: property.clientId,
        client_secret: property.clientSecret
      });
      
      const response = await axios.post('http://localhost:8000/api/verify', {
        client_id: property.clientId,
        client_secret: property.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Réponse de vérification:", response.data);
      
      if (index !== undefined) {
        setVerifyingProperty(null);
      }
      
      return response.data.valid;
    } catch (error) {
      console.error("Verification error:", error);
      
      if (index !== undefined) {
        setVerifyingProperty(null);
      }
      
      return false;
    }
  };

  const validateProperty = (property: ABTastyProperty): boolean => {
    // Validation du nom
    if (!property.name.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Property Name",
        description: "Property name cannot be empty."
      });
      return false;
    }
    
    // Validation du clientId
    if (!property.clientId.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Client ID",
        description: "Client ID cannot be empty."
      });
      return false;
    }
    
    // Validation du clientSecret
    if (!property.clientSecret.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Client Secret",
        description: "Client Secret cannot be empty."
      });
      return false;
    }
    
    // Validation de l'accountId (doit être 32 caractères hexadécimaux)
    if (!/^[a-f0-9]{32}$/.test(property.accountId)) {
      toast({
        variant: "destructive",
        title: "Invalid Account Identifier",
        description: "Account Identifier (Tag ID) must be a 32-character hexadecimal string."
      });
      return false;
    }
    
    // Validation du numericAccountId (5-6 chiffres)
    if (!/^\d{5,6}$/.test(property.numericAccountId)) {
      toast({
        variant: "destructive",
        title: "Invalid Account ID",
        description: "Account ID must be a 5-6 digit number."
      });
      return false;
    }
    
    return true;
  };

  const handleAddProperty = async () => {
    if (!validateProperty(newProperty)) {
      return;
    }
    
    // Vérification des doublons
    const isDuplicate = credentials.properties.some(
      p => p.name === newProperty.name || 
          (p.accountId === newProperty.accountId && p.numericAccountId === newProperty.numericAccountId)
    );
    
    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: "Duplicate Property",
        description: "A property with this name or these identifiers already exists."
      });
      return;
    }
    
    // Vérification des credentials avec l'API
    setIsSaving(true);
    const isValid = await verifyProperty(newProperty);
    
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Invalid Credentials",
        description: "Failed to verify credentials. Please check your Client ID and Client Secret."
      });
      setIsSaving(false);
      return;
    }
    
    // Ajout de la nouvelle propriété
    setCredentials({
      ...credentials,
      properties: [...credentials.properties, { ...newProperty }]
    });
    
    // Réinitialisation du formulaire
    setNewProperty({
      name: '',
      clientId: '',
      clientSecret: '',
      accountId: '',
      numericAccountId: ''
    });
    
    setIsAddingProperty(false);
    setIsSaving(false);
    
    toast({
      title: "Property Added",
      description: "The property has been successfully added."
    });
  };

  const handleUpdateProperty = async () => {
    if (editingPropertyIndex === null) return;
    
    if (!validateProperty(newProperty)) {
      return;
    }
    
    // Vérification des doublons (sauf avec la propriété en cours d'édition)
    const isDuplicate = credentials.properties.some(
      (p, index) => index !== editingPropertyIndex && 
        (p.name === newProperty.name || 
        (p.accountId === newProperty.accountId && p.numericAccountId === newProperty.numericAccountId))
    );
    
    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: "Duplicate Property",
        description: "A property with this name or these identifiers already exists."
      });
      return;
    }
    
    // Vérification des credentials avec l'API si les credentials ont changé
    const currentProperty = credentials.properties[editingPropertyIndex];
    if (currentProperty.clientId !== newProperty.clientId || currentProperty.clientSecret !== newProperty.clientSecret) {
      setIsSaving(true);
      const isValid = await verifyProperty(newProperty);
      
      if (!isValid) {
        toast({
          variant: "destructive",
          title: "Invalid Credentials",
          description: "Failed to verify credentials. Please check your Client ID and Client Secret."
        });
        setIsSaving(false);
        return;
      }
    }
    
    // Mise à jour de la propriété
    const updatedProperties = [...credentials.properties];
    updatedProperties[editingPropertyIndex] = { ...newProperty };
    
    setCredentials({
      ...credentials,
      properties: updatedProperties
    });
    
    // Réinitialisation du formulaire
    setNewProperty({
      name: '',
      clientId: '',
      clientSecret: '',
      accountId: '',
      numericAccountId: ''
    });
    
    setEditingPropertyIndex(null);
    setIsSaving(false);
    
    toast({
      title: "Property Updated",
      description: "The property has been successfully updated."
    });
  };

  const handleEditProperty = (index: number) => {
    setNewProperty({ ...credentials.properties[index] });
    setEditingPropertyIndex(index);
  };

  const handleDeleteProperty = (index: number) => {
    const updatedProperties = credentials.properties.filter((_, i) => i !== index);
    setCredentials({
      ...credentials,
      properties: updatedProperties
    });
    
    toast({
      title: "Property Deleted",
      description: "The property has been removed."
    });
  };

  const handleVerifyProperty = async (index: number) => {
    const property = credentials.properties[index];
    const isValid = await verifyProperty(property, index);
    
    if (isValid) {
      toast({
        title: "Verification Successful",
        description: "The credentials for this property are valid."
      });
    } else {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "The credentials for this property are invalid."
      });
    }
  };

  const handleConnect = async () => {
    // Vérification qu'au moins une propriété est configurée
    if (credentials.properties.length === 0) {
      toast({
        variant: "destructive",
        title: "No Properties Configured",
        description: "Please add at least one property before connecting."
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Stockage uniquement des propriétés dans localStorage
      localStorage.setItem('abtastyConfig', JSON.stringify({
        properties: credentials.properties
      }));

      const success = await onConnect(credentials);
      if (success) {
        setIsConfiguring(false);
        toast({
          title: "Connected to AB Tasty",
          description: "Your credentials have been saved"
        });
      }
    } catch (error: unknown) {
      console.error("AB Tasty connection error:", error);
      
      // Afficher un message d'erreur plus informatif
      let errorMessage = "Failed to connect to AB Tasty";
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // La requête a été faite et le serveur a répondu avec un code d'état
          // qui n'est pas dans la plage 2xx
          errorMessage = `Server error: ${error.response.status} - ${error.response.data?.detail || "Unknown error"}`;
        } else if (error.request) {
          // La requête a été faite mais aucune réponse n'a été reçue
          errorMessage = "No response from server. Please check your network connection.";
        } else {
          // Une erreur s'est produite lors de la configuration de la requête
          errorMessage = error.message || "Request configuration error";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: errorMessage
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    // Vérification qu'au moins une propriété est configurée
    if (credentials.properties.length === 0) {
      toast({
        variant: "destructive",
        title: "No Properties Configured",
        description: "Please add at least one property."
      });
      return;
    }

    setIsSaving(true);
    try {
      // Stockage uniquement des propriétés dans localStorage
      localStorage.setItem('abtastyConfig', JSON.stringify({
        properties: credentials.properties
      }));
      
      setIsConfiguring(false);
      toast({
        title: "Changes saved",
        description: "Your AB Tasty properties have been updated."
      });
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Failed to save your changes. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderPropertyForm = () => (
    <div className="space-y-4 border p-4 rounded-md bg-gray-50">
      <h4 className="font-medium">
        {editingPropertyIndex !== null ? "Edit Property" : "Add New Property"}
      </h4>
      
      <div className="space-y-2">
        <Label htmlFor="propertyName">Property Name</Label>
        <Input 
          id="propertyName"
          value={newProperty.name} 
          onChange={e => setNewProperty({...newProperty, name: e.target.value})}
          placeholder="Enter a name for this property"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="propertyClientId">Client ID</Label>
        <Input 
          id="propertyClientId"
          value={newProperty.clientId} 
          onChange={e => setNewProperty({...newProperty, clientId: e.target.value})}
          placeholder="Enter your AB Tasty Client ID"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="propertyClientSecret">Client Secret</Label>
        <Input 
          id="propertyClientSecret"
          type="password"
          value={newProperty.clientSecret} 
          onChange={e => setNewProperty({...newProperty, clientSecret: e.target.value})}
          placeholder="Enter your AB Tasty Client Secret"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="propertyAccountId">Account Identifier (Tag ID)</Label>
        <Input 
          id="propertyAccountId"
          value={newProperty.accountId} 
          onChange={e => setNewProperty({...newProperty, accountId: e.target.value})}
          placeholder="32-character hexadecimal identifier"
        />
        <p className="text-xs text-gray-500">Unique 32-character hexadecimal identifier for your AB Tasty tag</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="propertyNumericAccountId">Account ID (5-6 digits)</Label>
        <Input 
          id="propertyNumericAccountId"
          value={newProperty.numericAccountId} 
          onChange={e => setNewProperty({...newProperty, numericAccountId: e.target.value})}
          placeholder="Enter your AB Tasty Account ID (5-6 digits)"
        />
        <p className="text-xs text-gray-500">Numeric account ID used for Core API access (5-6 digits)</p>
      </div>
      
      <div className="flex space-x-2 pt-2">
        <Button 
          onClick={editingPropertyIndex !== null ? handleUpdateProperty : handleAddProperty}
          disabled={isSaving}
        >
          {isSaving ? (editingPropertyIndex !== null ? "Updating..." : "Adding...") : (editingPropertyIndex !== null ? "Update" : "Add")}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            setIsAddingProperty(false);
            setEditingPropertyIndex(null);
            setNewProperty({
              name: '',
              clientId: '',
              clientSecret: '',
              accountId: '',
              numericAccountId: ''
            });
          }}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

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
      {isConfiguring ? (
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Properties</Label>
              {!isAddingProperty && editingPropertyIndex === null && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsAddingProperty(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Property
                </Button>
              )}
            </div>
            
            {/* Liste des propriétés existantes */}
            {!isAddingProperty && editingPropertyIndex === null && (
              <div className="space-y-2">
                {credentials.properties.length === 0 ? (
                  <div className="text-sm text-gray-500 italic">
                    No properties configured. Add at least one property.
                  </div>
                ) : (
                  credentials.properties.map((property, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                      <div className="space-y-1">
                        <div className="font-medium">{property.name}</div>
                        <div className="text-xs text-gray-500">
                          Client ID: {displayClientId(property.clientId)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Tag ID: {property.accountId}
                        </div>
                        <div className="text-xs text-gray-500">
                          Account ID: {property.numericAccountId}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleVerifyProperty(index)}
                          className="h-8 p-1 text-blue-500 hover:text-blue-700"
                          disabled={verifyingProperty === index}
                        >
                          {verifyingProperty === index ? "Verifying..." : "Verify"}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditProperty(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteProperty(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {/* Formulaire d'ajout/édition de propriété */}
            {(isAddingProperty || editingPropertyIndex !== null) && renderPropertyForm()}
          </div>
          
          <div className="flex space-x-2 pt-4">
            {!isConnected ? (
              <Button onClick={handleConnect} disabled={isSaving}>
                {isSaving ? 'Connecting...' : 'Connect'}
              </Button>
            ) : (
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsConfiguring(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : !isConnected && (
        <Button onClick={() => setIsConfiguring(true)}>
          Connect
        </Button>
      )}
      
      {isConnected && !isConfiguring && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Properties</Label>
              <Button variant="ghost" size="sm" onClick={() => setIsConfiguring(true)}>
                Edit
              </Button>
            </div>
            <div className="space-y-2">
              {credentials.properties.map((property, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded border">
                  <div className="font-medium">{property.name}</div>
                  <div className="text-xs text-gray-500">
                    Client ID: {displayClientId(property.clientId)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Tag ID: {property.accountId}
                  </div>
                  <div className="text-xs text-gray-500">
                    Account ID: {property.numericAccountId}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <p className="text-sm">
            Your AB Tasty connection is active. You can now import test results from your AB Tasty account.
          </p>
          <Button variant="outline" onClick={onDisconnect}>
            Disconnect
          </Button>
        </div>
      )}
    </div>
  );
};

export default ABTastyToolConfig;
