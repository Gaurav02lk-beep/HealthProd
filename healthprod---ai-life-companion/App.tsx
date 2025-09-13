import React, { useState, createContext, useMemo, useEffect, useRef, useCallback } from 'react';
// FIX: Import SpeechRecognition type from `types.ts` to resolve 'cannot find name' error.
import { Activity, ActivityType, Reminder, AppContextType, Task, Friend, Challenge, Reward, KnowledgeCard, DailyReport, SpeechRecognition } from './types';
import Dashboard from './components/Dashboard';
import MealScanner from './components/MealScanner';
import Chatbot from './components/Chatbot';
import LogActivityModal from './components/LogActivityModal';
import AddReminderModal from './components/AddReminderModal';
import FocusMode from './components/FocusMode';
import Tasks from './components/Tasks';
import Challenges from './components/Challenges';
import Rewards from './components/Rewards';
import { ICONS } from './constants';
import { addDays, subHours, isToday, format } from 'date-fns';
import VoiceControlUI from './components/VoiceControlUI';
import { getDailyKnowledgeCard, generateDailyReport } from './services/geminiService';
import DailyReportModal from './components/DailyReportModal';

type Page = 'dashboard' | 'scanner' | 'chat' | 'focus' | 'tasks' | 'challenges' | 'rewards';

export const AppContext = createContext<AppContextType>({} as AppContextType);

// FIX: Removed local SpeechRecognition type declarations.
// The types have been centralized in `types.ts` to prevent conflicts and ensure consistency.

const generateInitialData = (): Activity[] => {
    const now = new Date();
    return [
        { id: '1', type: ActivityType.Sleep, startTime: subHours(now, 10), endTime: subHours(now, 2) },
        { id: '2', type: ActivityType.Meal, startTime: subHours(now, 1.5), endTime: subHours(now, 1) },
        { id: '3', type: ActivityType.Work, startTime: subHours(addDays(now, -1), 6), endTime: subHours(addDays(now, -1), 2) },
        { id: '4', type: ActivityType.Exercise, startTime: subHours(addDays(now, -1), 1), endTime: subHours(addDays(now, -1), 0) },
        { id: '5', type: ActivityType.Sleep, startTime: subHours(addDays(now, -1), 18), endTime: subHours(addDays(now, -1), 10) },
        { id: '6', type: ActivityType.Study, startTime: subHours(addDays(now, -2), 5), endTime: subHours(addDays(now, -2), 2) },
    ];
};

const initialFriends: Friend[] = [ { id: 'f1', name: 'Alex', avatar: ' A '}, { id: 'f2', name: 'Ben', avatar: ' B ' }, { id: 'f3', name: 'Chloe', avatar: ' C ' }, { id: 'f4', name: 'You', avatar: ' Y ' }, ];
const initialChallenges: Challenge[] = [ { id: 'c1', title: '7-Day Early Wake-up Challenge', description: 'Wake up before 7 AM for 7 days straight to build a healthy morning routine.', duration: 7, leaderboard: [ { friendId: 'f4', name: 'You', avatar: ' Y ', progress: 5 }, { friendId: 'f1', name: 'Alex', avatar: ' A ', progress: 6 }, { friendId: 'f3', name: 'Chloe', avatar: ' C ', progress: 4 }, { friendId: 'f2', name: 'Ben', avatar: ' B ', progress: 3 }, ].sort((a,b) => b.progress - a.progress), } ];
const initialRewards: Reward[] = [ { id: 'r1', name: 'Zen Wallpaper Pack', description: 'Exclusive set of 3 calming wallpapers for your devices.', cost: 100, type: 'wallpaper', unlocked: false, assetUrl: 'https://source.unsplash.com/random/1920x1080?nature' }, { id: 'r2', name: 'Focus Meditation Audio', description: 'A 10-minute guided meditation track for deep focus.', cost: 250, type: 'audio', unlocked: false, assetUrl: 'https://soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, { id: 'r3', name: 'Productivity Wallpaper', description: 'A motivational wallpaper to keep you on track.', cost: 100, type: 'wallpaper', unlocked: false, assetUrl: 'https://source.unsplash.com/random/1920x1080?work' }, ];

const useVoiceCommands = (
    setCurrentPage: React.Dispatch<React.SetStateAction<Page>>,
    setFocusAutoStart: React.Dispatch<React.SetStateAction<boolean>>,
    handleGenerateReport: () => Promise<DailyReport | undefined>
) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const speak = (text: string) => {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    };

    const processCommand = useCallback(async (command: string) => {
        if (command.includes('add new task') || command.includes('add task')) {
            speak("Navigating to tasks.");
            setCurrentPage('tasks');
        } else if (command.includes('start focus timer') || command.includes('start my focus timer')) {
            speak("Starting your focus session.");
            setFocusAutoStart(true);
            setCurrentPage('focus');
        } else if (command.includes("today's report") || command.includes("progress report")) {
            speak("Generating your daily report now.");
            const report = await handleGenerateReport();
            if (report) {
                speak(`Report generated. Your productivity score is ${report.productivityScore}. Here is your summary: ${report.summary}`);
            } else {
                 speak("Sorry, I couldn't generate the report right now.");
            }
        }
    }, [setCurrentPage, setFocusAutoStart, handleGenerateReport]);

    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            console.warn("Speech Recognition not supported in this browser.");
            return;
        }
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            const processedTranscript = finalTranscript.toLowerCase().trim();
            if (processedTranscript.startsWith('hey ai')) {
                const command = processedTranscript.substring('hey ai'.length).trim();
                if (command) {
                    setTranscript(command);
                    processCommand(command);
                }
            }
        };

        recognition.onend = () => {
             if (isListening) recognition.start(); // Restart if it was supposed to be listening
        };

        recognitionRef.current = recognition;
    }, [processCommand, isListening]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    return { isListening, transcript, toggleListening };
};


const App: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>(generateInitialData());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [friends] = useState<Friend[]>(initialFriends);
  const [challenges] = useState<Challenge[]>(initialChallenges);
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [coins, setCoins] = useState<number>(150);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [knowledgeCard, setKnowledgeCard] = useState<KnowledgeCard | null>(null);
  const [focusAutoStart, setFocusAutoStart] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const handleGenerateReport = async () => {
      if (!isOnline) return;
      setIsReportModalOpen(true);
      setIsReportLoading(true);
      const todayActivitiesForReport = activities.filter(a => isToday(new Date(a.startTime)));
      const report = await generateDailyReport(todayActivitiesForReport.length > 0 ? todayActivitiesForReport : []);
      setDailyReport(report);
      setIsReportLoading(false);
      return report;
  };

  const { isListening, transcript, toggleListening } = useVoiceCommands(setCurrentPage, setFocusAutoStart, handleGenerateReport);

  useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);
  
  useEffect(() => {
    const fetchCard = async () => {
        const storedCard = localStorage.getItem('healthprod-daily-card');
        const storedDate = localStorage.getItem('healthprod-card-date');
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        if (storedCard && storedDate === todayStr) {
            setKnowledgeCard(JSON.parse(storedCard));
        } else if (isOnline) {
            const card = await getDailyKnowledgeCard();
            setKnowledgeCard(card);
            localStorage.setItem('healthprod-daily-card', JSON.stringify(card));
            localStorage.setItem('healthprod-card-date', todayStr);
        }
    };
    fetchCard();
  }, [isOnline]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (Notification.permission !== 'granted') return;
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      reminders.forEach(reminder => {
        if (reminder.time === currentTime) { new Notification('HealthProd Reminder', { body: reminder.title, icon: '/vite.svg' }); }
      });
    }, 30000);
    return () => clearInterval(intervalId);
  }, [reminders]);

  const addActivity = (activity: Omit<Activity, 'id'>) => {
    const newActivity = { ...activity, id: Date.now().toString() };
    setActivities(prev => [...prev, newActivity].sort((a,b) => b.startTime.getTime() - a.startTime.getTime()));
    setCoins(prev => prev + 10);
  };
  
  const addReminder = (reminder: Omit<Reminder, 'id'>) => {
    if (Notification.permission === 'default') { Notification.requestPermission(); }
    const newReminder = { ...reminder, id: Date.now().toString() };
    setReminders(prev => [...prev, newReminder].sort((a, b) => a.time.localeCompare(b.time)));
  };

  const deleteReminder = (reminderId: string) => { setReminders(prev => prev.filter(r => r.id !== reminderId)); };
  const addTask = (task: Omit<Task, 'id' | 'priority' | 'completed'>) => {
    const newTask = { ...task, id: Date.now().toString(), priority: 'Medium' as const, completed: false };
    setTasks(prev => [newTask, ...prev]);
  };
  const toggleTask = (taskId: string) => { setTasks(prev => prev.map(t => t.id === taskId ? {...t, completed: !t.completed} : t)); };
  const unlockReward = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if(reward && coins >= reward.cost) {
        setCoins(prev => prev - reward.cost);
        setRewards(prev => prev.map(r => r.id === rewardId ? {...r, unlocked: true} : r));
    }
  };

  const contextValue = useMemo(() => ({ 
    activities, addActivity, reminders, addReminder, deleteReminder,
    tasks, addTask, setTasks, toggleTask, friends, challenges, rewards, unlockReward, coins,
    isOnline, knowledgeCard
  }), [activities, reminders, tasks, friends, challenges, rewards, coins, isOnline, knowledgeCard]);

  const renderPage = () => {
    const pageProps = { key: currentPage }; // Force re-mount if needed
    if (currentPage === 'focus') {
        const shouldAutoStart = focusAutoStart;
        if (shouldAutoStart) setFocusAutoStart(false); // Reset after consumption
        return <FocusMode autoStart={shouldAutoStart} />;
    }
    switch (currentPage) {
      case 'dashboard': return <Dashboard {...pageProps} />;
      case 'tasks': return <Tasks {...pageProps} />;
      case 'challenges': return <Challenges {...pageProps} />;
      case 'rewards': return <Rewards {...pageProps} />;
      case 'scanner': return <MealScanner {...pageProps} />;
      case 'chat': return <Chatbot {...pageProps} />;
      default: return <Dashboard {...pageProps} />;
    }
  };
  
  const NavButton: React.FC<{
    onClick: () => void; isActive: boolean; children: React.ReactNode;
  }> = ({ onClick, isActive, children }) => (
      <button onClick={onClick} className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-3 ${ isActive ? 'bg-brand-primary text-white' : 'text-gray-300 hover:bg-gray-700' }`} >
          {children}
      </button>
  );

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
        {!isOnline && (
            <div className="bg-yellow-500 text-black text-center py-2 font-semibold text-sm">
                Offline Emergency Mode: Core features are available. AI capabilities are disabled.
            </div>
        )}
        <div className="flex">
          <aside className="w-64 bg-gray-800 p-4 border-r border-gray-700 h-screen sticky top-0 flex flex-col">
            <div className="flex-shrink-0 px-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2" aria-label="HealthProd Home">
                        <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white">HealthProd</h1>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full"><span className="font-bold">{coins}</span><span>💰</span></div>
                </div>
                <nav className="space-y-2 mt-6">
                  {Object.entries({Dashboard: 'dashboard', Tasks: 'tasks', Challenges: 'challenges', Rewards: 'rewards', 'Focus Mode': 'focus', 'Meal Scanner': 'scanner', 'AI Chat': 'chat'}).map(([name, pageId]) => (
                    <NavButton key={pageId} onClick={() => setCurrentPage(pageId as Page)} isActive={currentPage === pageId}>{name}</NavButton>
                  ))}
                </nav>
            </div>
            <div className="mt-8 flex-1 flex flex-col min-h-0">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 flex-shrink-0">My Reminders</h2>
                <div className="flex-grow overflow-y-auto mt-2 space-y-2 pr-2 -mr-2">
                    {reminders.length > 0 ? reminders.map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-lg">
                            <div className="flex items-center gap-3"><span className="text-gray-300">{ICONS[r.activityType]}</span><div><p className="text-sm font-semibold text-gray-100 leading-tight">{r.title}</p><p className="text-xs text-gray-400">{r.time}</p></div></div>
                            <button onClick={() => deleteReminder(r.id)} className="text-gray-500 hover:text-red-400 text-lg font-bold p-1 rounded-full leading-none">&times;</button>
                        </div>
                    )) : <p className="text-gray-500 text-xs text-center mt-2 px-2">No reminders yet.</p>}
                </div>
                <button onClick={() => setIsReminderModalOpen(true)} className="mt-2 w-full text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-3 rounded-lg transition-colors">+ Add Reminder</button>
            </div>
            <div className="mt-auto pt-4 flex-shrink-0">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-4">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
                </div>
                <button onClick={() => setIsLogModalOpen(true)} className="w-full bg-brand-secondary hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-xl transition-transform transform hover:scale-105">Log Activity +</button>
            </div>
          </aside>
          <main className="flex-1 p-8 h-screen overflow-y-auto">
            {renderPage()}
          </main>
        </div>
        {isLogModalOpen && <LogActivityModal onClose={() => setIsLogModalOpen(false)} onAddActivity={addActivity} />}
        {isReminderModalOpen && <AddReminderModal onClose={() => setIsReminderModalOpen(false)} onAddReminder={addReminder} />}
        {isReportModalOpen && <DailyReportModal onClose={() => setIsReportModalOpen(false)} reportData={dailyReport} isLoading={isReportLoading} />}
        <VoiceControlUI isListening={isListening} transcript={transcript} onToggle={toggleListening} />
      </div>
    </AppContext.Provider>
  );
};

export default App;
