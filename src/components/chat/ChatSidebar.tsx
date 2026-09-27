import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation } from '@/types/chat';
import { Colors, Spacing } from '@/constants/theme';

interface ChatSidebarProps {
  visible: boolean;
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  visible,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenSettings,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (convo: Conversation) => {
    setRenamingId(convo.id);
    setRenameText(convo.title);
  };

  const handleSaveRename = (id: string) => {
    if (renameText.trim()) {
      onRenameConversation(id, renameText.trim());
    }
    setRenamingId(null);
  };

  const confirmDelete = (id: string, title: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${title}"?`)) {
        onDeleteConversation(id);
      }
    } else {
      Alert.alert('Delete Chat', `Are you sure you want to delete "${title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteConversation(id) },
      ]);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.drawerContent,
            {
              backgroundColor: theme.background,
              borderColor: theme.cardBorder,
            },
          ]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
            <View style={styles.brandRow}>
              <View style={[styles.brandIcon, { backgroundColor: theme.primary }]}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.brandTitle, { color: theme.text }]}>MortX AI</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              hitSlop={8}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* New Chat Button */}
          <View style={styles.buttonWrapper}>
            <Pressable
              onPress={() => {
                onNewChat();
                onClose();
              }}
              style={({ pressed }) => [
                styles.newChatBtn,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="add" size={18} color={theme.primary} />
              <Text style={[styles.newChatText, { color: theme.text }]}>
                New Chat
              </Text>
            </Pressable>
          </View>

          {/* Search bar */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.cardBorder,
              },
            ]}>
            <Ionicons name="search-outline" size={16} color={theme.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search chats..."
              placeholderTextColor={theme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <Ionicons name="close-circle" size={16} color={theme.textTertiary} />
              </Pressable>
            ) : null}
          </View>

          {/* Chat History List */}
          <ScrollView
            style={styles.historyList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Spacing.four }}>
            <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
              Recent Conversations ({filteredConversations.length})
            </Text>

            {filteredConversations.map((convo) => {
              const isActive = convo.id === activeConversationId;
              const isEditing = renamingId === convo.id;

              return (
                <View
                  key={convo.id}
                  style={[
                    styles.convoItem,
                    {
                      backgroundColor: isActive
                        ? theme.backgroundSelected
                        : 'transparent',
                    },
                  ]}>
                  {isEditing ? (
                    <View style={styles.renameRow}>
                      <TextInput
                        style={[
                          styles.renameInput,
                          {
                            color: theme.text,
                            borderColor: theme.primary,
                            backgroundColor: theme.backgroundElement,
                          },
                        ]}
                        value={renameText}
                        onChangeText={setRenameText}
                        autoFocus
                      />
                      <Pressable
                        onPress={() => handleSaveRename(convo.id)}
                        hitSlop={6}
                        style={styles.actionIcon}>
                        <Ionicons name="checkmark" size={16} color={theme.primary} />
                      </Pressable>
                      <Pressable
                        onPress={() => setRenamingId(null)}
                        hitSlop={6}
                        style={styles.actionIcon}>
                        <Ionicons name="close" size={16} color={theme.textTertiary} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.convoContent}
                      onPress={() => {
                        onSelectConversation(convo.id);
                        onClose();
                      }}>
                      <Ionicons
                        name={convo.isPinned ? 'pin' : 'chatbubble-outline'}
                        size={16}
                        color={isActive ? theme.primary : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.convoTitle,
                          {
                            color: isActive ? theme.text : theme.textSecondary,
                            fontWeight: isActive ? '600' : '400',
                          },
                        ]}
                        numberOfLines={1}>
                        {convo.title}
                      </Text>

                      {/* Action buttons */}
                      <View style={styles.itemActions}>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            handleStartRename(convo);
                          }}
                          hitSlop={6}
                          style={styles.actionIcon}>
                          <Ionicons
                            name="pencil-outline"
                            size={14}
                            color={theme.textTertiary}
                          />
                        </Pressable>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            confirmDelete(convo.id, convo.title);
                          }}
                          hitSlop={6}
                          style={styles.actionIcon}>
                          <Ionicons
                            name="trash-outline"
                            size={14}
                            color={theme.danger}
                          />
                        </Pressable>
                      </View>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Footer Settings */}
          <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
            <Pressable
              onPress={() => {
                onClose();
                onOpenSettings();
              }}
              style={({ pressed }) => [
                styles.settingsBtn,
                pressed && styles.pressed,
              ]}>
              <Ionicons name="settings-outline" size={18} color={theme.text} />
              <Text style={[styles.settingsText, { color: theme.text }]}>
                Settings & API Keys
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContent: {
    width: '80%',
    maxWidth: 320,
    height: '100%',
    borderRightWidth: 1,
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  iconBtn: {
    padding: 4,
  },
  buttonWrapper: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  newChatText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.three,
    marginVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  historyList: {
    flex: 1,
    paddingHorizontal: Spacing.two,
    marginTop: Spacing.one,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  convoItem: {
    borderRadius: 8,
    marginVertical: 2,
  },
  convoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.two,
    gap: 10,
  },
  convoTitle: {
    flex: 1,
    fontSize: 13,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    padding: 2,
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    gap: 6,
  },
  renameInput: {
    flex: 1,
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: 1,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  settingsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.7,
  },
});
