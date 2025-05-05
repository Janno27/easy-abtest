import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Card, CardContent } from '../ui/card';
import ApiTestImport from './ApiTestImport';
import CsvAnalysis from './CsvAnalysis';

const ResultsAnalysis = () => {
  const [activeSource, setActiveSource] = useState<'api' | 'csv'>('api');

  // Mock test result for demonstration
  const mockTest = {
    name: "Homepage CTA Test",
    status: "Completed",
    startDate: "2023-04-15",
    endDate: "2023-04-30",
    visits: {
      control: 5680,
      variant: 5720
    },
    conversions: {
      control: 510,
      variant: 631
    },
    conversionRate: {
      control: "8.98%",
      variant: "11.03%"
    },
    improvement: "+22.8%",
    significance: "99.8%"
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm border">
      <Tabs defaultValue="api" onValueChange={(value) => setActiveSource(value as 'api' | 'csv')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="api">Import from API</TabsTrigger>
          <TabsTrigger value="csv">Analyze CSV Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="api">
          <div className="space-y-6">
            <ApiTestImport />
            
            {/* Mock imported test */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-md font-medium mb-4">Imported Tests</h3>
              <Card className="border border-green-200 bg-green-50 p-5 rounded-lg hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">{mockTest.name}</h4>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      {mockTest.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-4">
                    <span>{mockTest.startDate}</span> - <span>{mockTest.endDate}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="text-xs text-gray-500 uppercase mb-1">Control</h5>
                      <div className="flex space-x-3">
                        <div>
                          <div className="font-medium">{mockTest.visits.control.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Visits</div>
                        </div>
                        <div>
                          <div className="font-medium">{mockTest.conversions.control.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Conversions</div>
                        </div>
                        <div>
                          <div className="font-medium">{mockTest.conversionRate.control}</div>
                          <div className="text-xs text-gray-500">Conv. Rate</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-xs text-gray-500 uppercase mb-1">Variant</h5>
                      <div className="flex space-x-3">
                        <div>
                          <div className="font-medium">{mockTest.visits.variant.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Visits</div>
                        </div>
                        <div>
                          <div className="font-medium">{mockTest.conversions.variant.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Conversions</div>
                        </div>
                        <div>
                          <div className="font-medium">{mockTest.conversionRate.variant}</div>
                          <div className="text-xs text-gray-500">Conv. Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                      {mockTest.improvement} Improvement
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                      {mockTest.significance} Confidence
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="csv">
          <CsvAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResultsAnalysis; 