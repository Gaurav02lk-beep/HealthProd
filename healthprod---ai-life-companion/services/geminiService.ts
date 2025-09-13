import { GoogleGenAI, GenerateContentResponse, Chat, Type } from "@google/genai";
import { Activity, DailyReport, KnowledgeCard, Task, TaskPriority } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let chatInstance: Chat | null = null;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

export const getLifestyleInsights = async (activities: Activity[]): Promise<string> => {
  const prompt = `
    As a lifestyle habit coach, analyze the following daily activities and provide personalized, actionable insights and recommendations.
    Focus on patterns in sleep, meals, study, work, and exercise. The tone should be encouraging and helpful.
    Format the output as clean markdown.

    Here are the activities from the last few days:
    ${activities.map(a => `- ${a.type}: ${a.startTime.toLocaleString()} to ${a.endTime.toLocaleString()} (${((a.endTime.getTime() - a.startTime.getTime()) / 3600000).toFixed(1)} hours)`).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error getting lifestyle insights:", error);
    return "Sorry, I couldn't analyze your habits right now. Please try again later.";
  }
};

export const analyzeMealImage = async (imageFile: File): Promise<string> => {
  try {
    const base64Image = await fileToBase64(imageFile);
    const imagePart = {
      inlineData: {
        mimeType: imageFile.type,
        data: base64Image,
      },
    };
    const textPart = {
      text: "Analyze this meal. Estimate the total calories and provide a brief nutritional breakdown (protein, carbs, fats). Present it clearly.",
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing meal image:", error);
    return "Sorry, I couldn't analyze your meal image. Please ensure it's a clear photo and try again.";
  }
};

export type AIPersonality = 'Friendly Coach' | 'Strict Mentor' | 'Funny Motivator' | 'Zen Master' | 'Fitness Guru';

const personalityInstructions = {
    'Friendly Coach': 'You are HealthProd, a friendly, encouraging, and motivational AI life coach. Your goal is to be supportive and provide positive reinforcement. Keep your answers concise, helpful, and full of warmth.',
    'Strict Mentor': 'You are HealthProd, a disciplined and direct AI mentor. Your goal is to provide clear, no-nonsense advice to maximize productivity and efficiency. Be direct, logical, and focused on results. Avoid fluff.',
    'Funny Motivator': 'You are HealthProd, a witty and humorous AI motivator. Your goal is to make self-improvement fun. Use humor, clever analogies, and lighthearted jokes to deliver advice. Keep it playful but still helpful.',
    'Zen Master': 'You are HealthProd, a calm and mindful Zen Master. Your goal is to guide the user towards inner peace, focus, and mindfulness. Use simple, profound language, metaphors from nature, and encourage deep breathing and presence. Your tone is serene and wise.',
    'Fitness Guru': 'You are HealthProd, an energetic and knowledgeable Fitness Guru. Your goal is to motivate the user to be active and healthy. Provide workout tips, nutritional advice, and encouragement. Be enthusiastic, clear, and action-oriented. Use fitness terminology and keep the energy high.',
};

export const startChat = (personality: AIPersonality = 'Friendly Coach') => {
  chatInstance = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: personalityInstructions[personality],
    },
  });
};

export const sendMessageToChat = async (message: string): Promise<string> => {
  if (!chatInstance) {
    startChat();
  }

  try {
    const response: GenerateContentResponse = await chatInstance!.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error sending message to chat:", error);
    return "I'm having a little trouble connecting right now. Let's try again in a moment.";
  }
};

export const generateDailyReport = async (activities: Activity[]): Promise<DailyReport> => {
  const prompt = `
    Analyze the following activities from a single day and generate a comprehensive end-of-day report in JSON format.

    Activities:
    ${activities.map(a => `- ${a.type}: from ${a.startTime.toLocaleTimeString()} to ${a.endTime.toLocaleTimeString()} (${((a.endTime.getTime() - a.startTime.getTime()) / 3600000).toFixed(1)} hours). Notes: ${a.notes || 'N/A'}`).join('\n')}

    The report should include:
    1.  **productivityScore**: A score from 0 to 100 representing overall productivity. High scores for focused work/study, balanced with breaks and exercise. Low scores for too much distraction or imbalance.
    2.  **summary**: A short, encouraging paragraph (2-3 sentences) summarizing the day's accomplishments and patterns.
    3.  **recommendations**: A brief point about one area for potential improvement (e.g., sleep schedule, break frequency).
    4.  **nextDayTodoList**: An array of 3 suggested, actionable to-do items for the next day based on today's activities.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productivityScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            recommendations: { type: Type.STRING },
            nextDayTodoList: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["productivityScore", "summary", "recommendations", "nextDayTodoList"],
        },
      },
    });

    const jsonString = response.text.trim();
    const cleanedJson = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleanedJson) as DailyReport;

  } catch (error) {
    console.error("Error generating daily report:", error);
    return {
      productivityScore: 0,
      summary: "Could not generate report.",
      recommendations: "There was an error communicating with the AI. Please check your connection and try again.",
      nextDayTodoList: ["Try generating the report again later."]
    };
  }
};

export const prioritizeTasks = async (tasks: Omit<Task, 'id' | 'priority' | 'completed'>[]): Promise<Task[]> => {
    const prompt = `
      As an expert productivity assistant, analyze the following list of tasks. For each task, assign a priority level: 'Urgent', 'High', 'Medium', or 'Low'. 
      Base your decision on keywords related to deadlines, importance, and effort. 
      Return the response as a JSON array, where each object has the original 'description' and 'deadline', plus the new 'priority' you assigned.

      Tasks to prioritize:
      ${JSON.stringify(tasks, null, 2)}
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING },
                            deadline: { type: Type.STRING },
                            priority: { type: Type.STRING, enum: ['Urgent', 'High', 'Medium', 'Low'] },
                        },
                        required: ['description', 'priority']
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        const cleanedJson = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        const prioritizedTasks = JSON.parse(cleanedJson) as Omit<Task, 'id' | 'completed'>[];

        // Re-add id and completed status
        return prioritizedTasks.map((pTask, index) => ({
            ...pTask,
            id: Date.now().toString() + index,
            completed: false,
        }));

    } catch (error) {
        console.error("Error prioritizing tasks:", error);
        // Fallback: return original tasks with 'Medium' priority
        return tasks.map((task, index) => ({
            ...task,
            id: Date.now().toString() + index,
            priority: 'Medium',
            completed: false,
        }));
    }
};

export const getDailyKnowledgeCard = async (): Promise<KnowledgeCard> => {
    const prompt = `
    Generate a single, bite-sized piece of content for a user's daily knowledge feed in a productivity app.
    The content should be interesting and actionable.
    Choose one of the following categories: 'Productivity Hack', 'Fun Fact' (related to tech or science), 'Quote' (inspirational), or 'Challenge' (a small, one-day task).
    Return the result as a single JSON object.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING },
                        category: { type: Type.STRING, enum: ['Productivity Hack', 'Fun Fact', 'Quote', 'Challenge'] },
                    },
                    required: ['title', 'content', 'category']
                }
            }
        });
        const jsonString = response.text.trim();
        const cleanedJson = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        return JSON.parse(cleanedJson) as KnowledgeCard;
    } catch (error) {
        console.error("Error getting daily knowledge card:", error);
        return {
            title: "Quick Tip",
            content: "Stay hydrated! Drinking enough water can significantly boost your focus and energy levels throughout the day.",
            category: 'Productivity Hack'
        };
    }
};