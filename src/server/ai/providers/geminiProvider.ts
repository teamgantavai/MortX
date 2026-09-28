import { LLMProvider, LLMOptions } from './base';

export class GeminiProvider implements LLMProvider {
  public readonly name = 'gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || (typeof process !== 'undefined' ? (process.env.GEMINI_API_KEY || process.env.API_KEY || '') : '');
    this.model = model || 'gemini-1.5-flash';
  }

  public async generate(prompt: string, options?: LLMOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const modelName = options?.model || this.model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.1,
          maxOutputTokens: options?.maxTokens ?? 1024,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  public async generateStructured<T>(
    prompt: string,
    schemaDescription: string,
    options?: LLMOptions
  ): Promise<T> {
    const systemInstruction = `You are a high-precision structured data extractor.
Return strictly valid, minified JSON conforming to this specification:
${schemaDescription}
Do NOT wrap the output in markdown code blocks like \`\`\`json. Return ONLY the raw JSON object.`;

    const fullPrompt = `${systemInstruction}\n\nTask:\n${prompt}`;
    const raw = await this.generate(fullPrompt, options);

    // Clean any accidental markdown fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned) as T;
  }
}
