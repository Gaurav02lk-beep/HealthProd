import React, { useContext } from 'react';
import { AppContext } from '../App';
import Card from './common/Card';
import { Challenge } from '../types';

const ChallengeCard: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
    return (
        <Card className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
                <h2 className="text-2xl font-bold text-brand-secondary">{challenge.title}</h2>
                <p className="text-gray-300 mt-2">{challenge.description}</p>
                <div className="mt-4 bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-sm font-semibold">Duration</p>
                    <p className="text-2xl font-bold">{challenge.duration} Days</p>
                </div>
            </div>
            <div className="md:w-2/3">
                <h3 className="text-xl font-bold mb-4">Leaderboard</h3>
                <ul className="space-y-3">
                    {challenge.leaderboard.map((entry, index) => (
                        <li key={entry.friendId} className="flex items-center gap-4 bg-gray-700/50 p-3 rounded-lg">
                            <span className="text-xl font-bold w-6 text-center">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}</span>
                            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center font-bold text-gray-300">{entry.avatar}</div>
                            <p className="font-semibold flex-grow">{entry.name}</p>
                            <div className="w-1/3">
                                <div className="w-full bg-gray-600 rounded-full h-2.5">
                                    <div 
                                        className="bg-brand-primary h-2.5 rounded-full" 
                                        style={{ width: `${(entry.progress / challenge.duration) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            <p className="font-mono text-sm w-16 text-right">{entry.progress} / {challenge.duration}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
};

const Challenges: React.FC = () => {
    const { challenges } = useContext(AppContext);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-extrabold text-white">Group Challenges</h1>
                <p className="text-lg text-gray-300 mt-1">Join friends in fun challenges and build habits together.</p>
            </header>
            
            <div className="space-y-6">
                {challenges.map(challenge => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
            </div>
        </div>
    );
};

export default Challenges;
