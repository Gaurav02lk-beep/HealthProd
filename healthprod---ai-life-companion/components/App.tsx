import React, { useState, createContext, useMemo, useEffect, useRef, useCallback } from 'react';
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
    const pageProps = { key: currentPage };
    if (currentPage === 'focus') {
        const shouldAutoStart = focusAutoStart;
        if (shouldAutoStart) setFocusAutoStart(false);
        return <FocusMode autoStart={shouldAutoStart} />;
    }
    const pages: { [key in Page]: React.ReactNode } = {
        dashboard: <Dashboard {...pageProps} />,
        tasks: <Tasks {...pageProps} />,
        challenges: <Challenges {...pageProps} />,
        rewards: <Rewards {...pageProps} />,
        scanner: <MealScanner {...pageProps} />,
        chat: <Chatbot {...pageProps} />,
        focus: <FocusMode autoStart={focusAutoStart} />,
    };
    return pages[currentPage] || <Dashboard {...pageProps} />;
  };
  
   const pageHeaders: { [key in Page]: { title: string; subtitle: string } } = {
        dashboard: { title: "Welcome Back!", subtitle: "Here's your daily and weekly summary." },
        tasks: { title: "AI Task Prioritizer", subtitle: "Focus on what matters most. Let AI organize your to-do list." },
        challenges: { title: "Group Challenges", subtitle: "Join friends in fun challenges and build habits together." },
        rewards: { title: "Rewards Store", subtitle: "Spend your coins on exclusive digital goods." },
        focus: { title: "AI Distraction Blocker", subtitle: "Enter Focus Mode to concentrate on your tasks." },
        scanner: { title: "Smart Meal Scanner", subtitle: "Upload a photo for an AI-powered nutritional analysis." },
        chat: { title: "AI Companion Chat", subtitle: "Your personal assistant for a better lifestyle." },
    };

    const NavIconButton: React.FC<{
        page: Page; label: string; children: React.ReactNode;
    }> = ({ page, label, children }) => (
        <button
            onClick={() => setCurrentPage(page)}
            className={`relative group w-full flex justify-center p-3 rounded-lg transition-colors duration-200 ${ currentPage === page ? 'bg-brand-primary text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white' }`}
            aria-label={label}
        >
            {children}
            <span className="absolute left-full ml-4 w-auto p-2 min-w-max rounded-md shadow-md text-white bg-slate-900 text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100">
                {label}
            </span>
        </button>
    );

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
        {!isOnline && (
            <div className="bg-yellow-500 text-black text-center py-2 font-semibold text-sm">
                Offline Emergency Mode: Core features are available. AI capabilities are disabled.
            </div>
        )}
        <div className="flex">
          <aside className="w-20 bg-slate-800 p-3 border-r border-slate-700 h-screen sticky top-0 flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center text-white flex-shrink-0" aria-label="HealthProd Home">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
              <nav className="w-full flex flex-col items-center gap-3">
                  <NavIconButton page="dashboard" label="Dashboard"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></NavIconButton>
                  <NavIconButton page="tasks" label="Tasks"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></NavIconButton>
                  <NavIconButton page="challenges" label="Challenges"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></NavIconButton>
                  <NavIconButton page="rewards" label="Rewards"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 17 17 23 15.79 13.88"></polyline></svg></NavIconButton>
                  <NavIconButton page="focus" label="Focus Mode"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="6" x2="12" y2="12"></line><line x1="12" y1="12" x2="16" y2="16"></line></svg></NavIconButton>
                  <NavIconButton page="scanner" label="Meal Scanner"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12s2.545-5 7-5c4.455 0 7 5 7 5s-2.545 5-7 5c-4.455 0-7-5-7-5z"></path><path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path><path d="M21 3 3 21"></path></svg></NavIconButton>
                  <NavIconButton page="chat" label="AI Chat"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></NavIconButton>
              </nav>
              <div className="mt-auto w-full flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="sr-only">{isOnline ? 'Online' : 'Offline Mode'}</span>
                  </div>
              </div>
          </aside>
          <main className="flex-1 p-8 h-screen overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-white">{pageHeaders[currentPage].title}</h1>
                <p className="text-lg text-slate-300 mt-1">{pageHeaders[currentPage].subtitle}</p>
            </header>
            {renderPage()}
          </main>
        </div>

        <button 
            onClick={() => setIsLogModalOpen(true)} 
            className="fixed bottom-8 right-8 w-16 h-16 bg-brand-secondary hover:bg-teal-500 text-white rounded-full shadow-lg flex items-center justify-center transition-transform transform hover:scale-110 z-40"
            aria-label="Log new activity"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>

        {isLogModalOpen && <LogActivityModal onClose={() => setIsLogModalOpen(false)} onAddActivity={addActivity} />}
        {isReminderModalOpen && <AddReminderModal onClose={() => setIsReminderModalOpen(false)} onAddReminder={addReminder} />}
        {isReportModalOpen && <DailyReportModal onClose={() => setIsReportModalOpen(false)} reportData={dailyReport} isLoading={isReportLoading} />}
        <VoiceControlUI isListening={isListening} transcript={transcript} onToggle={toggleListening} />
      </div>
    </AppContext.Provider>
  );
};

export default App;