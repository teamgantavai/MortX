import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PROMPT_TEMPLATES } from '@/constants/prompts';
import { AI_MODELS } from '@/constants/models';
import { loadConversations, saveConversations, saveActiveConversationId } from '@/services/storage';
import { createNewConversation, createChatMessage } from '@/utils/chatUtils';
import { Colors, Spacing, MaxContentWidth, Fonts } from '@/constants/theme';

const CATEGORIES = ['All', 'Finance', 'Coding', 'Writing', 'Learning', 'Productivity'];

export default function ExploreScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPrompts = PROMPT_TEMPLATES.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleLaunchPrompt = async (promptText: string, modelId?: string) => {
    const convos = await loadConversations();
    const newConvo = createNewConversation(modelId || 'mortx-4o', promptText);
    newConvo.messages = [createChatMessage('user', promptText)];

    const updated = [newConvo, ...convos];
    await saveConversations(updated);
    await saveActiveConversationId(newConvo.id);

    // Route to Chat Tab
    router.push('/');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.maxWidthWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="compass" size={13} color={theme.primary} />
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  PROMPT & CAPABILITY HUB
                </Text>
              </View>
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Explore MortX</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Discover curated prompts, specialized mortgage analyzers, coding accelerators, and reasoning models.
            </Text>
          </View>

          {/* Search Box */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.cardBorder,
              },
            ]}>
            <Ionicons name="search-outline" size={18} color={theme.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search prompts and templates..."
              placeholderTextColor={theme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
              </Pressable>
            ) : null}
          </View>

          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : theme.backgroundElement,
                      borderColor: isSelected ? theme.primary : theme.cardBorder,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.catChipText,
                      { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                    ]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Model Showcase Banner */}
          <View style={styles.modelSection}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Intelligence Engines
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modelScroll}>
              {AI_MODELS.map((model) => (
                <View
                  key={model.id}
                  style={[
                    styles.modelMiniCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <View
                    style={[
                      styles.modelMiniIcon,
                      { backgroundColor: model.color + '22' },
                    ]}>
                    <Ionicons
                      name={model.icon as any}
                      size={20}
                      color={model.color}
                    />
                  </View>
                  <Text style={[styles.modelMiniName, { color: theme.text }]}>
                    {model.name}
                  </Text>
                  <Text
                    style={[styles.modelMiniDesc, { color: theme.textSecondary }]}
                    numberOfLines={2}>
                    {model.description}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Prompts Grid */}
          <Text style={[styles.sectionHeading, { color: theme.text, marginTop: Spacing.four }]}>
            Recommended Prompts ({filteredPrompts.length})
          </Text>

          <View style={styles.promptGrid}>
            {filteredPrompts.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleLaunchPrompt(item.prompt, item.modelId)}
                style={({ pressed }) => [
                  styles.promptCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                  pressed && styles.pressed,
                ]}>
                <View style={styles.promptCardHeader}>
                  <View
                    style={[
                      styles.promptIconCircle,
                      { backgroundColor: theme.primary + '18' },
                    ]}>
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={theme.primary}
                    />
                  </View>
                  <View
                    style={[
                      styles.catBadge,
                      { backgroundColor: theme.backgroundElement },
                    ]}>
                    <Text style={[styles.catBadgeText, { color: theme.textSecondary }]}>
                      {item.category}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.promptTitle, { color: theme.text }]}>
                  {item.title}
                </Text>
                <Text
                  style={[styles.promptDesc, { color: theme.textSecondary }]}
                  numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.promptFooter}>
                  <Text style={[styles.tryText, { color: theme.primary }]}>
                    Launch in Chat
                  </Text>
                  <Ionicons
                    name="arrow-forward-outline"
                    size={15}
                    color={theme.primary}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.six + 40,
  },
  maxWidthWrapper: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  header: {
    paddingVertical: Spacing.three,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: Spacing.one,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: Fonts?.sans,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: Spacing.one,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modelSection: {
    marginTop: Spacing.four,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  modelScroll: {
    gap: Spacing.two,
  },
  modelMiniCard: {
    width: 170,
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
  },
  modelMiniIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modelMiniName: {
    fontSize: 14,
    fontWeight: '700',
  },
  modelMiniDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  promptCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 150,
  },
  promptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promptIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  promptDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.two,
  },
  promptFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
  },
  tryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
