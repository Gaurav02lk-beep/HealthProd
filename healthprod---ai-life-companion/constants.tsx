import React from 'react';
import { ActivityType } from './types';

export const ICONS: { [key in ActivityType]: JSX.Element } = {
  [ActivityType.Sleep]: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 1 0-18c-2.8 0-5.22 1.25-6.84 3.16L12 12Z"/></svg>
  ),
  [ActivityType.Meal]: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M17 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v2"/><path d="M14 12v8a2 2 0 0 0 2 2h.4a2 2 0 0 0 1.6-3.2l-1.6-2.8a2 2 0 0 1 1.6-3.2H20a2 2 0 0 0 2-2V8"/><path d="M4 12v8a2 2 0 0 0 2 2h.4a2 2 0 0 0 1.6-3.2l-1.6-2.8a2 2 0 0 1 1.6-3.2H8a2 2 0 0 0 2-2V8"/></svg>
  ),
  [ActivityType.Study]: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  ),
  [ActivityType.Work]: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M8 8V4.82a2 2 0 0 1 1.18-1.81l4-2.4a2 2 0 0 1 2.82 1.81V8"/></svg>
  ),
    [ActivityType.Exercise]: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.4 2.6 10.6 5.4"/><path d="m10.6 18.6 2.8 2.8"/><path d="M18.6 10.6 21.4 13.4"/><path d="m5.4 10.6 2.8 2.8"/><circle cx="12" cy="12" r="4"/><path d="m18.6 5.4-2.8 2.8"/><path d="m5.4 18.6 2.8-2.8"/><path d="m13.4 21.4-2.8-2.8"/><path d="m2.6 13.4 2.8-2.8"/></svg>
  ),
};

export const ACTIVITY_COLORS: { [key in ActivityType]: { bg: string; text: string; border: string; chart: string; } } = {
  [ActivityType.Sleep]: { bg: 'bg-indigo-500/10', text: 'text-indigo-300', border: 'border-indigo-500', chart: '#6366F1' },
  [ActivityType.Meal]: { bg: 'bg-green-500/10', text: 'text-green-300', border: 'border-green-500', chart: '#22C55E' },
  [ActivityType.Study]: { bg: 'bg-yellow-500/10', text: 'text-yellow-300', border: 'border-yellow-500', chart: '#F59E0B' },
  [ActivityType.Work]: { bg: 'bg-sky-500/10', text: 'text-sky-300', border: 'border-sky-500', chart: '#0EA5E9' },
  [ActivityType.Exercise]: { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500', chart: '#F43F5E' },
};