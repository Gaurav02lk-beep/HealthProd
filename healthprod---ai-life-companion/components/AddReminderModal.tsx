import React, { useState } from 'react';
import { Reminder, ActivityType } from '../types';
import Button from './common/Button';

interface AddReminderModalProps {
  onClose: () => void;
  onAddReminder: (reminder: Omit<Reminder, 'id'>) => void;
}

const AddReminderModal: React.FC<AddReminderModalProps> = ({ onClose, onAddReminder }) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [activityType, setActivityType] = useState<ActivityType>(ActivityType.Work);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title for the reminder.');
      return;
    }
    onAddReminder({
      title,
      time,
      activityType,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md m-4 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add New Reminder</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reminderTitle" className="block text-sm font-medium text-gray-300">Title</label>
            <input
              type="text"
              id="reminderTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Drink water"
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          <div>
            <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-300">Time</label>
            <input
              type="time"
              id="reminderTime"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          <div>
            <label htmlFor="activityType" className="block text-sm font-medium text-gray-300">Activity Type</label>
            <select
              id="activityType"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            >
              {Object.values(ActivityType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Add Reminder</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReminderModal;
