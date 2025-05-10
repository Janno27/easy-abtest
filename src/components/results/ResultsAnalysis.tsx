import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { GradientBorderEffect } from '../ui/GradientBorderEffect';
import ApiTestImport from './ApiImport/ApiTestImport';
import CsvAnalysis from './CsvImport/CsvAnalysis';

const ResultsAnalysis = () => {
  return (
    <div className="mx-auto max-w-4xl h-[calc(100vh-180px)]">
      <GradientBorderEffect 
        className="w-full h-full"
        gradientColors={["#9333ea", "#3b82f6", "#ec4899"]}
        borderWidth={1}
        gradientOpacity={0.15}
      >
        <div className="bg-purple-50/30 rounded-2xl p-8 shadow-sm flex flex-col h-full">          
          <div className="flex-grow overflow-y-auto">
            <Tabs defaultValue="api" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="api">Import from API</TabsTrigger>
                <TabsTrigger value="csv">Analyze CSV Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="api" className="space-y-4 mt-2">
                <ApiTestImport />
              </TabsContent>
              
              <TabsContent value="csv" className="space-y-4 mt-2">
                <CsvAnalysis />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </GradientBorderEffect>
    </div>
  );
};

export default ResultsAnalysis; 