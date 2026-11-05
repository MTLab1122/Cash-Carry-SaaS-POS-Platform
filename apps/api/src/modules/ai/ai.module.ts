import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { EncryptionService } from './encryption.service';
import { PiiScrubberService } from './pii-scrubber.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GoogleGeminiProvider } from './providers/gemini.provider';
import { LocalOllamaProvider } from './providers/ollama.provider';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    EncryptionService,
    PiiScrubberService,
    OpenAIProvider,
    AnthropicProvider,
    GoogleGeminiProvider,
    LocalOllamaProvider,
  ],
  exports: [AiService, EncryptionService, PiiScrubberService],
})
export class AiModule {}
