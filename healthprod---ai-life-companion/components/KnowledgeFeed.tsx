import React, { useContext } from 'react';
import { AppContext } from '../App';
import Card from './common/Card';

const KnowledgeFeed: React.FC = () => {
    const { knowledgeCard, isOnline } = useContext(AppContext);

    if (!isOnline && !knowledgeCard) {
        return null;
    }

    if (!knowledgeCard) {
        return (
            <Card className="bg-slate-800/50">
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-3 py-1">
                        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                        <div className="space-y-2">
                            <div className="h-3 bg-slate-700 rounded"></div>
                            <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </Card>
        );
    }
    
    const categoryInfo = {
        'Productivity Hack': { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.09 16.05a1 1 0 0 0 .91.95h.02a1 1 0 0 0 .92-.95l.22-3.05a1 1 0 0 0-.92-1.05h-.04a1 1 0 0 0-.92 1.05Z"/><path d="M12 11.53c0-2.5.59-4.72 1.62-6.53a1 1 0 0 1 1.68.75 3.9 3.9 0 0 0 1.2 2.76c.32.32.58.68.78 1.05A1 1 0 0 1 17 11h-1a1 1 0 0 0-1 1v.05a1 1 0 0 0 1 1H17a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1a1 1 0 0 0-1 1v.05a1 1 0 0 0 1 1H17a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4.3a6.8 6.8 0 0 1-4.3-2.43 6.9 6.9 0 0 1-2.4-4.33A6.8 6.8 0 0 1 8.37 5.2a1 1 0 0 1 1.68.75c.22.42.42.86.58 1.32.22.62.33 1.28.35 1.95.02.68.02 1.35 0 2.03-.02.67-.13 1.33-.35 1.95a5 5 0 0 0-.58 1.32 1 1 0 0 1-1.68.75 6.8 6.8 0 0 1-1.62-6.53 1 1 0 0 1 1.68-.75c.32.32.58.68.78 1.05A1 1 0 0 1 9 11h-1a1 1 0 0 0-1 1v.05a1 1 0 0 0 1 1H9a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H8a1 1 0 0 0-1 1v.05a1 1 0 0 0 1 1H9a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H6.7a6.8 6.8 0 0 1-4.3-2.43A6.9 6.9 0 0 1 0 12.27a6.8 6.8 0 0 1 2.37-4.57 1 1 0 0 1 1.68.75c.22.42.42.86.58 1.32.22.62.33 1.28.35 1.95.02.68.02 1.35 0 2.03"/></svg>, color: 'text-blue-400' },
        'Fun Fact': { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>, color: 'text-yellow-400' },
        'Quote': { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>, color: 'text-purple-400' },
        'Challenge': { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M21 12a9 9 0 1 0-9 9"/></svg>, color: 'text-green-400' },
    };

    const info = categoryInfo[knowledgeCard.category];

    return (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900/50 border-slate-700">
             <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-slate-700/50 ${info.color}`}>
                    {info.icon}
                </div>
                <div className="flex-1">
                    <p className={`text-sm font-bold ${info.color}`}>{knowledgeCard.category}</p>
                    <h2 className="text-lg font-bold text-white mt-1">{knowledgeCard.title}</h2>
                    <p className="text-slate-300 mt-2">{knowledgeCard.content}</p>
                </div>
            </div>
        </Card>
    );
};

export default KnowledgeFeed;