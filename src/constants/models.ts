import { AIModel } from '@/types/chat';

export const AI_MODELS: AIModel[] = [
  {
    id: 'mortx-4o',
    name: 'MortX 4o',
    description: 'Flagship omnimodal model. Best for all-round tasks, writing, and analysis.',
    badge: 'Popular',
    icon: 'sparkles',
    speed: 'Fast',
    intelligence: 'Flagship',
    color: '#10A37F',
  },
  {
    id: 'mortx-r1',
    name: 'MortX R1 DeepReasoning',
    description: 'Thinks deeply before responding with step-by-step verifiable logic.',
    badge: 'Reasoning',
    icon: 'bulb-outline',
    isReasoning: true,
    speed: 'Thoughtful',
    intelligence: 'Expert',
    color: '#8B5CF6',
  },
  {
    id: 'mortx-flash',
    name: 'MortX Flash',
    description: 'Ultra-fast low latency model for quick questions, edits, and drafting.',
    badge: 'Lightning',
    icon: 'flash-outline',
    speed: 'Ultra-Fast',
    intelligence: 'Fast',
    color: '#F59E0B',
  },
  {
    id: 'mortx-coder',
    name: 'MortX CodeMaster',
    description: 'Specialized for writing clean code, debugging, architecture, and regex.',
    badge: 'Dev',
    icon: 'code-slash-outline',
    speed: 'Fast',
    intelligence: 'Expert',
    color: '#06B6D4',
  },
  {
    id: 'mortx-finance',
    name: 'MortX Finance & Mortgage',
    description: 'Expert in mortgage amortizations, loans, real estate yields, and economics.',
    badge: 'Specialist',
    icon: 'trending-up-outline',
    speed: 'Fast',
    intelligence: 'Expert',
    color: '#10B981',
  },
];

export const DEFAULT_MODEL_ID = 'mortx-4o';
