import React, { useState, useEffect, useRef } from 'react';
// FIX: Import SpeechRecognition types from `types.ts` to resolve 'cannot find name' errors.
import { ChatMessage, SpeechRecognition, SpeechRecognitionErrorEvent } from '../types';
import { startChat, sendMessageToChat, AIPersonality } from '../services/geminiService';
import Button from './common/Button';
import Spinner from './common/Spinner';

// FIX: Removed local SpeechRecognition type declarations.
// The types have been centralized in `types.ts` to prevent conflicts and ensure consistency.

const AnimatedAvatar: React.FC<{ isLoading: boolean }> = ({ isLoading }) => (
    <div className="w-10 h-10 rounded-full bg-brand-secondary flex-shrink-0 flex items-center justify-center">
        <style>
            {`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
                @keyframes thinking {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .pulse-idle { animation: pulse 3s infinite ease-in-out; }
                .pulse-thinking { animation: thinking 0.5s infinite ease-in-out; }
            `}
        </style>
        <div className={`w-6 h-6 rounded-full bg-purple-300 ${isLoading ? 'pulse-thinking' : 'pulse-idle'}`}></div>
    </div>
);

const MicIcon: React.FC<{ isRecording: boolean }> = ({ isRecording }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors ${isRecording ? 'text-red-500' : 'text-gray-300'}`}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="22"></line>
  </svg>
);


const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [personality, setPersonality] = useState<AIPersonality>('Friendly Coach');

  const initialMessages: { [key in AIPersonality]: string } = {
    'Friendly Coach': "Hello! I'm HealthProd, your friendly AI companion. I'm here to cheer you on! What can I help you with today?",
    'Strict Mentor': "Greetings. I am HealthProd, your mentor for peak performance. State your objective.",
    'Funny Motivator': "Hey there, superstar! HealthProd here, ready to turn your 'ugh' into 'aha!'. What epic quest are we conquering first?",
    'Zen Master': "Breathe in, breathe out. I am HealthProd, a guide on your path to stillness. The present moment holds all you seek. How can I help you find your center today?",
    'Fitness Guru': "Let's get moving! I'm HealthProd, your personal Fitness Guru, here to help you crush your goals. Ready to sweat and feel amazing? What's the plan, champ?",
  };

  const initializeChat = (persona: AIPersonality) => {
    startChat(persona);
    setMessages([{ id: '1', role: 'model', text: initialMessages[persona] }]);
  };

  useEffect(() => {
    initializeChat(personality);

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handlePersonalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPersonality = e.target.value as AIPersonality;
    setPersonality(newPersonality);
    initializeChat(newPersonality);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const responseText = await sendMessageToChat(input);
    const modelMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
    setMessages(prev => [...prev, modelMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
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
    <div className="h-[calc(100vh-150px)] flex flex-col">
      <header className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white sr-only">AI Companion Chat</h1>
            <p className="text-lg text-gray-300 mt-1 sr-only">Your personal assistant for a better lifestyle.</p>
          </div>
          <div className="relative">
              <label htmlFor="personality" className="text-sm font-medium text-gray-400 absolute -top-5 right-1">AI Personality</label>
              <select
                id="personality"
                value={personality}
                onChange={handlePersonalityChange}
                className="bg-gray-700 border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                  <option>Friendly Coach</option>
                  <option>Strict Mentor</option>
                  <option>Funny Motivator</option>
                  <option>Zen Master</option>
                  <option>Fitness Guru</option>
              </select>
          </div>
      </header>
      <div className="flex-grow bg-gray-800 border border-gray-700 rounded-2xl p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && <AnimatedAvatar isLoading={false} />}
            <div className={`max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-gray-700 text-gray-100 rounded-bl-none'}`}>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex items-end gap-3 justify-start">
             <AnimatedAvatar isLoading={true} />
             <div className="max-w-lg p-3 rounded-2xl bg-gray-700 text-gray-100 rounded-bl-none">
                <Spinner className="h-5 w-5 border-gray-300" />
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask for a healthy recipe..."
          className="flex-grow bg-gray-700 border-gray-600 rounded-lg shadow-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          disabled={isLoading}
        />
        {isSpeechSupported && (
            <Button
              variant="secondary"
              onClick={toggleRecording}
              disabled={isLoading}
              className="p-2"
              aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              <MicIcon isRecording={isRecording} />
            </Button>
        )}
        <Button onClick={handleSend} disabled={isLoading || input.trim() === ''}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default Chatbot;