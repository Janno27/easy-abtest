import React from 'react';

interface DeepAnalysisProps {
  testId: number;
  accountId: string;
}

const DeepAnalysis: React.FC<DeepAnalysisProps> = ({ testId, accountId }) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <h3 className="text-lg font-medium text-gray-700 mb-2">Deep Analysis</h3>
      <p className="text-gray-500">
        This feature will be available soon. It will allow you to deeply analyze the results of test #{testId}.
      </p>
    </div>
  );
};

export default DeepAnalysis; 