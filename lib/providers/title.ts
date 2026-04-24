import type { TitleResult } from '../../src/types';
import { hasLlmCredentials, requestLlmText } from './llm';

export interface TitleProviderInput {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export function hasTitleCredentials() {
  return hasLlmCredentials(['TITLE', 'TRANSLATE']);
}

export async function generateTitle(input: TitleProviderInput): Promise<TitleResult> {
  const title = await requestLlmText({
    prefixes: ['TITLE', 'TRANSLATE'],
    feature: 'title',
    systemPrompt: 'You generate concise study-note titles. Return only the title text, no quotes or explanation.',
    userPrompt: [
      `Source language: ${input.sourceLanguage}`,
      `Target language: ${input.targetLanguage}`,
      'Create a short, useful title for this text, suitable for an Obsidian note.',
      'Generate the title in the source language.',
      'Language contract: titleLanguage = sourceLanguage. Do not translate the title into the target language unless sourceLanguage and targetLanguage are the same.',
      'Text:',
      input.text,
    ].join('\n'),
  });

  return { title: title.trim().replace(/^#+\s*/, '') };
}
