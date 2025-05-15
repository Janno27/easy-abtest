import React from 'react';
import { format, parseISO, formatDistanceStrict } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MainDetailsProps {
  testDetails: {
    id: number;
    name: string;
    type: string;
    state: string;
    status?: string;
    creation_date?: string;
    created_at?: string;
    last_play?: string;
    last_pause?: string;
    description: string | null;
    url: string;
    traffic?: number;
    dynamic_alloc_traffic?: number;
    allocation?: {
      dynamic_alloc_traffic?: number;
    };
    labels?: any[];
    [key: string]: any;
  };
}

// Function to safely render values as strings
const safeRender = (value: any): string => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  // Handle date objects with readable_date, timestamp, pattern
  if (typeof value === 'object' && value !== null) {
    if ('readable_date' in value) {
      return value.readable_date || 'N/A';
    }
    if ('timestamp' in value && typeof value.timestamp === 'number') {
      try {
        return new Date(value.timestamp * 1000).toLocaleDateString();
      } catch (e) {
        return 'Invalid date';
      }
    }
    return JSON.stringify(value);
  }
  
  return String(value);
};

const MainDetails: React.FC<MainDetailsProps> = ({ testDetails }) => {
  // Fonction améliorée pour formater les dates de façon plus lisible
  const formatReadableDate = (dateString: string | object | null | undefined): string => {
    if (!dateString) return 'N/A';
    
    // Si c'est un objet avec readable_date
    if (typeof dateString === 'object' && dateString !== null) {
      if ('readable_date' in dateString) {
        return (dateString as any).readable_date || 'N/A';
      }
      if ('timestamp' in dateString && typeof (dateString as any).timestamp === 'number') {
        try {
          const date = new Date((dateString as any).timestamp * 1000);
          return format(date, 'dd MMM yyyy', { locale: fr });
        } catch (e) {
          return 'Date invalide';
        }
      }
      return JSON.stringify(dateString);
    }
    
    try {
      // Traiter les chaînes au format ISO
      if (typeof dateString === 'string') {
        if (dateString.includes('T')) {
          const date = parseISO(dateString);
          return format(date, 'dd MMM yyyy', { locale: fr });
        }
        // Autres formats de date
        const date = new Date(String(dateString));
        return format(date, 'dd MMM yyyy', { locale: fr });
      }
      return String(dateString);
    } catch (e) {
      return String(dateString);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'play':
      case 'running':
      case 'active':
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

  // Format test type for display
  const getFormattedType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ab':
        return 'A/B Test';
      case 'split_url':
        return 'Split URL';
      case 'multivariate':
      case 'mvt':
        return 'MVT';
      case 'server_side':
        return 'Server Side';
      default:
        return type;
    }
  };

  // Calculate duration between last_play and last_pause
  const calculateDuration = () => {
    if (!testDetails.last_play || !testDetails.last_pause) return 'N/A';
    
    try {
      let playDate, pauseDate;
      
      if (typeof testDetails.last_play === 'object' && testDetails.last_play !== null && 
          'timestamp' in (testDetails.last_play as Record<string, any>)) {
        playDate = new Date((testDetails.last_play as Record<string, number>).timestamp * 1000);
      } else if (typeof testDetails.last_play === 'string') {
        playDate = parseISO(testDetails.last_play);
      } else {
        return 'N/A';
      }
      
      if (typeof testDetails.last_pause === 'object' && testDetails.last_pause !== null && 
          'timestamp' in (testDetails.last_pause as Record<string, any>)) {
        pauseDate = new Date((testDetails.last_pause as Record<string, number>).timestamp * 1000);
      } else if (typeof testDetails.last_pause === 'string') {
        pauseDate = parseISO(testDetails.last_pause);
      } else {
        return 'N/A';
      }
      
      return formatDistanceStrict(playDate, pauseDate);
    } catch (e) {
      return 'N/A';
    }
  };

  // Get traffic percentage
  const getTrafficPercentage = () => {
    if (testDetails.allocation && typeof testDetails.allocation.dynamic_alloc_traffic === 'number') {
      return `${testDetails.allocation.dynamic_alloc_traffic}%`;
    } else if (typeof testDetails.dynamic_alloc_traffic === 'number') {
      return `${testDetails.dynamic_alloc_traffic}%`;
    } else if (typeof testDetails.traffic === 'number') {
      return `${testDetails.traffic}%`;
    }
    return 'N/A';
  };

  // Get status value (prefer status over state)
  const getStatus = () => {
    return testDetails.status || testDetails.state || 'N/A';
  };

  // Format creation date
  const getCreationDate = () => {
    const dateValue = testDetails.created_at || testDetails.creation_date;
    return formatReadableDate(dateValue);
  };

  return (
    <section className="space-y-6">
      <div>
        {/* Chips au-dessus du nom */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
            ID: {testDetails.id}
          </span>
          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
            {getFormattedType(testDetails.type)}
          </span>
        </div>
        
        {/* Nom et statut */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">
              {safeRender(testDetails.name)}
            </h2>
            <p className="text-sm text-gray-500">
              Created: {getCreationDate()}
            </p>
          </div>
          
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(getStatus())}`}>
            {safeRender(getStatus())}
          </span>
        </div>
      </div>
      
      {/* Informations principales en colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colonne de gauche */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Traffic</h3>
            <p className="mt-1 text-gray-900">{getTrafficPercentage()}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">URL</h3>
            <p className="mt-1 text-gray-900 break-all">
              {testDetails.url && testDetails.url !== 'master' ? (
                <a href={safeRender(testDetails.url)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {safeRender(testDetails.url)}
                </a>
              ) : (
                safeRender(testDetails.url) || 'N/A'
              )}
            </p>
          </div>
        </div>
        
        {/* Colonne de droite */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Labels</h3>
            <div className="mt-1 flex flex-wrap gap-1">
              {Array.isArray(testDetails.labels) && testDetails.labels.length > 0 ? (
                testDetails.labels.map((label: any, index: number) => (
                  <span key={index} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {safeRender(label)}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">No labels</span>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1 text-gray-900">{safeRender(testDetails.description) || 'No description'}</p>
          </div>
        </div>
      </div>
      
      {/* Timeline section */}
      <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase">Last Play</h4>
            <p className="mt-1 text-gray-900">
              {formatReadableDate(testDetails.last_play)}
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase">Last Pause</h4>
            <p className="mt-1 text-gray-900">
              {formatReadableDate(testDetails.last_pause)}
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase">Duration</h4>
            <p className="mt-1 text-gray-900">{calculateDuration()}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainDetails; 