import React, { useState, useRef } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { FileUp } from 'lucide-react';

interface CsvData {
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
}

const CsvAnalysis = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analyzedData, setAnalyzedData] = useState<CsvData | null>(null);
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
    
    // Simulate CSV analysis
    setTimeout(() => {
      // Mock CSV analysis
      const mockAnalyzedData: CsvData = {
        id: "csv-import-1",
        name: file.name.replace('.csv', ''),
        status: "Analyzed",
        startDate: "2023-05-01",
        endDate: "2023-05-15",
        visits: {
          control: 4532,
          variant: 4498
        },
        conversions: {
          control: 398,
          variant: 477
        },
        conversionRate: {
          control: "8.78%",
          variant: "10.60%"
        },
        improvement: "+20.7%",
        significance: "98.5%"
      };
      
      setAnalyzedData(mockAnalyzedData);
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
      {!analyzedData ? (
        <>
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
                <FileUp className="h-5 w-5 text-purple-500" />
              </div>
              
              <div>
                <p className="text-sm font-medium">
                  {file ? file.name : 'Click or drag-and-drop your CSV file'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  The file must contain columns for visits and conversions
                </p>
              </div>
              
              {uploadError && (
                <p className="text-sm text-red-500">{uploadError}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Expected data format</h3>
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
            className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
            disabled={!file || isUploading}
          >
            {isUploading ? 'Analyzing...' : 'Analyze data'}
          </Button>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium">Analysis results</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setAnalyzedData(null);
                setFile(null);
              }}
            >
              New analysis
            </Button>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-medium">Recommendation</h3>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <p className="text-sm">
                  With an improvement rate of {analyzedData.improvement} and statistical confidence of {analyzedData.significance}, 
                  we recommend implementing the tested variant.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvAnalysis; 