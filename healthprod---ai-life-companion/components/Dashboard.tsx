import React, { useContext, useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { AppContext } from '../App';
import Card from './common/Card';
import Insights from './Insights';
import { Activity, ActivityType, DailyReport } from '../types';
import { ICONS, ACTIVITY_COLORS } from '../constants';
import { subDays, format, isSameDay, isToday } from 'date-fns';
import DailyReportModal from './DailyReportModal';
import Button from './common/Button';
import { generateDailyReport } from '../services/geminiService';
import KnowledgeFeed from './KnowledgeFeed';

const calculateStreaks = (activities: any[]) => {
    let streak = 0;
    const today = new Date();
    const uniqueDays = new Set(activities.map(a => format(new Date(a.startTime), 'yyyy-MM-dd')));
    
    for (let i = 0; i < 365; i++) {
        const dateToCheck = subDays(today, i);
        if (uniqueDays.has(format(dateToCheck, 'yyyy-MM-dd'))) {
            streak++;
        } else {
            // Allow for one rest day, but not today
            if (i > 0 && !uniqueDays.has(format(subDays(today, i - 1), 'yyyy-MM-dd'))) {
                 break;
            }
        }
    }
    // If today is not logged, streak should be based on yesterday.
    if (!uniqueDays.has(format(today, 'yyyy-MM-dd'))) {
        streak = 0;
        for (let i = 1; i < 365; i++) {
            const dateToCheck = subDays(today, i);
            if (uniqueDays.has(format(dateToCheck, 'yyyy-MM-dd'))) {
                streak++;
            } else {
                break;
            }
        }
    }
    return streak;
};

const Dashboard: React.FC = () => {
    const { activities, isOnline } = useContext(AppContext);
    const [selectedActivities, setSelectedActivities] = useState<Activity[] | null>(null);
    const [selectedTitle, setSelectedTitle] = useState<string>('');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
    const [isReportLoading, setIsReportLoading] = useState(false);

    const todayActivities = activities.filter(a => isSameDay(new Date(a.startTime), new Date()));
    const totalHoursToday = todayActivities.reduce((acc, curr) => acc + (curr.endTime.getTime() - curr.startTime.getTime()), 0) / 3600000;
    
    const streak = calculateStreaks(activities);

    const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse(), []);

    const processChartData = () => {
        const data = last7Days.map(day => {
            const dayStr = format(day, 'MMM d');
            const dailyActivities = activities.filter(a => isSameDay(new Date(a.startTime), day));
            
            const totals = dailyActivities.reduce((acc, activity) => {
                const duration = (activity.endTime.getTime() - activity.startTime.getTime()) / 3600000; // in hours
                acc[activity.type] = (acc[activity.type] || 0) + duration;
                return acc;
            }, {} as { [key in ActivityType]: number });

            return {
                name: dayStr,
                ...totals
            };
        });
        return data;
    };

    const chartData = processChartData();

    const handleBarClick = (data: any, index: number) => {
        const dayStr = chartData[index].name;
        const newTitle = `Activity Timeline for ${dayStr}`;

        if (selectedTitle === newTitle) {
            setSelectedActivities(null);
            setSelectedTitle('');
            return;
        }

        const targetDate = last7Days[index];
        const targetActivities = activities.filter(activity => 
            isSameDay(new Date(activity.startTime), targetDate)
        );

        if (targetActivities.length > 0) {
            targetActivities.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
            setSelectedActivities(targetActivities);
            setSelectedTitle(newTitle);
        } else {
            setSelectedActivities(null);
            setSelectedTitle('');
        }
    };

    const handleGenerateReport = async () => {
        setIsReportModalOpen(true);
        setIsReportLoading(true);
        setDailyReport(null);

        const todayActivitiesForReport = activities.filter(a => isToday(new Date(a.startTime)));
        if (todayActivitiesForReport.length === 0) {
            setDailyReport({
                productivityScore: 0,
                summary: "No activities logged for today.",
                recommendations: "Log some activities to get a report.",
                nextDayTodoList: ["Log your first activity!"]
            });
            setIsReportLoading(false);
            return;
        }

        const report = await generateDailyReport(todayActivitiesForReport);
        setDailyReport(report);
        setIsReportLoading(false);
    };

    return (
        <div className="space-y-8">
            <KnowledgeFeed />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Card className="flex items-center gap-6">
                    <div className="text-brand-primary p-3 bg-brand-primary/10 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-300">Hours Today</h3>
                        <p className="text-3xl font-extrabold text-white mt-1">{totalHoursToday.toFixed(1)}</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-6">
                    <div className="text-yellow-400 p-3 bg-yellow-400/10 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-300">Activity Streak</h3>
                        <p className="text-3xl font-extrabold text-white mt-1">{streak} <span className="text-xl">days</span></p>
                    </div>
                </Card>
                 <Card className="flex items-center gap-6">
                    <div className="text-brand-secondary p-3 bg-brand-secondary/10 rounded-xl">
                         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19.2 14.8-4.2-4.2 2.2-2.2c.4-.4.4-1 0-1.4l-2-2c-.4-.4-1-.4-1.4 0L11.4 7 7.2 2.8c-.4-.4-1-.4-1.4 0l-2 2c-.4.4-.4 1 0 1.4L6 8.4 2.8 12.6c-.4.4-.4 1 0 1.4l2 2c.4.4 1 .4 1.4 0L8.4 14l4.2 4.2c.4.4 1 .4 1.4 0l2-2c.4-.4.4-1 0-1.4l-2.2-2.2 4.2-4.2c.4-.4 1-.4 1.4 0l2 2c.4.4.4 1 0 1.4Z"/></svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-300">Coins Earned</h3>
                        <p className="text-3xl font-extrabold text-white mt-1">150 💰</p>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                    <div>
                        <h2 className="text-xl font-bold mb-1">Weekly Activity Breakdown</h2>
                        <p className="text-sm text-slate-400">Total hours spent per activity. Click a day to see its timeline.</p>
                    </div>
                    <Button onClick={handleGenerateReport} disabled={isReportLoading || !isOnline} title={!isOnline ? "Unavailable in Offline Mode" : ""}>
                        {isReportLoading ? "Generating..." : "Generate Today's Report"}
                    </Button>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#CBD5E1" />
                            <YAxis stroke="#CBD5E1" />
                            <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '0.75rem' }} />
                            <Legend />
                            <Bar dataKey="Work" stackId="a" fill={ACTIVITY_COLORS.Work.chart} onClick={handleBarClick} cursor="pointer" />
                            <Bar dataKey="Study" stackId="a" fill={ACTIVITY_COLORS.Study.chart} onClick={handleBarClick} cursor="pointer" />
                            <Bar dataKey="Exercise" stackId="a" fill={ACTIVITY_COLORS.Exercise.chart} onClick={handleBarClick} cursor="pointer" />
                            <Bar dataKey="Sleep" stackId="a" fill={ACTIVITY_COLORS.Sleep.chart} onClick={handleBarClick} cursor="pointer" />
                            <Bar dataKey="Meal" stackId="a" fill={ACTIVITY_COLORS.Meal.chart} onClick={handleBarClick} cursor="pointer" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {selectedActivities && (
                <Card>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">{selectedTitle}</h3>
                             <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(
                                    selectedActivities.reduce((acc, activity) => {
                                        const duration = (activity.endTime.getTime() - activity.startTime.getTime()) / 3600000;
                                        acc[activity.type] = (acc[activity.type] || 0) + duration;
                                        return acc;
                                    }, {} as { [key in ActivityType]?: number })
                                ).sort(([, hoursA], [, hoursB]) => hoursB! - hoursA!)
                                .map(([type, hours]) => (
                                    <div key={type} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${ACTIVITY_COLORS[type as ActivityType].bg} ${ACTIVITY_COLORS[type as ActivityType].text}`}>
                                        <span className="w-3 h-3">{ICONS[type as ActivityType]}</span>
                                        <span>{type}: {hours!.toFixed(1)}h</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button 
                            onClick={() => { setSelectedActivities(null); setSelectedTitle(''); }}
                            className="text-slate-400 hover:text-white text-2xl font-bold"
                            aria-label="Close details"
                        >
                            &times;
                        </button>
                    </div>

                    <div className="relative pl-5 py-2 max-h-[500px] overflow-y-auto">
                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-700"></div>
                        {selectedActivities.map((activity, index) => (
                             <div key={activity.id} className="relative mb-8">
                                <div className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-slate-700 border-4 border-slate-800"></div>
                                <div className="pl-8">
                                    <p className="text-sm text-slate-400 font-semibold">{format(activity.startTime, 'h:mm a')} - {format(activity.endTime, 'h:mm a')}</p>
                                    <div className={`mt-2 p-4 rounded-xl border-l-4 ${ACTIVITY_COLORS[activity.type].border} ${ACTIVITY_COLORS[activity.type].bg}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className={`${ACTIVITY_COLORS[activity.type].text}`}>{ICONS[activity.type]}</span>
                                                <p className={`font-bold ${ACTIVITY_COLORS[activity.type].text}`}>{activity.type}</p>
                                            </div>
                                            <span className="font-mono text-sm text-slate-200">
                                                {((activity.endTime.getTime() - activity.startTime.getTime()) / 3600000).toFixed(1)}h
                                            </span>
                                        </div>
                                        {activity.notes && <p className="text-sm text-slate-300 mt-2 pl-9">{activity.notes}</p>}
                                        {activity.attachment && (
                                            <div className="mt-3 pl-9">
                                                <a href={activity.attachment.dataUrl} target="_blank" rel="noopener noreferrer">
                                                    <img src={activity.attachment.dataUrl} alt="Activity attachment" className="max-h-32 rounded-lg border border-slate-600" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <Insights />

            {isReportModalOpen && (
                <DailyReportModal 
                    onClose={() => setIsReportModalOpen(false)}
                    reportData={dailyReport}
                    isLoading={isReportLoading}
                />
            )}
        </div>
    );
};

export default Dashboard;