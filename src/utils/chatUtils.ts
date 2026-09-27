import { Conversation, ChatMessage, MessageRole } from '@/types/chat';
import { DEFAULT_MODEL_ID } from '@/constants/models';

export function createNewConversation(
  customModelId?: string,
  initialTitle?: string
): Conversation {
  const now = Date.now();
  return {
    id: `chat-${now}-${Math.random().toString(36).slice(2, 7)}`,
    title: initialTitle ? initialTitle.slice(0, 32) + '...' : 'New Chat',
    messages: [],
    modelId: customModelId || DEFAULT_MODEL_ID,
    createdAt: now,
    updatedAt: now,
  };
}

export function createChatMessage(
  role: MessageRole,
  content: string,
  modelId?: string,
  isStreaming?: boolean
): ChatMessage {
  const now = Date.now();
  return {
    id: `msg-${role}-${now}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
    timestamp: now,
    modelId,
    isStreaming,
  };
}

export function updateConversationTitle(convo: Conversation, newTitle: string): Conversation {
  return {
    ...convo,
    title: newTitle,
    updatedAt: Date.now(),
  };
}

export function updateConversationMessages(convo: Conversation, messages: ChatMessage[], newTitle?: string): Conversation {
  return {
    ...convo,
    title: newTitle !== undefined ? newTitle : convo.title,
    messages,
    updatedAt: Date.now(),
  };
}

export const FALLBACK_CONVERSATION: Conversation = {
  id: 'default-empty',
  title: 'New Chat',
  messages: [],
  modelId: DEFAULT_MODEL_ID,
  createdAt: 0,
  updatedAt: 0,
};
