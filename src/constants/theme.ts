import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    background: '#FFFFFF',
    backgroundElement: '#F3F4F6',
    backgroundSelected: '#E5E7EB',
    card: '#F9FAFB',
    cardBorder: '#E5E7EB',
    primary: '#10A37F',
    primaryText: '#FFFFFF',
    accent: '#8B5CF6',
    userBubble: '#E5E7EB',
    userBubbleText: '#111827',
    aiBubble: '#F9FAFB',
    aiBubbleText: '#1F2937',
    codeBg: '#1E293B',
    codeText: '#F1F5F9',
    reasoningBg: '#F5F3FF',
    reasoningBorder: '#DDD6FE',
    reasoningText: '#6D28D9',
    danger: '#EF4444',
    success: '#10B981',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    background: '#090A0F',
    backgroundElement: '#161822',
    backgroundSelected: '#232738',
    card: '#12141D',
    cardBorder: '#1F2333',
    primary: '#10A37F',
    primaryText: '#FFFFFF',
    accent: '#8B5CF6',
    userBubble: '#232738',
    userBubbleText: '#F9FAFB',
    aiBubble: '#12141D',
    aiBubbleText: '#E5E7EB',
    codeBg: '#090B10',
    codeText: '#E2E8F0',
    reasoningBg: '#1B142E',
    reasoningBorder: '#4C1D95',
    reasoningText: '#C4B5FD',
    danger: '#EF4444',
    success: '#10B981',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    rounded: 'ui-rounded, "Quicksand", sans-serif',
    mono: 'ui-monospace, "SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 840;
