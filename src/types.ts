export type JournalMood =
  | 'Calm'
  | 'Energized'
  | 'Focused'
  | 'Thoughtful'
  | 'Anxious'
  | 'Inspired'
  | 'Tired'
  | 'Grateful'
  | 'Motivated'
  | 'Overwhelmed';

export type JournalCategory =
  | 'Personal Reflection'
  | 'Deep Work & Productivity'
  | 'Brainstorming & Ideas'
  | 'Mindfulness & Gratitude'
  | 'Problem Solving'
  | 'Career & Goals'
  | 'Free Flow';

export interface JournalMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string; // ISO string
  intent?: 'journal' | 'question' | 'brainstorm' | 'reframe' | 'action_plan' | 'system';
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  category: JournalCategory;
  mood?: JournalMood;
  summary?: string;
  keyInsights?: string[];
  actionItems?: string[];
  tags?: string[];
  messages: JournalMessage[];
  createdAt: string; // ISO string for client state, Firestore Timestamp for server
  updatedAt: string; // ISO string
  pinned?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
}

export interface ReflectionAnalysis {
  summary: string;
  keyInsights: string[];
  actionItems: string[];
  detectedMood?: string;
  suggestedTags: string[];
  encouragement?: string;
}

export interface GeminiReflectResponse {
  success: boolean;
  reply: string;
  suggestedFollowUps?: string[];
  modelUsed?: string;
  analysis?: ReflectionAnalysis;
  error?: string;
}

export interface GeminiSummarizeResponse {
  success: boolean;
  analysis: ReflectionAnalysis;
  modelUsed?: string;
  error?: string;
}
