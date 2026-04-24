import type { QuizQuestion, QuizQuestionTypes, QuizType } from '../../src/types';
import { extractJson, hasLlmCredentials, requestLlmText } from './llm';

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
      const type: QuizType = question.type === 'multiple' ? 'multiple' : 'single';
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
  const rawText = await requestLlmText({
    prefixes: ['QUIZ'],
    feature: 'quiz',
    expectJson: true,
    userPrompt: [
      `Source language: ${input.sourceLanguage}`,
      `Target language: ${input.targetLanguage}`,
      input.title?.trim() ? `Title: ${input.title.trim()}` : null,
      quizTypeInstruction(questionTypes),
      'Create 4 study questions based on the text and return json only.',
      'Return exactly this shape:',
      '{"questions":[{"id":"q1","type":"single","question":"...","options":["A","B","C","D"],"answer":["A"],"explanation":"..."},{"id":"q2","type":"multiple","question":"...","options":["A","B","C","D"],"answer":["A","C"],"explanation":"..."}]}',
      'Requirements:',
      '- The returned type field must match the allowed quiz question types.',
      '- each question must have exactly 4 options',
      '- Generate quiz questions and options in the source language.',
      '- Language contract: quizLanguage = sourceLanguage; explanationLanguage = targetLanguage.',
      '- explanation should be concise and written in the target language',
      '- answers must exactly match option strings',
      '- do not translate question text or options into the target language unless sourceLanguage and targetLanguage are the same',
      'Text:',
      input.text,
    ]
      .filter(Boolean)
      .join('\n'),
    systemPrompt:
      'You are a language learning assistant. Return valid json only. Do not add markdown fences or extra explanation.',
  });

  const payload = extractJson<QuizPayload>(rawText);
  return normalizeQuizPayload(payload, questionTypes);
}

function normalizeQuestionTypes(value?: QuizQuestionTypes): QuizQuestionTypes {
  const questionTypes = {
    single: value?.single ?? true,
    multiple: value?.multiple ?? true,
  };

  if (!questionTypes.single && !questionTypes.multiple) {
    questionTypes.single = true;
  }

  return questionTypes;
}

function quizTypeInstruction(questionTypes: QuizQuestionTypes) {
  if (questionTypes.single && questionTypes.multiple) {
    return [
      'Quiz type rules:',
      '- Generate a mix of single-choice and multiple-choice questions.',
      '- Use type: "single" for single-choice questions and type: "multiple" for multiple-choice questions.',
    ].join('\n');
  }

  if (questionTypes.single) {
    return [
      'Quiz type rules:',
      '- Generate only single-choice questions.',
      '- Do not generate multiple-choice questions.',
      '- Every question must use type: "single".',
    ].join('\n');
  }

  return [
    'Quiz type rules:',
    '- Generate only multiple-choice questions.',
    '- Do not generate single-choice questions.',
    '- Every question must use type: "multiple".',
  ].join('\n');
}
