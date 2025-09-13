import React from 'react';

interface VoiceControlUIProps {
  isListening: boolean;
  transcript: string;
  onToggle: () => void;
}

const VoiceControlUI: React.FC<VoiceControlUIProps> = ({ isListening, transcript, onToggle }) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-2 rounded-full shadow-2xl z-50">
      <button 
        onClick={onToggle}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-red-500' : 'bg-brand-primary'}`}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
        </svg>
      </button>
      <div className="flex flex-col pr-4">
        <p className="text-xs text-gray-400">
            {isListening ? "Say 'Hey AI' followed by a command..." : "Voice control is off. Click mic to start."}
        </p>
        <p className="text-sm font-medium text-gray-100 h-5 truncate">
            {transcript || (isListening ? 'Listening...' : '')}
        </p>
      </div>
    </div>
  );
};

export default VoiceControlUI;