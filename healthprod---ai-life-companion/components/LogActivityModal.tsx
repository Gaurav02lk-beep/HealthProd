import React, { useState, useRef, useEffect } from 'react';
import { Activity, ActivityType, SpeechRecognition, SpeechRecognitionErrorEvent } from '../types';
import Button from './common/Button';
import { ICONS } from '../constants';

const MicIcon: React.FC<{ isRecording: boolean }> = ({ isRecording }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors ${isRecording ? 'text-red-500' : 'text-slate-400'}`}>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="22"></line>
    </svg>
);

interface LogActivityModalProps {
  onClose: () => void;
  onAddActivity: (activity: Omit<Activity, 'id'>) => void;
}

const LogActivityModal: React.FC<LogActivityModalProps> = ({ onClose, onAddActivity }) => {
  const [activityType, setActivityType] = useState<ActivityType>(ActivityType.Work);
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [attachment, setAttachment] = useState<{ dataUrl: string; name: string; type: string; } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setNotes(prev => prev ? `${prev} ${transcript}` : transcript);
      };
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(startTime) >= new Date(endTime)) {
        alert("End time must be after start time.");
        return;
    }
    onAddActivity({
      type: activityType,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notes,
      attachment: attachment || undefined,
    });
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setAttachment({
                dataUrl: reader.result as string,
                name: file.name,
                type: file.type
            });
        };
        reader.readAsDataURL(file);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md m-4 border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Log New Activity</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Activity Type</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.values(ActivityType).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivityType(type)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${activityType === type ? 'border-brand-primary bg-brand-primary/10' : 'border-slate-600 bg-slate-700 hover:border-slate-500'}`}
                >
                  <span className={activityType === type ? 'text-brand-primary' : 'text-slate-300'}>{ICONS[type]}</span>
                  <span className={`mt-1 text-xs font-semibold ${activityType === type ? 'text-white' : 'text-slate-300'}`}>{type}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-slate-300">Start Time</label>
              <input
                type="datetime-local"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-slate-300">End Time</label>
              <input
                type="datetime-local"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-300">Notes (Optional)</label>
            <div className="mt-1 relative">
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary pr-10"
              />
              {recognitionRef.current && (
                <button type="button" onClick={toggleRecording} className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-600" aria-label="Record note">
                    <MicIcon isRecording={isRecording} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Attach Image (Optional)</label>
            <div 
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md cursor-pointer hover:border-brand-primary"
                onClick={() => fileInputRef.current?.click()}
            >
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <div className="space-y-1 text-center">
                    {attachment ? (
                        <div>
                            <img src={attachment.dataUrl} alt="Preview" className="mx-auto h-24 rounded-lg" />
                            <p className="text-xs text-slate-400 mt-2">{attachment.name}</p>
                        </div>
                    ) : (
                        <>
                            <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="text-sm text-slate-500">Click to upload an image</p>
                        </>
                    )}
                </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Log Activity</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogActivityModal;