import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';

const CsvAnalysis = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setUploadError(null);
    
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setUploadError('Please select a CSV file');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a CSV file');
      return;
    }

    setIsUploading(true);
    // Loading simulation - CSV parsing will be implemented later
    setTimeout(() => {
      setIsUploading(false);
    }, 1500);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setUploadError(null);
    } else {
      setUploadError('Please drop a CSV file');
    }
  };

  return (
    <div className="space-y-6">
      <div 
        className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
        
        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          
          <div>
            <p className="text-sm font-medium">
              {file ? file.name : 'Click or drag & drop your CSV file'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              File must contain columns for visits and conversions
            </p>
          </div>
          
          {uploadError && (
            <p className="text-sm text-red-500">{uploadError}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Expected Data Format</h3>
        <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto">
          <p>variant,visits,conversions</p>
          <p>control,1000,100</p>
          <p>variant_1,1050,120</p>
        </div>
        <p className="text-xs text-gray-500">
          Headers should match the metrics you want to analyze
        </p>
      </div>

      <Button 
        onClick={handleUpload} 
        className="w-full bg-gray-600 hover:bg-gray-700 text-white" 
        disabled={!file || isUploading}
      >
        {isUploading ? 'Analyzing...' : 'Analyze Data'}
      </Button>
    </div>
  );
};

export default CsvAnalysis; 