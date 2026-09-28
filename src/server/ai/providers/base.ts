export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
}

export interface LLMProvider {
  readonly name: string;
  generate(prompt: string, options?: LLMOptions): Promise<string>;
  generateStructured<T>(prompt: string, schemaDescription: string, options?: LLMOptions): Promise<T>;
}
