import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { CodeBlock } from './CodeBlock';
import { Colors, Fonts, Spacing } from '@/constants/theme';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Parse code blocks first
  const renderElements = () => {
    const elements: React.ReactNode[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;

    let lastIndex = 0;
    let match;
    let keyIdx = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore) {
        elements.push(
          <FormattedText key={`text-${keyIdx++}`} text={textBefore} theme={theme} />
        );
      }

      const language = match[1] || '';
      const code = match[2]?.trimEnd() || '';
      elements.push(
        <CodeBlock key={`code-${keyIdx++}`} language={language} code={code} />
      );

      lastIndex = match.index + match[0].length;
    }

    const remainingText = content.substring(lastIndex);
    if (remainingText) {
      elements.push(
        <FormattedText key={`text-${keyIdx++}`} text={remainingText} theme={theme} />
      );
    }

    return elements;
  };

  return <View style={styles.container}>{renderElements()}</View>;
};

interface FormattedTextProps {
  text: string;
  theme: typeof Colors.light | typeof Colors.dark;
}

const FormattedText: React.FC<FormattedTextProps> = ({ text, theme }) => {
  const lines = text.split('\n');

  return (
    <View style={styles.textContainer}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <View key={idx} style={{ height: 6 }} />;
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <Text key={idx} style={[styles.h3, { color: theme.text }]}>
              {renderInlineStyles(trimmed.slice(4), theme)}
            </Text>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <Text key={idx} style={[styles.h2, { color: theme.text }]}>
              {renderInlineStyles(trimmed.slice(3), theme)}
            </Text>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <Text key={idx} style={[styles.h1, { color: theme.text }]}>
              {renderInlineStyles(trimmed.slice(2), theme)}
            </Text>
          );
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <View
              key={idx}
              style={[
                styles.blockquote,
                { borderLeftColor: theme.primary, backgroundColor: theme.backgroundElement },
              ]}>
              <Text style={[styles.blockquoteText, { color: theme.textSecondary }]}>
                {renderInlineStyles(trimmed.slice(2), theme)}
              </Text>
            </View>
          );
        }

        // Unordered List
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <View key={idx} style={styles.listItem}>
              <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
              <Text style={[styles.listText, { color: theme.text }]}>
                {renderInlineStyles(trimmed.slice(2), theme)}
              </Text>
            </View>
          );
        }

        // Ordered List
        const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (orderedMatch) {
          return (
            <View key={idx} style={styles.listItem}>
              <Text style={[styles.orderedNum, { color: theme.primary }]}>
                {orderedMatch[1]}.
              </Text>
              <Text style={[styles.listText, { color: theme.text }]}>
                {renderInlineStyles(orderedMatch[2], theme)}
              </Text>
            </View>
          );
        }

        // Horizontal rule
        if (trimmed === '---' || trimmed === '***') {
          return (
            <View
              key={idx}
              style={[styles.hr, { backgroundColor: theme.cardBorder }]}
            />
          );
        }

        // Regular Paragraph
        return (
          <Text key={idx} style={[styles.paragraph, { color: theme.text }]}>
            {renderInlineStyles(line, theme)}
          </Text>
        );
      })}
    </View>
  );
};

function renderInlineStyles(
  line: string,
  theme: typeof Colors.light | typeof Colors.dark
): React.ReactNode[] {
  // Regex to split bold (**text**) and inline code (`code`)
  const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={[styles.bold, { color: theme.text }]}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <Text
          key={i}
          style={[
            styles.inlineCode,
            { backgroundColor: theme.backgroundElement, color: theme.primary },
          ]}>
          {` ${part.slice(1, -1)} `}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  textContainer: {
    gap: 4,
  },
  h1: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: Spacing.two,
    marginBottom: 4,
    lineHeight: 28,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.two,
    marginBottom: 4,
    lineHeight: 24,
  },
  h3: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: Spacing.one,
    marginBottom: 2,
    lineHeight: 20,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginVertical: 2,
  },
  bold: {
    fontWeight: '700',
  },
  inlineCode: {
    fontFamily: Fonts?.mono,
    fontSize: 13,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    paddingLeft: Spacing.one,
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    lineHeight: 22,
  },
  orderedNum: {
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
    lineHeight: 22,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    marginVertical: Spacing.one,
    borderRadius: 4,
  },
  blockquoteText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  hr: {
    height: 1,
    marginVertical: Spacing.two,
    width: '100%',
  },
});
