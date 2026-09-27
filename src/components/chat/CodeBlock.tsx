import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Fonts } from '@/constants/theme';

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy code:', e);
    }
  };

  const displayLang = language ? language.toLowerCase() : 'code';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.langBadge}>
          <Ionicons name="code-outline" size={14} color="#94A3B8" />
          <Text style={styles.langText}>{displayLang}</Text>
        </View>
        <Pressable
          onPress={handleCopy}
          style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
          hitSlop={8}>
          <Ionicons
            name={copied ? 'checkmark-outline' : 'copy-outline'}
            size={14}
            color={copied ? '#10B981' : '#94A3B8'}
          />
          <Text style={[styles.copyText, copied && styles.copiedText]}>
            {copied ? 'Copied!' : 'Copy code'}
          </Text>
        </Pressable>
      </View>
      <View style={styles.codeContainer}>
        <Text selectable style={styles.codeText}>
          {code}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.two,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontFamily: Fonts?.mono,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  copyText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  copiedText: {
    color: '#10B981',
  },
  pressed: {
    opacity: 0.7,
  },
  codeContainer: {
    padding: Spacing.three,
  },
  codeText: {
    color: '#E2E8F0',
    fontFamily: Fonts?.mono,
    fontSize: 13,
    lineHeight: 20,
  },
});
