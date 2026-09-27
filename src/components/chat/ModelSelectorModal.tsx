import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AI_MODELS } from '@/constants/models';
import { AIModel } from '@/types/chat';
import { Colors, Spacing } from '@/constants/theme';

interface ModelSelectorModalProps {
  visible: boolean;
  activeModelId: string;
  onSelectModel: (model: AIModel) => void;
  onClose: () => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  visible,
  activeModelId,
  onSelectModel,
  onClose,
}) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

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
            <View>
              <Text style={[styles.title, { color: theme.text }]}>
                Choose AI Model
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Switch intelligence engine for this chat
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              hitSlop={8}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Model Options List */}
          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {AI_MODELS.map((model) => {
              const isSelected = model.id === activeModelId;
              return (
                <Pressable
                  key={model.id}
                  onPress={() => {
                    onSelectModel(model);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.modelCard,
                    {
                      backgroundColor: isSelected
                        ? theme.backgroundSelected
                        : theme.backgroundElement,
                      borderColor: isSelected ? model.color : 'transparent',
                    },
                    pressed && styles.pressed,
                  ]}>
                  {/* Icon */}
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: model.color + '25' },
                    ]}>
                    <Ionicons
                      name={model.icon as any}
                      size={20}
                      color={model.color}
                    />
                  </View>

                  {/* Info */}
                  <View style={styles.modelInfo}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.modelName, { color: theme.text }]}>
                        {model.name}
                      </Text>
                      {model.badge && (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: model.color + '22',
                              borderColor: model.color,
                            },
                          ]}>
                          <Text style={[styles.badgeText, { color: model.color }]}>
                            {model.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.description, { color: theme.textSecondary }]}
                      numberOfLines={2}>
                      {model.description}
                    </Text>

                    {/* Tags */}
                    <View style={styles.tagRow}>
                      <View style={styles.tag}>
                        <Ionicons
                          name="speedometer-outline"
                          size={11}
                          color={theme.textTertiary}
                        />
                        <Text style={[styles.tagText, { color: theme.textTertiary }]}>
                          {model.speed}
                        </Text>
                      </View>
                      <View style={styles.tag}>
                        <Ionicons
                          name="hardware-chip-outline"
                          size={11}
                          color={theme.textTertiary}
                        />
                        <Text style={[styles.tagText, { color: theme.textTertiary }]}>
                          {model.intelligence}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={model.color}
                      style={styles.checkmark}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
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
    maxWidth: 500,
    maxHeight: '85%',
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
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  scrollList: {
    padding: Spacing.three,
  },
  modelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: Spacing.two,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  modelInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelName: {
    fontSize: 15,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: 11,
  },
  checkmark: {
    marginLeft: Spacing.two,
  },
  pressed: {
    opacity: 0.75,
  },
});
