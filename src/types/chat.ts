export type MessageRole = 'user' | 'assistant' | 'system';

export interface CodeBlockData {
  language: string;
  code: string;
}

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  modelId?: string;
  reasoningContent?: string;
  reasoningDuration?: number;
  isStreaming?: boolean;
  rating?: 'up' | 'down' | null;
  attachments?: {
    name: string;
    type: string;
    url?: string;
  }[];
  /** Research metadata — present when the AI Research Engine was used */
  researchMeta?: {
    searchesPerformed: number;
    sourcesRead: number;
    evidenceItems: number;
    retrievedAt: string;
    durationMs: number;
    searchQueries?: string[];
    sources?: ResearchSource[];
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  modelId: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  badge?: string;
  icon: string;
  isReasoning?: boolean;
  speed: 'Ultra-Fast' | 'Fast' | 'Thoughtful';
  intelligence: 'Flagship' | 'High' | 'Expert' | 'Fast';
  color: string;
}

export interface AppSettings {
  theme: 'system' | 'dark' | 'light';
  apiKey: string;
  apiProvider: 'builtin' | 'openai' | 'gemini' | 'openrouter';
  systemPrompt: string;
  temperature: number;
  soundEffects: boolean;
  autoScroll: boolean;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Coding' | 'Finance' | 'Writing' | 'Productivity' | 'Learning';
  prompt: string;
  icon: string;
  modelId?: string;
}
