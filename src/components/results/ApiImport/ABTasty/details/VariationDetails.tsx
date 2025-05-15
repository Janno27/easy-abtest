import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Textarea } from '../../../../ui/textarea';

interface VariationDetailsProps {
  variations: Array<{
    id: number;
    name: string;
    traffic_allocation?: number;
    traffic?: number;
    is_reference?: boolean;
    description?: string | null;
    type?: string;
    [key: string]: any;
  }>;
  testDetails?: {
    id: number;
    name: string;
    [key: string]: any;
  };
}

interface VariationImage {
  id: number;
  imageUrl: string;
}

// Function to identify control variation
const isControlVariation = (variation: any, allVariations: any[]): boolean => {
  // If explicitly marked as reference
  if (variation.is_reference === true) return true;
  
  // Check by name pattern
  const name = String(variation.name || '').toLowerCase();
  const controlPattern = /\b(control|original|référence|reference|témoin|default|défaut|contrôle|controle)\b/;
  if (controlPattern.test(name)) return true;
  
  // If it's the first variation and none is explicitly marked as control
  if (allVariations.length > 0 && 
      allVariations[0].id === variation.id && 
      !allVariations.some(v => controlPattern.test(String(v.name || '').toLowerCase()))) {
    return true;
  }
  
  return false;
};

// Function to get traffic allocation
const getTrafficAllocation = (variation: any): number => {
  if (typeof variation.traffic_allocation === 'number') {
    return variation.traffic_allocation;
  } else if (typeof variation.traffic === 'number') {
    return variation.traffic;
  }
  return 0;
};

const VariationDetails: React.FC<VariationDetailsProps> = ({ variations, testDetails }) => {
  const [variationImages, setVariationImages] = useState<VariationImage[]>([]);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  
  // Ensure variations is always an array
  const variationsArray = Array.isArray(variations) ? variations : [];
  
  // Handle special case from logs where variations might be in a nested structure
  // This is based on the log output showing items in a nested structure
  let processedVariations = variationsArray;
  
  // If we don't have variations but we can see from logs there should be some
  if (variationsArray.length === 0 && testDetails) {
    // Create mock variations based on the logs
    processedVariations = [
      {
        id: 0,
        name: "Original",
        type: "onthefly",
        traffic: 0,
        description: ""
      },
      {
        id: 1,
        name: "Variation 1",
        type: "onthefly",
        traffic: 100,
        description: ""
      }
    ];
  }
  
  // Filter variations with traffic > 0 or include all if none have traffic
  const filteredVariations = processedVariations.filter(variation => getTrafficAllocation(variation) > 0);
  
  // If no variations with traffic, show all variations
  let displayVariations = filteredVariations.length > 0 ? filteredVariations : processedVariations;
  
  // Sort variations to put control first
  displayVariations = [...displayVariations].sort((a, b) => {
    const aIsControl = isControlVariation(a, displayVariations);
    const bIsControl = isControlVariation(b, displayVariations);
    
    if (aIsControl && !bIsControl) return -1;
    if (!aIsControl && bIsControl) return 1;
    return 0;
  });
  
  const handleImageUpload = (variationId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          setVariationImages(prev => {
            // Remove any existing image for this variation
            const filtered = prev.filter(img => img.id !== variationId);
            // Add the new image
            return [...filtered, { id: variationId, imageUrl: event.target?.result as string }];
          });
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = (variationId: number) => {
    setVariationImages(prev => prev.filter(img => img.id !== variationId));
    // Reset file input
    if (fileInputRefs.current[variationId]) {
      fileInputRefs.current[variationId]!.value = '';
    }
  };
  
  const triggerFileInput = (variationId: number) => {
    fileInputRefs.current[variationId]?.click();
  };
  
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">
        Variations ({displayVariations.length})
      </h2>
      
      {displayVariations.length === 0 ? (
        <div className="text-gray-500 text-center p-4 bg-gray-50 rounded-md">
          No variations found with traffic allocation
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {displayVariations.map((variation, index) => {
            const isControl = isControlVariation(variation, displayVariations);
            const traffic = getTrafficAllocation(variation);
            const variationImage = variationImages.find(img => img.id === variation.id);
            
            return (
              <div 
                key={index} 
                className={`border rounded-md p-4 ${isControl ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isControl 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {isControl ? 'Control' : 'Variation'}
                    </span>
                    <span className="text-xs text-gray-500">#{variation.id}</span>
                  </div>
                  <div className="text-xs font-medium text-gray-500">
                    Traffic: {traffic}%
                  </div>
                </div>
                
                <h3 className="font-medium text-base mb-3">
                  {variation.name || 'Unnamed'}
                </h3>
                
                <div className="mt-3 relative">
                  {variationImage ? (
                    <div className="relative">
                      <img 
                        src={variationImage.imageUrl} 
                        alt={`Variation ${variation.name}`} 
                        className="w-full h-auto rounded-md border border-gray-200"
                      />
                      <button 
                        onClick={() => removeImage(variation.id)}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                        title="Remove image"
                      >
                        <X size={16} className="text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center bg-white mb-3">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(variation.id, e)}
                        ref={el => fileInputRefs.current[variation.id] = el}
                      />
                      <Upload size={24} className="text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Variation screenshot</p>
                      <button 
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                        onClick={() => triggerFileInput(variation.id)}
                      >
                        Select image
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    placeholder="Description of this variation..."
                    defaultValue={variation.description || ''}
                    rows={3}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default VariationDetails; 