
import React, { useState, useRef } from 'react';
import { analyzeMealImage } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';

const MealScanner: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setAnalysis('');
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis('');
    try {
      const result = await analyzeMealImage(selectedFile);
      setAnalysis(result);
    } catch (err) {
      setError("An error occurred during analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formattedAnalysis = analysis.split('\n').map((line, index) => {
    if (line.match(/^\*\*(.*)\*\*$/)) return <p key={index} className="font-bold text-lg text-brand-primary">{line.replace(/\*\*/g, '')}</p>;
    if (line.startsWith('* ')) return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
    if (line.trim() === '') return <br key={index} />;
    return <p key={index}>{line}</p>;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-white">Smart Meal Scanner</h1>
        <p className="text-lg text-gray-300 mt-1">Upload a photo of your meal for an AI-powered nutritional analysis.</p>
      </header>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-brand-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              {preview ? (
                <img src={preview} alt="Meal preview" className="mx-auto max-h-64 rounded-lg" />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <p className="mt-2">Click to upload an image</p>
                    <p className="text-xs">PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>
             <Button onClick={handleAnalyze} disabled={!selectedFile || isLoading} className="w-full">
              {isLoading ? 'Analyzing...' : 'Analyze Meal'}
            </Button>
          </div>

          <div className="min-h-[20rem]">
             <h2 className="text-xl font-bold mb-4">Analysis Results</h2>
             {isLoading && (
                <div className="flex items-center justify-center h-full">
                    <Spinner />
                </div>
             )}
             {error && <p className="text-red-400">{error}</p>}
             {analysis && (
                <div className="prose prose-invert max-w-none space-y-2 prose-p:text-gray-300 prose-li:text-gray-300">
                  {formattedAnalysis}
                </div>
             )}
             {!analysis && !isLoading && !error && <p className="text-gray-400">Your meal analysis will appear here.</p>}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MealScanner;
