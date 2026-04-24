import type { TtsResult } from '../../src/types';

export interface TtsProviderInput {
  text: string;
  sourceLanguage: string;
  voice?: string;
  speed?: string;
}

export async function generateSpeech(input: TtsProviderInput): Promise<TtsResult> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[provider:tts] dynamic preview branch', {
      sourceLanguage: input.sourceLanguage,
      textLength: input.text.length,
      voice: input.voice || 'Clear Tutor',
      speed: input.speed || '1.0x',
    });
  }

  const preview = input.text.replace(/\s+/g, ' ').trim().slice(0, 120);

  return {
    model: 'tts-learning-preview',
    voice: input.voice || 'Clear Tutor',
    speed: input.speed || '1.0x',
    audioUrl: null,
    message: `Dynamic TTS preview queued for: ${preview || 'empty text'}`,
  };
}
