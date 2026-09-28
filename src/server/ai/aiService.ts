import { LLMProvider, LLMOptions } from './providers/base';
import { GeminiProvider } from './providers/geminiProvider';
import { HeuristicProvider } from './providers/heuristicProvider';

export interface StructuredValidationFunction<T> {
  (raw: any): { valid: boolean; errors: string[]; sanitized?: T };
}

export class AIService {
  private primaryProvider: LLMProvider;
  private fallbackProvider: LLMProvider;

  constructor(primary?: LLMProvider, fallback?: LLMProvider) {
    const hasGeminiKey =
      typeof process !== 'undefined' &&
      Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY);

    this.primaryProvider = primary || (hasGeminiKey ? new GeminiProvider() : new HeuristicProvider());
    this.fallbackProvider = fallback || new HeuristicProvider();
  }

  public getActiveProviderName(): string {
    return this.primaryProvider.name;
  }

  public async generate(prompt: string, options?: LLMOptions): Promise<string> {
    try {
      return await this.primaryProvider.generate(prompt, options);
    } catch (err) {
      if (this.primaryProvider !== this.fallbackProvider) {
        console.warn(`Primary provider (${this.primaryProvider.name}) failed, falling back to ${this.fallbackProvider.name}:`, err);
        return await this.fallbackProvider.generate(prompt, options);
      }
      throw err;
    }
  }

  public async generateStructured<T>(
    prompt: string,
    schemaDescription: string,
    validator: StructuredValidationFunction<T>,
    options?: LLMOptions
  ): Promise<T> {
    let attempt = 0;
    let lastError: Error | null = null;
    let currentPrompt = prompt;

    // Retry once if appropriate (total 2 attempts on primary)
    while (attempt < 2) {
      attempt++;
      try {
        const raw = await this.primaryProvider.generateStructured<any>(currentPrompt, schemaDescription, options);
        const validation = validator(raw);

        if (validation.valid && validation.sanitized) {
          return validation.sanitized;
        }

        const errMsg = `Validation failed: ${validation.errors.join('; ')}`;
        lastError = new Error(errMsg);

        // Modify prompt for retry attempt with feedback
        currentPrompt = `${prompt}\n\nIMPORTANT PREVIOUS ATTEMPT ERRORS: ${validation.errors.join(', ')}. Please fix these errors and strictly adhere to the schema.`;
      } catch (err: any) {
        lastError = err;
      }
    }

    // If primary provider failed or produced invalid output, try fallback provider
    if (this.primaryProvider !== this.fallbackProvider) {
      console.warn(`Primary LLM provider failed after retries (${lastError?.message}). Engaging fallback provider.`);
      try {
        const fallbackRaw = await this.fallbackProvider.generateStructured<any>(prompt, schemaDescription, options);
        const fallbackValidation = validator(fallbackRaw);
        if (fallbackValidation.valid && fallbackValidation.sanitized) {
          return fallbackValidation.sanitized;
        }
      } catch (fallbackErr: any) {
        lastError = fallbackErr;
      }
    }

    throw new Error(`Controlled error: Failed to generate valid structured query. ${lastError?.message || 'Unknown error'}`);
  }
}
