import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import Card from './common/Card';
import Button from './common/Button';
import { Task, TaskPriority } from '../types';
import { prioritizeTasks } from '../services/geminiService';
import Spinner from './common/Spinner';

const priorityConfig: { [key in TaskPriority]: { color: string, label: string } } = {
    Urgent: { color: 'bg-rose-500/20 text-rose-300', label: 'Urgent' },
    High: { color: 'bg-orange-500/20 text-orange-300', label: 'High' },
    Medium: { color: 'bg-yellow-500/20 text-yellow-300', label: 'Medium' },
    Low: { color: 'bg-green-500/20 text-green-300', label: 'Low' },
};

const Tasks: React.FC = () => {
    const { tasks, addTask, setTasks, toggleTask, isOnline } = useContext(AppContext);
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim()) {
            addTask({ description, deadline });
            setDescription('');
            setDeadline('');
        }
    };

    const handlePrioritize = async () => {
        if(tasks.filter(t => !t.completed).length === 0 || !isOnline) return;

        setIsLoading(true);
        const uncompletedTasks = tasks.filter(t => !t.completed).map(({id, completed, priority, ...rest}) => rest);
        const prioritized = await prioritizeTasks(uncompletedTasks);
        
        const completedTasks = tasks.filter(t => t.completed);
        setTasks([...prioritized, ...completedTasks]);

        setIsLoading(false);
    };

    const sortedTasks = [...tasks].sort((a, b) => {
        if(a.completed !== b.completed) return a.completed ? 1 : -1;
        const priorityOrder: TaskPriority[] = ['Urgent', 'High', 'Medium', 'Low'];
        return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
    });

    return (
        <div className="space-y-6">
            <Card>
                <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-4 mb-6 pb-6 border-b border-slate-700">
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Finish the project proposal"
                        className="flex-grow bg-slate-700 border-slate-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        required
                    />
                    <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="bg-slate-700 border-slate-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <Button type="submit" className="flex-shrink-0">Add Task</Button>
                </form>

                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h2 className="text-xl font-bold">Your Tasks</h2>
                    <Button 
                        onClick={handlePrioritize} 
                        disabled={isLoading || tasks.filter(t => !t.completed).length === 0 || !isOnline}
                        title={!isOnline ? "AI Prioritization is unavailable in Offline Mode" : ""}
                    >
                        {isLoading ? <div className="flex items-center gap-2"><Spinner className="w-5 h-5" /> Prioritizing...</div> : 'Prioritize with AI ✨'}
                    </Button>
                </div>
                <ul className="space-y-3">
                    {sortedTasks.length > 0 ? sortedTasks.map(task => (
                        <li key={task.id} className={`flex items-center justify-between p-3 rounded-lg transition-opacity ${task.completed ? 'bg-slate-800 opacity-60' : 'bg-slate-700/50'}`}>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={task.completed} 
                                    onChange={() => toggleTask(task.id)}
                                    className="h-5 w-5 rounded bg-slate-600 border-slate-500 text-brand-primary focus:ring-brand-primary"
                                />
                                <div>
                                    <p className={`font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>{task.description}</p>
                                    {task.deadline && <p className="text-xs text-slate-400">Due: {task.deadline}</p>}
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full ${priorityConfig[task.priority].color}`}>
                                {priorityConfig[task.priority].label}
                            </div>
                        </li>
                    )) : (
                        <p className="text-center text-slate-500 py-8">Your to-do list is empty. Add a task to get started!</p>
                    )}
                </ul>
            </Card>
        </div>
    );
};

export default Tasks;