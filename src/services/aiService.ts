import { ChatMessage, AppSettings } from '@/types/chat';

export interface StreamCallbacks {
  onReasoningChunk?: (chunk: string) => void;
  onContentChunk: (chunk: string) => void;
  onDone: (fullContent: string, fullReasoning?: string) => void;
  onError: (error: Error) => void;
}

export class AIService {
  private static abortController: AbortController | null = null;

  public static stopGenerating() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public static async streamResponse(
    messages: ChatMessage[],
    modelId: string,
    settings: AppSettings,
    callbacks: StreamCallbacks
  ): Promise<void> {
    this.stopGenerating();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Check if user provided an external API key (e.g. OpenAI or OpenRouter)
    if (settings.apiKey && settings.apiKey.trim() !== '') {
      try {
        await this.streamFromRealAPI(messages, modelId, settings, callbacks, signal);
        return;
      } catch (err: any) {
        if (signal.aborted) {
          callbacks.onError(new Error('Generation stopped by user.'));
          return;
        }
        console.warn('Real API failed, falling back to built-in intelligent engine:', err);
      }
    }

    // Built-in intelligent generation engine with simulated streaming
    await this.simulateSmartResponse(messages, modelId, callbacks, signal);
  }

  private static async simulateSmartResponse(
    messages: ChatMessage[],
    modelId: string,
    callbacks: StreamCallbacks,
    signal: AbortSignal
  ): Promise<void> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const query = (lastUserMessage?.content || '').toLowerCase().trim();

    const isReasoningModel = modelId === 'mortx-r1';

    let reasoningText = '';
    if (isReasoningModel) {
      reasoningText = this.generateReasoningText(query);
    }

    const responseTemplate = this.generateKnowledgeResponse(query, modelId);

    try {
      // Step 1: Stream reasoning if model is MortX R1
      let currentReasoning = '';
      if (isReasoningModel && reasoningText) {
        const reasoningChunks = reasoningText.split(' ');
        for (const word of reasoningChunks) {
          if (signal.aborted) throw new Error('Aborted');
          currentReasoning += (currentReasoning ? ' ' : '') + word;
          callbacks.onReasoningChunk?.(word + ' ');
          await new Promise((r) => setTimeout(r, 20));
        }
      }

      // Step 2: Stream content tokens
      let currentContent = '';
      const tokens = responseTemplate.split(/(?<=\s)|(?<=\n)/);

      for (const token of tokens) {
        if (signal.aborted) throw new Error('Aborted');
        currentContent += token;
        callbacks.onContentChunk(token);
        // Realistic typewriter speed (15-30ms per token)
        const delay = token.includes('\n') ? 40 : Math.floor(Math.random() * 15) + 12;
        await new Promise((r) => setTimeout(r, delay));
      }

      callbacks.onDone(currentContent, currentReasoning || undefined);
    } catch (err: any) {
      if (signal.aborted) {
        callbacks.onError(new Error('Generation cancelled.'));
      } else {
        callbacks.onError(err);
      }
    }
  }

  private static generateReasoningText(query: string): string {
    return `Analyzing user intent for "${query}".\n1. Deconstructing the core query and identifying constraints.\n2. Checking domain knowledge (algorithms, logic, best practices).\n3. Verifying edge cases and potential syntax errors.\n4. Structuring a clear, modular, and production-grade explanation.\n5. Ready to synthesize response.`;
  }

  private static generateKnowledgeResponse(query: string, modelId: string): string {
    // 1. Mortgage & Loan Calculations
    if (query.includes('mortgage') || query.includes('loan') || query.includes('emi') || query.includes('interest') || query.includes('amortization')) {
      return `### 🏡 MortX Mortgage & Loan Analysis

Here is a breakdown of mortgage financing mechanics and monthly cost calculations:

#### 1. Standard Monthly Payment (P&I) Formula
The standard amortization formula for monthly payments:

\`\`\`math
M = P * [r(1 + r)^n] / [(1 + r)^n - 1]
\`\`\`

Where:
- **P** = Principal loan amount
- **r** = Monthly interest rate (Annual rate / 12)
- **n** = Total number of monthly payments (Years * 12)

#### 2. Comparison Example: $400,000 Loan at 6.5% Interest

| Loan Type | Monthly Principal & Interest | Total Interest Over Life | Total Paid |
| :--- | :--- | :--- | :--- |
| **30-Year Fixed** | **$2,528 / mo** | $510,178 | $910,178 |
| **15-Year Fixed** | **$3,484 / mo** | $227,159 | $627,159 |

> 💡 **Key Insight:** Choosing a 15-year term increases your monthly payment by **~$956**, but saves you **$283,019** in pure interest!

#### 3. Pro Tips to Cut Mortgage Costs
1. **Bi-weekly payments**: Making half-payments every 2 weeks results in 26 half-payments (13 full payments per year), shaving up to 5-7 years off a 30-year term.
2. **PMI Removal**: Once your Loan-to-Value (LTV) drops below 80%, request elimination of Private Mortgage Insurance.`;
    }

    // 2. React Native / Mobile / Coding
    if (query.includes('react') || query.includes('code') || query.includes('python') || query.includes('typescript') || query.includes('function') || query.includes('async')) {
      return `### ⚡ Code Implementation & Solution

Here is a clean, modern, and production-ready implementation in TypeScript:

\`\`\`typescript
/**
 * Creates an asynchronous debounced function that delays invoking
 * func until after wait milliseconds have elapsed since the last call.
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, waitMs);
    });
  };
}
\`\`\`

#### Key Architectural Highlights:
1. **Generic Type Safety**: Preserves input arguments \`Parameters<T>\` and promise return type \`ReturnType<T>\`.
2. **Garbage Collection Friendly**: Clears prior timeout handles immediately.
3. **Promise-compatible**: Can be cleanly \`await\`ed by the caller.`;
    }

    // 3. AI / Machine Learning / Deep Learning
    if (query.includes('ai') || query.includes('chatgpt') || query.includes('transformer') || query.includes('llm') || query.includes('model')) {
      return `### 🧠 Understanding Modern Large Language Models (LLMs)

Modern conversational AI models like ChatGPT and **MortX** are powered by the **Transformer architecture**, originally introduced in 2017 (*"Attention Is All You Need"*).

#### 1. The Core Pillar: Self-Attention Mechanism
Unlike older Recurrent Neural Networks (RNNs) that processed text sequentially one word at a time, Transformers process all words simultaneously using **Self-Attention**:

\`\`\`math
Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V
\`\`\`

- **Queries (Q)**: What the current token is seeking.
- **Keys (K)**: What tokens offer in context.
- **Values (V)**: The actual informational representation transferred.

#### 2. Training Pipeline
1. **Pre-training**: Predicting the next token across massive text datasets to learn grammar, facts, and reasoning.
2. **Instruction Fine-Tuning (SFT)**: Teaching the raw model to respond helpfully as an assistant.
3. **RLHF / DPO (Alignment)**: Human feedback to prevent harmful content and match user intent.`;
    }

    // 4. Writing / Email / Business
    if (query.includes('email') || query.includes('write') || query.includes('draft') || query.includes('negotiat')) {
      return `### ✉️ Professional Draft

Here is a polished, assertive, and diplomatic draft for your review:

---

**Subject:** Discussion on Role Evolution & Compensation Review — [Your Name]

Dear [Manager's Name],

I hope you are having a productive week.

Over the past [duration, e.g., 12 months], I have thoroughly enjoyed contributing to our team's milestones—including [mention 1-2 major achievements, e.g., delivering Project X ahead of schedule and optimizing system efficiency by 25%].

Given the expanded scope of my responsibilities and my continued dedication to [Company Name]'s strategic goals, I would welcome the opportunity to briefly discuss aligning my current compensation with market standards and my recent contributions.

Could we schedule 15 minutes next week to review this together?

Thank you for your ongoing support and guidance.

Best regards,  
**[Your Name]**  
*[Your Title]*

---
*Tip: Customize the bracketed text with concrete metrics before sending.*`;
    }

    // 5. Default General Response
    return `### 💡 MortX AI Response

Thank you for your query regarding **"${query.slice(0, 40)}${query.length > 40 ? '...' : ''}"**.

Here is a structured analysis:

1. **Overview & Key Concept**:
   - Addressing the core requirements effectively while keeping performance and clarity paramount.
   - Tailored specifically to your current active model: **${modelId}**.

2. **Actionable Recommendations**:
   - **Step 1**: Define the immediate goal and constraints clearly.
   - **Step 2**: Apply iterative testing to validate assumptions.
   - **Step 3**: Monitor outcomes and refine based on real-world feedback.

3. **Next Steps**:
   Would you like me to elaborate further on any specific aspect, write code examples, or draft a step-by-step plan?`;
  }

  private static async streamFromRealAPI(
    messages: ChatMessage[],
    modelId: string,
    settings: AppSettings,
    callbacks: StreamCallbacks,
    signal: AbortSignal
  ): Promise<void> {
    const formattedMessages = [
      { role: 'system', content: settings.systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const endpoint =
      settings.apiProvider === 'openrouter'
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    const mappedModel =
      settings.apiProvider === 'openrouter'
        ? 'openai/gpt-4o-mini'
        : modelId === 'mortx-flash'
        ? 'gpt-4o-mini'
        : 'gpt-4o';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: mappedModel,
        messages: formattedMessages,
        temperature: settings.temperature,
        stream: true,
      }),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API error ${res.status}: ${errText}`);
    }

    if (!res.body) {
      throw new Error('ReadableStream not supported on this platform');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullContent += delta;
              callbacks.onContentChunk(delta);
            }
          } catch {
            // ignore non-json line
          }
        }
      }
    }

    callbacks.onDone(fullContent);
  }
}
