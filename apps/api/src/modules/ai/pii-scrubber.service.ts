import { Injectable } from '@nestjs/common';

@Injectable()
export class PiiScrubberService {
  /**
   * Sanitizes all sensitive Personally Identifiable Information (PII)
   * from text before dispatching context payload to LLM providers.
   */
  scrub(text: string): string {
    if (!text) return text;

    let sanitized = text;

    // 1. Credit Card Numbers (13-16 digits with optional spaces or dashes)
    sanitized = sanitized.replace(
      /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
      '[REDACTED_CARD_NUMBER]',
    );

    // 2. Pakistan National Identity Cards (CNIC: 5 digits - 7 digits - 1 digit)
    sanitized = sanitized.replace(/\b\d{5}-\d{7}-\d\b/g, '[REDACTED_CNIC]');

    // 3. Pakistan Mobile Numbers (+92-3xx-xxxxxxx, 03xx-xxxxxxx)
    sanitized = sanitized.replace(/(?:\+92|0092|0)?3[0-9]{2}[-\s]?[0-9]{7}\b/g, '[REDACTED_PHONE]');

    // 4. International standard email addresses in prompts
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');

    // 5. Passwords / Secrets
    sanitized = sanitized.replace(/(?:password|secret|pin|apiKey)\s*[:=]\s*['"]?[^\s,'"]+['"]?/gi, '$1=[REDACTED]');

    return sanitized;
  }
}
