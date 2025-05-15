import React from 'react';
import { Textarea } from '../../../../ui/textarea';

interface HypothesisDetailsProps {
  hypothesis: string;
  context: string;
  setHypothesis: (value: string) => void;
  setContext: (value: string) => void;
}

const HypothesisDetails: React.FC<HypothesisDetailsProps> = ({
  hypothesis,
  context,
  setHypothesis,
  setContext
}) => {
  return (
    <section className="border-b border-gray-200 pb-6">
      <h2 className="text-lg font-semibold mb-4">Hypothesis & Context</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="hypothesis" className="block text-sm font-medium text-gray-700 mb-1">
            Hypothesis
          </label>
          <Textarea
            id="hypothesis"
            placeholder="What is your hypothesis for this test?"
            value={hypothesis}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHypothesis(e.target.value)}
            rows={3}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
            Context
          </label>
          <Textarea
            id="context"
            placeholder="What is the context of this test?"
            value={context}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
            rows={4}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </section>
  );
};

export default HypothesisDetails; 