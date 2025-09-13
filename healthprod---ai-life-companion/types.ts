
export enum ActivityType {
  Sleep = "Sleep",
  Meal = "Meal",
  Study = "Study",
  Work = "Work",
  Exercise = "Exercise",
}

export interface Activity {
  id: string;
  type: ActivityType;
  startTime: Date;
  endTime: Date;
  notes?: string;
  attachment?: {
    dataUrl: string;
    name: string;
    type: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
}

export interface Reminder {
  id: string;
  title: string;
  time: string; // e.g., "14:30"
  activityType: ActivityType;
}

export interface DailyReport {
    productivityScore: number;
    summary: string;
    recommendations: string;
    nextDayTodoList: string[];
}

export interface KnowledgeCard {
    title: string;
    content: string;
    category: 'Productivity Hack' | 'Fun Fact' | 'Quote' | 'Challenge';
}

// New types for gamification and collaboration
export type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface Task {
    id: string;
    description: string;
    deadline?: string;
    priority: TaskPriority;
    completed: boolean;
}

export interface Friend {
    id: string;
    name: string;
    avatar: string;
}

export interface LeaderboardEntry {
    friendId: string;
    name: string;
    avatar: string;
    progress: number; // e.g., days completed in a challenge
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    duration: number; // in days
    leaderboard: LeaderboardEntry[];
}

export interface Reward {
    id: string;
    name: string;
    description: string;
    cost: number;
    type: 'wallpaper' | 'audio';
    unlocked: boolean;
    assetUrl: string;
}

// Expanded AppContextType
export interface AppContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  deleteReminder: (reminderId: string) => void;
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'priority' | 'completed'>) => void;
  setTasks: (tasks: Task[]) => void;
  toggleTask: (taskId: string) => void;
  friends: Friend[];
  challenges: Challenge[];
  rewards: Reward[];
  unlockReward: (rewardId: string) => void;
  coins: number;
  isOnline: boolean;
  knowledgeCard: KnowledgeCard | null;
}
// FIX: Centralized Web Speech API types to resolve conflicts.
// These types were previously duplicated across multiple components, causing re-declaration errors.
// Defining them once here provides a single source of truth for the entire application.

// --- Web Speech API Types for global window object ---
export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onstart: () => void;
  onend: () => void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  readonly confidence: number;
  readonly transcript: string;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}
