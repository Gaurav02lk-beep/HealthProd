import React, { useContext } from 'react';
import { AppContext } from '../App';
import Card from './common/Card';
import Button from './common/Button';
import { Reward } from '../types';

const RewardCard: React.FC<{ reward: Reward }> = ({ reward }) => {
    const { coins, unlockReward } = useContext(AppContext);
    const canAfford = coins >= reward.cost;

    const handleUnlock = () => {
        if (reward.type === 'wallpaper') {
            window.open(reward.assetUrl, '_blank');
        } else if (reward.type === 'audio') {
            const audio = new Audio(reward.assetUrl);
            audio.play();
        }
    };

    return (
        <Card className="flex flex-col">
            <div className="flex-grow">
                 <img src={`${reward.assetUrl}&t=${reward.id}`} alt={reward.name} className="w-full h-40 object-cover rounded-lg mb-4" />
                <h3 className="text-lg font-bold text-brand-secondary">{reward.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{reward.description}</p>
            </div>
            <div className="mt-4">
                {reward.unlocked ? (
                    <Button onClick={handleUnlock} className="w-full bg-green-600 hover:bg-green-500">
                        {reward.type === 'wallpaper' ? 'View Wallpaper' : 'Play Audio'}
                    </Button>
                ) : (
                    <Button 
                        onClick={() => unlockReward(reward.id)} 
                        disabled={!canAfford}
                        className="w-full"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span>Redeem for {reward.cost}</span>
                            <span>💰</span>
                        </div>
                    </Button>
                )}
            </div>
        </Card>
    );
};

const Rewards: React.FC = () => {
    const { rewards, coins } = useContext(AppContext);

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">Rewards Store</h1>
                    <p className="text-lg text-gray-300 mt-1">Spend your coins on exclusive digital goods.</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg text-lg font-bold">
                    Your Coins: <span className="text-yellow-400">{coins} 💰</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map(reward => (
                    <RewardCard key={reward.id} reward={reward} />
                ))}
            </div>
        </div>
    );
};

export default Rewards;
