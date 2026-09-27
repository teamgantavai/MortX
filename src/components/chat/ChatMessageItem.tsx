import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from '@/types/chat';
import { Colors, Spacing } from '@/constants/theme';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AI_MODELS } from '@/constants/models';

interface ChatMessageItemProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  onSpeak?: (text: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onRegenerate,
  onSpeak,
}) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const isUser = message.role === 'user';

  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<'up' | 'down' | null>(message.rating || null);
  const [showReasoning, setShowReasoning] = useState(false);

  const modelInfo = AI_MODELS.find((m) => m.id === message.modelId) || AI_MODELS[0];

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy message:', e);
    }
  };

  const handleRating = (newRating: 'up' | 'down') => {
    setRating(rating === newRating ? null : newRating);
  };

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={[styles.userBubble, { backgroundColor: theme.userBubble }]}>
          <Text style={[styles.userText, { color: theme.userBubbleText }]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: modelInfo.color }]}>
        <Ionicons name="sparkles" size={15} color="#FFFFFF" />
      </View>

      <View style={styles.contentColumn}>
        {/* Model Header */}
        <View style={styles.assistantHeader}>
          <Text style={[styles.modelName, { color: theme.textSecondary }]}>
            {modelInfo.name}
          </Text>
          {modelInfo.badge && (
            <View
              style={[
                styles.badge,
                { backgroundColor: modelInfo.color + '22', borderColor: modelInfo.color },
              ]}>
              <Text style={[styles.badgeText, { color: modelInfo.color }]}>
                {modelInfo.badge}
              </Text>
            </View>
          )}
        </View>

        {/* Deep Reasoning Chain-of-Thought (if present) */}
        {message.reasoningContent ? (
          <View
            style={[
              styles.reasoningBox,
              {
                backgroundColor: theme.reasoningBg,
                borderColor: theme.reasoningBorder,
              },
            ]}>
            <Pressable
              onPress={() => setShowReasoning(!showReasoning)}
              style={styles.reasoningToggle}>
              <View style={styles.reasoningHeaderLeft}>
                <Ionicons name="bulb" size={14} color={theme.reasoningText} />
                <Text style={[styles.reasoningTitle, { color: theme.reasoningText }]}>
                  Thought for a moment
                </Text>
              </View>
              <Ionicons
                name={showReasoning ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={theme.reasoningText}
              />
            </Pressable>
            {showReasoning && (
              <Text style={[styles.reasoningBody, { color: theme.textSecondary }]}>
                {message.reasoningContent}
              </Text>
            )}
          </View>
        ) : null}

        {/* Markdown Content */}
        <View style={styles.markdownWrapper}>
          <MarkdownRenderer content={message.content} />
          {message.isStreaming && (
            <View style={[styles.cursor, { backgroundColor: theme.primary }]} />
          )}
        </View>

        {/* Message Action Bar (Hidden while streaming) */}
        {!message.isStreaming && (
          <View style={styles.actionBar}>
            <Pressable
              onPress={handleCopy}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              hitSlop={6}>
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={15}
                color={copied ? theme.success : theme.textTertiary}
              />
              {copied && (
                <Text style={[styles.copiedLabel, { color: theme.success }]}>
                  Copied
                </Text>
              )}
            </Pressable>

            {onRegenerate && (
              <Pressable
                onPress={onRegenerate}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
                hitSlop={6}>
                <Ionicons name="reload-outline" size={15} color={theme.textTertiary} />
              </Pressable>
            )}

            {onSpeak && (
              <Pressable
                onPress={() => onSpeak(message.content)}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
                hitSlop={6}>
                <Ionicons name="volume-high-outline" size={15} color={theme.textTertiary} />
              </Pressable>
            )}

            <View style={styles.feedbackGroup}>
              <Pressable
                onPress={() => handleRating('up')}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
                hitSlop={6}>
                <Ionicons
                  name={rating === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={14}
                  color={rating === 'up' ? theme.primary : theme.textTertiary}
                />
              </Pressable>
              <Pressable
                onPress={() => handleRating('down')}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
                hitSlop={6}>
                <Ionicons
                  name={rating === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
                  size={14}
                  color={rating === 'down' ? theme.danger : theme.textTertiary}
                />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: Spacing.two,
    paddingLeft: Spacing.four,
  },
  userBubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
  },
  assistantRow: {
    flexDirection: 'row',
    marginVertical: Spacing.two,
    paddingRight: Spacing.two,
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  contentColumn: {
    flex: 1,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modelName: {
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  reasoningBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.two,
    marginVertical: Spacing.one,
  },
  reasoningToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasoningHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reasoningTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  reasoningBody: {
    marginTop: Spacing.one,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  markdownWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  cursor: {
    width: 8,
    height: 16,
    marginLeft: 3,
    borderRadius: 2,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 2,
  },
  copiedLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  feedbackGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginLeft: 'auto',
  },
  pressed: {
    opacity: 0.6,
  },
});
