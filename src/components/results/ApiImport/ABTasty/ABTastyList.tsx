// ABTastyList.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '../../../ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../ui/select';
import Table from '../../../ui/Table';
import { RefreshCw } from 'lucide-react';
import TestDetails from './TestDetails';

interface ABTest {
  id: number;
  name: string;
  state: string;
  creation_date: string;
  type?: string;
}

// Définir le type pour les lignes du tableau qui peuvent contenir des JSX.Element
interface TableRow {
  [key: string]: string | React.ReactNode;
}

// Structure pour une propriété AB Tasty
interface ABTastyProperty {
  name: string;
  clientId: string;
  clientSecret: string;
  accountId: string;  // Tag ID (hexadécimal 32 caractères)
  numericAccountId: string; // Account ID (5-6 digits)
}

const activeOptions = [
  { value: '1', label: 'Actif' },
  { value: '0', label: 'En pause' }
];

// Fonction pour générer une couleur de statut
const getStatusChipClass = (state: string) => {
  switch (state.toLowerCase()) {
    case 'running':
    case 'active':
    case 'play':
      return 'bg-green-100 text-green-800';
    case 'paused':
    case 'stopped':
      return 'bg-yellow-100 text-yellow-800';
    case 'draft':
      return 'bg-blue-100 text-blue-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const ABTastyList: React.FC = () => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<number | null>(null);

  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState<number>(0);
  const [properties, setProperties] = useState<ABTastyProperty[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('1');

  // Load properties from localStorage
  useEffect(() => {
    const configStr = localStorage.getItem('abtastyConfig');
    if (!configStr) {
      setError('La configuration AB Tasty est introuvable.');
      return;
    }
    
    try {
      const config = JSON.parse(configStr);
      
      // Récupérer les propriétés
      const propertiesList: ABTastyProperty[] = config.properties || [];
      
      if (propertiesList.length === 0) {
        setError('Aucune propriété AB Tasty configurée.');
        return;
      }
      
      setProperties(propertiesList);
    } catch (e) {
      setError('Échec de l\'analyse de la configuration AB Tasty.');
    }
  }, []);

  const fetchTests = async () => {
    if (properties.length === 0) {
      setError('Aucune propriété AB Tasty configurée.');
      return;
    }
    
    const selectedProperty = properties[selectedPropertyIndex];
    if (!selectedProperty) {
      setError('Propriété sélectionnée introuvable.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Construction des paramètres pour le backend
      const params = new URLSearchParams();
      params.append('client_id', selectedProperty.clientId);
      params.append('client_secret', selectedProperty.clientSecret);
      params.append('account_id', selectedProperty.numericAccountId);
      params.append('status', activeFilter);
      params.append('page', '1');
      params.append('per_page', '50');
      
      const response = await axios.get('http://localhost:8000/api/tests', { params });

      const items: ABTest[] = response.data._embedded?.items || [];
      setTests(items);
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || 'Échec du chargement des tests';
      setError(errorDetail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (properties.length > 0) {
      fetchTests();
    }
  }, [selectedPropertyIndex, activeFilter, properties]);

  const handleRowClick = (id: string) => {
    setSelectedTest(parseInt(id));
  };

  const handleBackToList = () => {
    setSelectedTest(null);
  };

  const headers = ['ID', 'Nom', 'Type', 'État', 'Créé le'];
  const rows: TableRow[] = tests.map(test => ({
    ID: test.id.toString(),
    Nom: test.name,
    Type: test.type || 'Inconnu',
    État: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusChipClass(test.state)}`}>
        {test.state}
      </span>
    ),
    'Créé le': new Date(test.creation_date).toLocaleDateString()
  }));

  // Si un test est sélectionné, afficher les détails
  if (selectedTest !== null) {
    const selectedProperty = properties[selectedPropertyIndex];
    return (
      <TestDetails 
        testId={selectedTest} 
        accountId={selectedProperty.numericAccountId}
        clientId={selectedProperty.clientId}
        clientSecret={selectedProperty.clientSecret}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-4">
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <Select
              value={activeFilter}
              onValueChange={(value) => setActiveFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {activeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-end space-x-4">
          <div className="w-60">
            <label className="block text-sm font-medium text-gray-700 mb-1">Propriété</label>
            <Select
              value={selectedPropertyIndex.toString()}
              onValueChange={(value) => setSelectedPropertyIndex(parseInt(value))}
              disabled={properties.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={properties.length === 0 ? "Aucune propriété" : "Sélectionner une propriété"} />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchTests}
            disabled={loading || properties.length === 0}
            className="mb-0.5"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Chargement...' : 'Actualiser'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!error && tests.length === 0 && !loading ? (
        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
          Aucun test trouvé. Essayez de modifier les filtres ou de sélectionner une autre propriété.
        </div>
      ) : (
        !error && !loading && (
          <div className="overflow-x-auto">
            <Table 
              headers={headers}
              rows={rows}
              onRowClick={handleRowClick}
            />
          </div>
        )
      )}
    </div>
  );
};

export default ABTastyList; 