import type { TranslationResult } from '../../src/types';
import { getLlmRuntimeConfig, hasLlmCredentials, requestLlmText } from './llm';

export interface TranslateProviderInput {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  title?: string;
}

export function getTranslateRuntimeConfig() {
  return getLlmRuntimeConfig(['TRANSLATE']);
}

export function hasTranslateCredentials() {
  return hasLlmCredentials(['TRANSLATE']);
}

export async function translateText(input: TranslateProviderInput): Promise<TranslationResult> {
  const translation = await requestLlmText({
    prefixes: ['TRANSLATE'],
    feature: 'translate',
    systemPrompt:
      'You are a professional translator. Return only the final translation text. Do not explain your work. Preserve paragraph breaks and meaningful line breaks from the source text.',
    userPrompt: [
      `Source language: ${input.sourceLanguage}`,
      `Target language: ${input.targetLanguage}`,
      input.title?.trim() ? `Title: ${input.title.trim()}` : null,
      'Language contract: translationLanguage = targetLanguage.',
      'Preserve the original paragraph structure as much as possible. Do not collapse separate paragraphs into one paragraph.',
      'Text to translate:',
      input.text,
    ]
      .filter(Boolean)
      .join('\n'),
  });

  return { translation };
}
