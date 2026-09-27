import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conversation, AppSettings } from '@/types/chat';
import { DEFAULT_MODEL_ID } from '@/constants/models';

const CONVERSATIONS_KEY = '@mortx_conversations_v1';
const ACTIVE_CONVO_KEY = '@mortx_active_convo_id';
const SETTINGS_KEY = '@mortx_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  apiKey: '',
  apiProvider: 'builtin',
  systemPrompt: 'You are MortX AI, a helpful, intelligent, precise, and polite conversational assistant.',
  temperature: 0.7,
  soundEffects: true,
  autoScroll: true,
};

export const INITIAL_CONVERSATION: Conversation = {
  id: 'welcome-chat',
  title: 'Welcome to MortX AI 🚀',
  modelId: DEFAULT_MODEL_ID,
  createdAt: Date.now() - 3600000,
  updatedAt: Date.now() - 3600000,
  isPinned: true,
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Hey MortX! What can you help me with today?',
      timestamp: Date.now() - 3550000,
    },
    {
      id: 'msg-2',
      role: 'assistant',
      modelId: DEFAULT_MODEL_ID,
      timestamp: Date.now() - 3500000,
      content: `Hello! 👋 I am **MortX AI**, your next-generation conversational assistant.

Here is a glimpse of what we can do together:

- 💻 **Software & Coding**: Write, refactor, explain, or debug code in any language (TypeScript, Python, Rust, Go, SQL).
- 🧠 **Deep Reasoning**: Solve complex logic puzzles, math equations, and architectural decisions step-by-step.
- 🏡 **Mortgage & Financial Calculations**: Calculate loan amortizations, interest savings, EMI breakdowns, and real estate cash flow.
- ✍️ **Writing & Creative Thinking**: Draft emails, blog posts, essays, and brainstorm business ideas.
- ⚡ **Lightning Fast Responses**: Switch models anytime using the top model picker!

Feel free to try asking me anything or tap one of the suggested prompts below!`,
    },
  ],
};

export async function loadConversations(): Promise<Conversation[]> {
  try {
    const raw = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) {
      await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify([INITIAL_CONVERSATION]));
      return [INITIAL_CONVERSATION];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [INITIAL_CONVERSATION];
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load conversations from storage:', err);
    return [INITIAL_CONVERSATION];
  }
}

export async function saveConversations(conversations: Conversation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save conversations to storage:', err);
  }
}

export async function loadActiveConversationId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_CONVO_KEY);
  } catch {
    return null;
  }
}

export async function saveActiveConversationId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_CONVO_KEY, id);
  } catch (err) {
    console.error('Failed to save active conversation id:', err);
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}
