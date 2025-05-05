import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import DurationCalculator from './components/calculator/DurationCalculator';
import { SettingsDialog } from './components/settings/SettingsDialog';
import ResultsAnalysis from './components/results/ResultsAnalysis';
import HypothesisAssistant from './components/hypothesis/HypothesisAssistant';

function App() {
  const propertyId = 'demo-property-123';

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <SettingsDialog />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              A/B Test Toolkit
            </h1>
            <p className="text-gray-600 mt-1">
              Powerful tools to plan and analyze your A/B tests
            </p>
          </div>
          <div className="w-10">
            {/* Espace vide pour l'équilibre */}
          </div>
        </div>

        <Tabs defaultValue="calculator" className="space-y-8 mt-6">
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="prioritization">Prioritization</TabsTrigger>
              <TabsTrigger value="hypothesis">Hypothesis</TabsTrigger>
              <TabsTrigger value="calculator">Duration Calculator</TabsTrigger>
              <TabsTrigger value="results">Results Analysis</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="prioritization">
            <div className="text-center text-gray-500">
              Prioritization tools coming soon
            </div>
          </TabsContent>

          <TabsContent value="hypothesis">
            <HypothesisAssistant />
          </TabsContent>
          
          <TabsContent value="calculator">
            <DurationCalculator />
          </TabsContent>

          <TabsContent value="results">
            <ResultsAnalysis />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

export default App;