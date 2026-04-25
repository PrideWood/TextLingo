import type { QuizQuestion, QuizQuestionTypes, QuizType } from '../../src/types';
import { hasLlmCredentials, requestLlmJson } from './llm';

export interface QuizProviderInput {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  title?: string;
  questionTypes?: QuizQuestionTypes;
}

interface QuizPayload {
  questions: QuizQuestion[];
}

export function hasQuizCredentials() {
  return hasLlmCredentials(['QUIZ']);
}

function normalizeQuizPayload(payload: QuizPayload, questionTypes: QuizQuestionTypes): QuizQuestion[] {
  if (!Array.isArray(payload.questions)) {
    throw new Error('练习题结果格式异常');
  }

  return payload.questions
    .map((question, index) => {
      const type: QuizType = question.type === 'translation' ? 'translation' : question.type === 'multiple' ? 'multiple' : 'single';
      return {
        id: String(question.id || `quiz-${index + 1}`),
        type,
        question: String(question.question || ''),
        options: Array.isArray(question.options) ? question.options.map((item) => String(item)) : [],
        answer: Array.isArray(question.answer) ? question.answer.map((item) => String(item)) : [],
        explanation: String(question.explanation || ''),
      };
    })
    .filter((question) => questionTypes[question.type]);
}

export async function generateQuiz(input: QuizProviderInput): Promise<QuizQuestion[]> {
  const questionTypes = normalizeQuestionTypes(input.questionTypes);
  const payload = await requestLlmJson<QuizPayload>({
    prefixes: ['QUIZ'],
    feature: 'quiz',
    userPrompt: [
      `Source language: ${input.sourceLanguage}`,
      `Target language: ${input.targetLanguage}`,
      input.title?.trim() ? `Title: ${input.title.trim()}` : null,
      quizTypeInstruction(questionTypes),
      'Create study questions based on the text and return json only.',
      'The input text may contain blank lines. Blank lines are allowed in the source input, but every JSON string value must escape line breaks as \\n. Never put raw line breaks inside a JSON string.',
      'Return exactly this shape:',
      '{"questions":[{"id":"q1","type":"single","question":"...","options":["option text","option text","option text","option text"],"answer":["exact option text"],"explanation":"..."},{"id":"q2","type":"multiple","question":"...","options":["option text","option text","option text","option text"],"answer":["exact option text","exact option text"],"explanation":"..."},{"id":"q3","type":"translation","question":"translated sentence in target language","options":[],"answer":["original source sentence"],"explanation":"..."}]}',
      'Requirements:',
      '- The returned type field must match the allowed quiz question types.',
      '- single and multiple choice questions must have exactly 4 options',
      '- translation questions must have an empty options array',
      '- Generate single/multiple quiz questions and options in the source language.',
      '- For translation questions: excerpt at least two complete source sentences from the text, translate each sentence into the target language as the question, and put the exact original source sentence in answer[0].',
      '- Language contract: quizLanguage = sourceLanguage; explanationLanguage = targetLanguage.',
      '- Translation question prompt language = targetLanguage; translation answer language = sourceLanguage.',
      '- explanation should be concise and written in the target language',
      '- for single/multiple choice, answers must exactly match option strings',
      '- do not translate question text or options into the target language unless sourceLanguage and targetLanguage are the same',
      'Text:',
      input.text,
    ]
      .filter(Boolean)
      .join('\n'),
    systemPrompt:
      'You are a language learning assistant. Return valid json only. Do not add markdown fences or extra explanation.',
  });

  return normalizeQuizPayload(payload, questionTypes);
}

function normalizeQuestionTypes(value?: QuizQuestionTypes): QuizQuestionTypes {
  const questionTypes = {
    single: value?.single ?? true,
    multiple: value?.multiple ?? true,
    translation: value?.translation ?? true,
  };

  if (!questionTypes.single && !questionTypes.multiple && !questionTypes.translation) {
    questionTypes.single = true;
  }

  return questionTypes;
}

function quizTypeInstruction(questionTypes: QuizQuestionTypes) {
  const allowed = [
    questionTypes.single ? 'single' : null,
    questionTypes.multiple ? 'multiple' : null,
    questionTypes.translation ? 'translation' : null,
  ].filter(Boolean);
  const blocked = [
    !questionTypes.single ? 'single' : null,
    !questionTypes.multiple ? 'multiple' : null,
    !questionTypes.translation ? 'translation' : null,
  ].filter(Boolean);
  return [
    'Quiz type rules:',
    `- Allowed question types: ${allowed.join(', ')}.`,
    blocked.length ? `- Do not generate these question types: ${blocked.join(', ')}.` : null,
    questionTypes.single ? '- If single is allowed, generate single-choice questions with type: "single".' : null,
    questionTypes.multiple ? '- If multiple is allowed, generate multiple-choice questions with type: "multiple".' : null,
    questionTypes.translation ? '- If translation is allowed, generate at least two translation questions with type: "translation".' : null,
  ]
    .filter(Boolean)
    .join('\n');
}
