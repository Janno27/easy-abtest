import React from 'react';
import { Card, CardContent } from '../ui/card';

interface TestProps {
  test: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    visits: {
      control: number;
      variant: number;
    };
    conversions: {
      control: number;
      variant: number;
    };
    conversionRate: {
      control: string;
      variant: string;
    };
    improvement: string;
    significance: string;
  };
}

const TestCard: React.FC<TestProps> = ({ test }) => {
  // Déterminer la couleur de la carte en fonction du statut
  const getStatusColor = () => {
    switch (test.status.toLowerCase()) {
      case 'completed':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          status: 'bg-green-100 text-green-800'
        };
      case 'running':
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          status: 'bg-blue-100 text-blue-800'
        };
      case 'paused':
        return {
          border: 'border-yellow-200',
          bg: 'bg-yellow-50',
          status: 'bg-yellow-100 text-yellow-800'
        };
      default:
        return {
          border: 'border-gray-200',
          bg: 'bg-gray-50',
          status: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const colors = getStatusColor();

  return (
    <Card className={`${colors.border} ${colors.bg} p-5 rounded-lg hover:shadow-md transition-shadow`}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800">{test.name}</h4>
          <span className={`px-2 py-1 ${colors.status} text-xs rounded-full font-medium`}>
            {test.status}
          </span>
        </div>
        
        <div className="text-sm text-gray-500 mb-4">
          <span>{test.startDate}</span> - <span>{test.endDate}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h5 className="text-xs text-gray-500 uppercase mb-1">Control</h5>
            <div className="flex space-x-3">
              <div>
                <div className="font-medium">{test.visits.control.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Visits</div>
              </div>
              <div>
                <div className="font-medium">{test.conversions.control.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Conversions</div>
              </div>
              <div>
                <div className="font-medium">{test.conversionRate.control}</div>
                <div className="text-xs text-gray-500">Conv. Rate</div>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-xs text-gray-500 uppercase mb-1">Variant</h5>
            <div className="flex space-x-3">
              <div>
                <div className="font-medium">{test.visits.variant.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Visits</div>
              </div>
              <div>
                <div className="font-medium">{test.conversions.variant.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Conversions</div>
              </div>
              <div>
                <div className="font-medium">{test.conversionRate.variant}</div>
                <div className="text-xs text-gray-500">Conv. Rate</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
            {test.improvement} Improvement
          </div>
          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
            {test.significance} Confidence
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestCard; 