import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { parseCSVMealPlan } from '../utils/csvParser';
import { Recipe, MealSlot } from '../types';

interface CSVImporterProps {
  onImport: (meals: MealSlot[], recipes: Recipe[]) => void;
  onClose: () => void;
}

export const CSVImporter: React.FC<CSVImporterProps> = ({ onImport, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => 
      file.type === 'text/csv' || 
      file.name.toLowerCase().endsWith('.csv')
    );
    
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      setError('Please upload a CSV file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const { meals, recipes } = await parseCSVMealPlan(file);
      
      if (meals.length === 0) {
        throw new Error('No meal plan data found in the CSV. Please ensure the CSV contains meal plan data with the correct format.');
      }

      setSuccess(true);
      setTimeout(() => {
        onImport(meals, recipes);
        onClose();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Import Meal Plan CSV
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">Import Successful!</h3>
            <p className="text-green-600">Your meal plan has been imported successfully.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Upload a CSV file containing a weekly meal plan. The system will automatically extract recipes and create your meal plan.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-green-800 mb-2">Expected CSV Format:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Header row: Día, Tiempo, Ingrediente, Porción</li>
                  <li>• Days: Monday, Tuesday, Wednesday, etc. (English or Spanish)</li>
                  <li>• Meal times: Breakfast, Lunch, Dinner, Snack M, Snack V</li>
                  <li>• One ingredient per row with portion size</li>
                </ul>
              </div>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-green-400'
              }`}
            >
              {isProcessing ? (
                <div className="space-y-4">
                  <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-600">Processing CSV...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag and drop your CSV file here, or
                    </p>
                    <label className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
                      Choose File
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">CSV files only</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Import Error</h4>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};