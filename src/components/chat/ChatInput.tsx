import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  useColorScheme,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts } from '@/constants/theme';

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  onOpenVoice: () => void;
  isStreaming: boolean;
  activeModelName: string;
  onOpenModelSelector: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  onOpenVoice,
  isStreaming,
  activeModelName,
  onOpenModelSelector,
}) => {
  const [text, setText] = useState('');
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const canSend = text.trim().length > 0;

  const handleSend = () => {
    if (!canSend || isStreaming) return;
    const toSend = text;
    setText('');
    onSend(toSend);
  };

  const handleKeyPress = (e: any) => {
    // If on web and user pressed Enter without Shift, send message
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.inputCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.cardBorder,
          },
        ]}>
        {/* Model Tag inside input top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={onOpenModelSelector}
            style={({ pressed }) => [
              styles.modelChip,
              { backgroundColor: theme.backgroundSelected },
              pressed && styles.pressed,
            ]}>
            <Ionicons name="sparkles" size={12} color={theme.primary} />
            <TextInput
              editable={false}
              value={activeModelName}
              style={[styles.modelChipText, { color: theme.textSecondary }]}
            />
            <Ionicons name="chevron-down" size={12} color={theme.textTertiary} />
          </Pressable>
        </View>

        {/* Input Row */}
        <View style={styles.inputRow}>
          {/* Attachment button */}
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            hitSlop={6}>
            <Ionicons name="add-circle-outline" size={24} color={theme.textTertiary} />
          </Pressable>

          <TextInput
            style={[
              styles.textInput,
              {
                color: theme.text,
                fontFamily: Fonts?.sans,
              },
            ]}
            placeholder="Message MortX..."
            placeholderTextColor={theme.textTertiary}
            multiline
            maxLength={4000}
            value={text}
            onChangeText={setText}
            onKeyPress={handleKeyPress}
          />

          {/* Voice button */}
          <Pressable
            onPress={onOpenVoice}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            hitSlop={6}>
            <Ionicons name="mic-outline" size={22} color={theme.textTertiary} />
          </Pressable>

          {/* Send / Stop button */}
          {isStreaming ? (
            <Pressable
              onPress={onStop}
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: theme.danger },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="stop" size={14} color="#FFFFFF" />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor: canSend ? theme.primary : theme.backgroundSelected,
                },
                pressed && canSend && styles.pressed,
              ]}>
              <Ionicons
                name="arrow-up"
                size={18}
                color={canSend ? '#FFFFFF' : theme.textTertiary}
              />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.two,
  },
  inputCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.one,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
    paddingBottom: 2,
  },
  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  modelChipText: {
    fontSize: 11,
    fontWeight: '600',
    padding: 0,
    margin: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 4,
    textAlignVertical: 'center',
  },
  iconBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
