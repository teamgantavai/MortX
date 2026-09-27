import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  useColorScheme,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { AppSettings, Conversation } from '@/types/chat';
import { Colors, Spacing } from '@/constants/theme';

interface SettingsModalProps {
  visible: boolean;
  settings: AppSettings;
  conversations: Conversation[];
  onSaveSettings: (settings: AppSettings) => void;
  onClearAllChats: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  settings,
  conversations,
  onSaveSettings,
  onClearAllChats,
  onClose,
}) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [provider, setProvider] = useState(settings.apiProvider || 'builtin');
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt);
  const [copiedExport, setCopiedExport] = useState(false);

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      apiKey: apiKey.trim(),
      apiProvider: provider,
      systemPrompt,
    });
    onClose();
  };

  const handleExport = async () => {
    try {
      const dataStr = JSON.stringify(conversations, null, 2);
      await Clipboard.setStringAsync(dataStr);
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2500);
    } catch {
      Alert.alert('Export failed', 'Could not copy to clipboard.');
    }
  };

  const handleClearAll = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to permanently delete ALL conversation history?')) {
        onClearAllChats();
        onClose();
      }
    } else {
      Alert.alert(
        'Clear All Chats',
        'Are you sure you want to permanently delete ALL conversation history?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete All',
            style: 'destructive',
            onPress: () => {
              onClearAllChats();
              onClose();
            },
          },
        ]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContent,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
          onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="settings-outline" size={20} color={theme.primary} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* AI Engine & API Key */}
            <Text style={[styles.sectionLabel, { color: theme.primary }]}>
              AI INFERENCE ENGINE
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              MortX includes an ultra-fast smart AI engine out-of-the-box. You can also plug in your own custom OpenAI or OpenRouter key.
            </Text>

            <View style={styles.providerRow}>
              <Pressable
                onPress={() => setProvider('builtin')}
                style={[
                  styles.providerBtn,
                  {
                    backgroundColor:
                      provider === 'builtin'
                        ? theme.backgroundSelected
                        : theme.backgroundElement,
                    borderColor: provider === 'builtin' ? theme.primary : 'transparent',
                  },
                ]}>
                <Ionicons
                  name="hardware-chip-outline"
                  size={16}
                  color={provider === 'builtin' ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.providerBtnText,
                    {
                      color:
                        provider === 'builtin' ? theme.primary : theme.textSecondary,
                    },
                  ]}>
                  Built-in Engine
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setProvider('openai')}
                style={[
                  styles.providerBtn,
                  {
                    backgroundColor:
                      provider === 'openai'
                        ? theme.backgroundSelected
                        : theme.backgroundElement,
                    borderColor: provider === 'openai' ? theme.primary : 'transparent',
                  },
                ]}>
                <Ionicons
                  name="key-outline"
                  size={16}
                  color={provider === 'openai' ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.providerBtnText,
                    {
                      color:
                        provider === 'openai' ? theme.primary : theme.textSecondary,
                    },
                  ]}>
                  OpenAI Key
                </Text>
              </Pressable>
            </View>

            {provider !== 'builtin' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>
                  API Key (sk-...)
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  placeholder="Enter API key..."
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry
                  value={apiKey}
                  onChangeText={setApiKey}
                />
              </View>
            )}

            {/* Custom System Prompt */}
            <View style={styles.spacer} />
            <Text style={[styles.sectionLabel, { color: theme.primary }]}>
              CUSTOM INSTRUCTIONS
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Define how MortX should respond (personality, tone, or specific expertise).
            </Text>
            <TextInput
              style={[
                styles.textAreaField,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.cardBorder,
                },
              ]}
              multiline
              numberOfLines={3}
              value={systemPrompt}
              onChangeText={setSystemPrompt}
            />

            {/* Data & History */}
            <View style={styles.spacer} />
            <Text style={[styles.sectionLabel, { color: theme.primary }]}>
              DATA & CONVERSATIONS
            </Text>

            <Pressable
              onPress={handleExport}
              style={[
                styles.actionRow,
                { backgroundColor: theme.backgroundElement },
              ]}>
              <View style={styles.actionLeft}>
                <Ionicons
                  name="download-outline"
                  size={18}
                  color={theme.textSecondary}
                />
                <Text style={[styles.actionText, { color: theme.text }]}>
                  {copiedExport ? 'Copied JSON to Clipboard!' : 'Export All Chats (JSON)'}
                </Text>
              </View>
              {copiedExport && (
                <Ionicons name="checkmark-circle" size={18} color={theme.success} />
              )}
            </Pressable>

            <Pressable
              onPress={handleClearAll}
              style={[
                styles.actionRow,
                { backgroundColor: theme.backgroundElement, marginTop: Spacing.two },
              ]}>
              <View style={styles.actionLeft}>
                <Ionicons name="trash-outline" size={18} color={theme.danger} />
                <Text style={[styles.actionText, { color: theme.danger }]}>
                  Delete All Chat History
                </Text>
              </View>
            </Pressable>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
            <Pressable
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
              <Text style={styles.saveBtnText}>Save Preferences</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: Spacing.four,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.two,
  },
  providerRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  providerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  providerBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginTop: Spacing.two,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    fontSize: 14,
  },
  textAreaField: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  spacer: {
    height: Spacing.three,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 10,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: 1,
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
