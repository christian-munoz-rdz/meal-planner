import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { parsePDFMealPlan } from '../utils/pdfParser';
import { Recipe, MealSlot } from '../types';

interface PDFImporterProps {
  onImport: (meals: MealSlot[], recipes: Recipe[]) => void;
  onClose: () => void;
}

export const PDFImporter: React.FC<PDFImporterProps> = ({ onImport, onClose }) => {
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
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileUpload(pdfFile);
    } else {
      setError('Please upload a PDF file');
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
      const { meals, recipes } = await parsePDFMealPlan(file);
      
      if (meals.length === 0) {
        throw new Error('No meal plan data found in the PDF. Please ensure the PDF contains a meal plan table.');
      }

      setSuccess(true);
      setTimeout(() => {
        onImport(meals, recipes);
        onClose();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Import Meal Plan PDF
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
                Upload a PDF file containing a weekly meal plan table. The system will automatically extract recipes and create your meal plan.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">Supported Format:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Weekly meal plan tables</li>
                  <li>• Days of the week (Spanish/English)</li>
                  <li>• Meal types: Breakfast, Lunch, Dinner, Snacks</li>
                  <li>• Recipe descriptions with ingredients</li>
                </ul>
              </div>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {isProcessing ? (
                <div className="space-y-4">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-600">Processing PDF...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag and drop your PDF file here, or
                    </p>
                    <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                      Choose File
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PDF files only</p>
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