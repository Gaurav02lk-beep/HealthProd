import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import Button from './common/Button';

const FOCUS_TIME = 25 * 60; // 25 minutes
const BREAK_TIME = 5 * 60; // 5 minutes

interface FocusModeProps {
    autoStart?: boolean;
}

const FocusMode: React.FC<FocusModeProps> = ({ autoStart = false }) => {
    const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
    const [isActive, setIsActive] = useState(false);
    const [isFocusSession, setIsFocusSession] = useState(true);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (autoStart) {
            setIsActive(true);
        }
    }, [autoStart]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (Notification.permission === 'granted') {
                new Notification('HealthProd Focus Timer', {
                    body: isFocusSession ? "Time for a break!" : "Time to get back to focus!",
                });
            }
            audioRef.current?.pause();
            
            // Wait a moment before switching to give user time to see the 00:00
            setTimeout(() => {
                const nextIsFocus = !isFocusSession;
                setIsFocusSession(nextIsFocus);
                setTimeLeft(nextIsFocus ? FOCUS_TIME : BREAK_TIME);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, isFocusSession]);
    
    useEffect(() => {
        if (isActive) {
            audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
        } else {
            audioRef.current?.pause();
        }
    }, [isActive]);

    const toggleTimer = () => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setIsFocusSession(true);
        setTimeLeft(FOCUS_TIME);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    const progress = (isFocusSession ? FOCUS_TIME - timeLeft : BREAK_TIME - timeLeft) / (isFocusSession ? FOCUS_TIME : BREAK_TIME) * 100;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-extrabold text-white">AI Distraction Blocker</h1>
                <p className="text-lg text-gray-300 mt-1">Enter Focus Mode to concentrate on your tasks.</p>
            </header>
            <Card className="flex flex-col items-center justify-center p-10">
                <h2 className={`text-2xl font-bold mb-4 ${isFocusSession ? 'text-brand-primary' : 'text-brand-secondary'}`}>
                    {isFocusSession ? "Focus Session" : "Break Time"}
                </h2>
                <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle className="text-gray-700" strokeWidth="5" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                        <circle
                            className={isFocusSession ? 'text-brand-primary' : 'text-brand-secondary'}
                            strokeWidth="5"
                            strokeDasharray={2 * Math.PI * 45}
                            strokeDashoffset={(2 * Math.PI * 45) - (progress / 100) * (2 * Math.PI * 45)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="45"
                            cx="50"
                            cy="50"
                            transform="rotate(-90 50 50)"
                            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
                        />
                    </svg>
                    <span className="absolute text-5xl font-mono">{formatTime(timeLeft)}</span>
                </div>
                <div className="flex space-x-4 mt-8">
                    <Button onClick={toggleTimer} className="w-32">
                        {isActive ? 'Pause' : 'Start'}
                    </Button>
                    <Button onClick={resetTimer} variant="secondary" className="w-32">
                        Reset
                    </Button>
                </div>
                 <audio ref={audioRef} loop src="https://soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3">
                    Your browser does not support the audio element.
                </audio>
                 <p className="text-xs text-gray-500 mt-6">Calm background audio will play during focus sessions.</p>
            </Card>
        </div>
    );
};

export default FocusMode;