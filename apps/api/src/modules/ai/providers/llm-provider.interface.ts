export interface LLMCompletionResult {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}

export interface ILLMProvider {
  generateResponse(
    prompt: string,
    systemPrompt?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      apiKey?: string;
    },
  ): Promise<LLMCompletionResult>;
}
