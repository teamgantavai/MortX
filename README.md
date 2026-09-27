# MortX AI — React Native Mobile & Web Application 🚀

**MortX AI** is a state-of-the-art conversational AI application built with **React Native**, **Expo (SDK 57)**, **Expo Router**, and **TypeScript**, inspired by modern AI interfaces like ChatGPT, Claude, and DeepSeek.

---

## ✨ Features

- **Multi-Model Intelligence Catalog**:
  - ⚡ **MortX 4o**: Flagship omnimodal model for general reasoning, writing, and questions.
  - 🧠 **MortX R1 DeepReasoning**: Chain-of-thought model featuring an expandable *"Thought for a moment"* reasoning block.
  - ⚡ **MortX Flash**: Ultra-fast, low-latency model for snappy answers.
  - 💻 **MortX CodeMaster**: Developer-oriented model producing formatted code blocks with syntax badges and one-tap clipboard copy.
  - 🏡 **MortX Finance & Mortgage**: Specialized domain advisor for loan amortizations, interest calculations, EMI comparisons, and real estate cash-flow analysis.

- **Conversation Management**:
  - Drawer sidebar to create **New Chats**, search conversations, rename, and delete chats.
  - Conversation history automatically persisted using `@react-native-async-storage/async-storage`.

- **Rich Markdown & Code Rendering**:
  - Formatted headings, lists, bold text, inline code snippets, blockquotes, and tables.
  - High-contrast code blocks with language pills and copy-to-clipboard buttons.

- **Interactive Voice Mode Visualizer**:
  - Advanced voice modal with animated pulsing audio sphere, multi-state transitions (Listening, Thinking, Speaking), and live transcript display.

- **Explore & Prompt Hub**:
  - Curated template prompts across **Finance**, **Coding**, **Writing**, **Learning**, and **Productivity**.
  - One-tap prompt launching that immediately opens in the chat interface.

- **Settings & Extensibility**:
  - Built-in smart simulated streaming engine out-of-the-box (no API keys required).
  - Optional support for custom **OpenAI** or **OpenRouter** API keys.
  - Custom system prompt instructions.
  - Full conversation export (JSON) to clipboard.

---

## 🛠️ Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 57) + [React Native](https://reactnative.dev/) (0.86)
- **Language**: TypeScript
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Storage**: `@react-native-async-storage/async-storage`
- **Clipboard**: `expo-clipboard`

---

## 🚀 Running the App

### Start the development server
```bash
npx expo start
```

### Launch directly on target platforms
```bash
# Web browser
npx expo start --web

# Android emulator / connected device
npx expo start --android

# iOS simulator (macOS required)
npx expo start --ios
```

### Typecheck & Lint
```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```
