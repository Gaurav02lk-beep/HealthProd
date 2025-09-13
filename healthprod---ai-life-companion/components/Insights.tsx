
import React, { useState, useEffect, useContext } from 'react';
import { getLifestyleInsights } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { AppContext } from '../App';

const Insights: React.FC = () => {
  const { activities } = useContext(AppContext);
  const [insights, setInsights] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (activities.length === 0) {
      setInsights("Log some activities to get your first personalized insights!");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await getLifestyleInsights(activities);
      setInsights(result);
    } catch (err) {
      setError("Failed to fetch insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formattedInsights = insights.split('\n').map((line, index) => {
    if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-brand-secondary">{line.substring(4)}</h3>;
    if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold mt-6 mb-2 text-brand-primary">{line.substring(3)}</h2>;
    if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-extrabold mt-8 mb-4">{line.substring(2)}</h1>;
    if (line.startsWith('* ')) return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
    if (line.trim() === '') return <br key={index} />;
    return <p key={index} className="text-gray-300">{line}</p>;
  });

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">AI-Powered Insights</h2>
        <Button onClick={fetchInsights} disabled={isLoading}>
          {isLoading ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-li:text-gray-300">
          {formattedInsights}
        </div>
      )}
    </Card>
  );
};

export default Insights;
