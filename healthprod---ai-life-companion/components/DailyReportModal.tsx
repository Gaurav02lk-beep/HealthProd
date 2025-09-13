import React from 'react';
import { DailyReport } from '../types';
import Button from './common/Button';
import Spinner from './common/Spinner';

interface DailyReportModalProps {
  onClose: () => void;
  reportData: DailyReport | null;
  isLoading: boolean;
}

const DailyReportModal: React.FC<DailyReportModalProps> = ({ onClose, reportData, isLoading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-2xl m-4 border border-gray-700 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Your AI-Generated Daily Report</h2>
        
        {isLoading && (
            <div className="flex flex-col items-center justify-center h-64">
                <Spinner />
                <p className="mt-4 text-gray-300">HealthProd is analyzing your day...</p>
            </div>
        )}

        {reportData && !isLoading && (
            <div className="space-y-6">
                <div className="flex flex-col items-center">
                    <p className="text-lg font-medium text-gray-400">Productivity Score</p>
                    <div className="relative w-32 h-32 mt-2">
                         <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle className="text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                            <circle
                                className="text-brand-primary transition-all duration-1000 ease-out"
                                strokeWidth="8"
                                strokeDasharray={2 * Math.PI * 45}
                                strokeDashoffset={(2 * Math.PI * 45) - (reportData.productivityScore / 100) * (2 * Math.PI * 45)}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="45"
                                cx="50"
                                cy="50"
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">{reportData.productivityScore}</span>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-brand-secondary mb-2">Daily Summary</h3>
                    <p className="text-gray-300 bg-gray-900/50 p-4 rounded-lg">{reportData.summary}</p>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-brand-secondary mb-2">Recommendations</h3>
                    <p className="text-gray-300 bg-gray-900/50 p-4 rounded-lg">{reportData.recommendations}</p>
                </div>
                
                <div>
                    <h3 className="text-xl font-semibold text-brand-secondary mb-2">To-Do List for Tomorrow</h3>
                    <ul className="space-y-2">
                        {reportData.nextDayTodoList.map((item, index) => (
                             <li key={index} className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg">
                                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-brand-primary text-xs font-bold flex-shrink-0">{index + 1}</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="text-center pt-4">
                    <Button onClick={onClose}>Close Report</Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default DailyReportModal;