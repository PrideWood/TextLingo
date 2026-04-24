import type {
  AnalysisOptions,
  AnalysisResult,
  DifficultyRating,
  KnowledgeDetailLevel,
  KnowledgeItem,
  KnowledgeResult,
  KnowledgeSection,
  QuizQuestion,
  QuizQuestionTypes,
  QuizType,
} from '../../src/types';
import { generateTitle, hasTitleCredentials } from './title';
import { translateText, hasTranslateCredentials } from './translate';
import { extractKnowledge, hasKnowledgeCredentials } from './knowledge';
import { generateQuiz, hasQuizCredentials } from './quiz';
import { extractJson, requestLlmText } from './llm';

export interface AnalyzeProviderInput {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  options?: Partial<AnalysisOptions>;
}

type RawAnalysis = Partial<AnalysisResult> & {
  data?: unknown;
  result?: unknown;
  knowledge?: unknown;
  originalText?: unknown;
  title?: unknown;
  translation?: unknown;
  difficulty?: unknown;
  quiz?: unknown;
};

interface DifficultyPayload {
  difficulty?: DifficultyRating | null;
}

const defaultAnalyzeOptions: AnalysisOptions = {
  generateTitle: true,
  generateTranslation: true,
  extractKnowledge: true,
  generateQuiz: true,
  enableDifficultyRating: true,
  knowledgeDetailLevel: 'medium',
  quizQuestionTypes: {
    single: true,
    multiple: true,
  },
};

export function hasAnalyzeCredentials(options?: Partial<AnalysisOptions>) {
  const normalizedOptions = normalizeAnalyzeOptions(options);

  return (
    (!normalizedOptions.generateTitle || hasTitleCredentials()) &&
    (!normalizedOptions.generateTranslation || hasTranslateCredentials()) &&
    (!normalizedOptions.extractKnowledge || hasKnowledgeCredentials()) &&
    (!normalizedOptions.generateQuiz || hasQuizCredentials()) &&
    (!normalizedOptions.enableDifficultyRating || hasTitleCredentials())
  );
}

export async function analyzeText(input: AnalyzeProviderInput): Promise<AnalysisResult> {
  const options = normalizeAnalyzeOptions(input.options);
  const [titleResult, translationResult, knowledgeResult, quizResult, difficultyResult] = await Promise.all([
    options.generateTitle ? generateTitle(input) : Promise.resolve({ title: fallbackTitle(input.text) }),
    options.generateTranslation ? translateText(input) : Promise.resolve({ translation: '译文生成已关闭' }),
    options.extractKnowledge ? extractKnowledge({ ...input, detailLevel: options.knowledgeDetailLevel }) : Promise.resolve([]),
    options.generateQuiz ? generateQuiz({ ...input, questionTypes: options.quizQuestionTypes }) : Promise.resolve([]),
    options.enableDifficultyRating ? rateDifficulty(input) : Promise.resolve(null),
  ]);

  const raw = {
    title: titleResult.title,
    originalText: input.text,
    translation: translationResult.translation,
    difficulty: difficultyResult,
    knowledge: knowledgeResult,
    quiz: quizResult,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('analyze provider raw shape:', {
      keys: Object.keys(raw),
      knowledgeIsArray: Array.isArray(raw.knowledge),
      quizIsArray: Array.isArray(raw.quiz),
      hasTranslation: Boolean(raw.translation),
      hasDifficulty: Boolean(raw.difficulty),
      options,
    });
  }

  return normalizeAnalysisResult(raw, input.text, options);
}

export function normalizeAnalysisResult(
  rawInput: unknown,
  originalText: string,
  options: AnalysisOptions = defaultAnalyzeOptions,
): AnalysisResult {
  const raw = unwrapRawAnalysis(parseMaybeJson(rawInput));
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : fallbackTitle(originalText);
  const normalizedOriginalText =
    typeof raw.originalText === 'string' && raw.originalText.trim() ? raw.originalText : originalText;
  const translation = typeof raw.translation === 'string' ? raw.translation.trim() : '';

  if (!translation) {
    throw new Error('翻译结果缺失，请稍后重试');
  }

  return {
    title,
    originalText: normalizedOriginalText,
    translation,
    difficulty: normalizeDifficulty(raw.difficulty),
    knowledge: normalizeKnowledge(raw.knowledge),
    quiz: normalizeQuiz(raw.quiz, options.quizQuestionTypes),
  };
}

async function rateDifficulty(input: AnalyzeProviderInput): Promise<DifficultyRating | null> {
  const rawText = await requestLlmText({
    prefixes: ['TITLE', 'TRANSLATE'],
    feature: 'difficulty',
    expectJson: true,
    systemPrompt:
      'You rate language-learning text difficulty. Return valid json only. Do not add markdown fences or extra explanation.',
    userPrompt: [
      `Source language: ${input.sourceLanguage}`,
      `Target language: ${input.targetLanguage}`,
      'Analyze the text difficulty for a language learner and return json only.',
      'Difficulty rating rules:',
      '- 1 star: A1-A2, simple daily expressions, short sentences, basic vocabulary.',
      '- 2 stars: A2-B1, elementary to lower-intermediate, a few complex expressions.',
      '- 3 stars: B1-B2, intermediate reading, sentence structure and vocabulary have some challenge.',
      '- 4 stars: B2-C1, complex text, abstract expressions, long sentences, or domain vocabulary.',
      '- 5 stars: C1-C2, advanced text, specialized, syntactically complex, vocabulary-dense.',
      'Return exactly this shape:',
      '{"difficulty":{"stars":3,"cefr":"B2","label":"Upper-intermediate","reason":"..."}}',
      'stars must be an integer from 1 to 5.',
      'cefr must be one of A1, A2, B1, B2, C1, C2.',
      'label must be a short English label such as Beginner, Elementary, Intermediate, Upper-intermediate, Advanced, or Proficient.',
      'reason must be written in the target language and briefly explain the rating based on genre, sentence complexity, complex vocabulary, and grammar complexity.',
      'Text:',
      input.text,
    ].join('\n'),
  });

  const payload = extractJson<DifficultyPayload>(rawText);
  return normalizeDifficulty(payload.difficulty);
}

export function normalizeAnalyzeOptions(value: unknown): AnalysisOptions {
  const raw = value && typeof value === 'object' ? (value as Partial<AnalysisOptions>) : {};
  const questionTypes = {
    ...defaultAnalyzeOptions.quizQuestionTypes,
    ...(raw.quizQuestionTypes ?? {}),
  };

  if (!questionTypes.single && !questionTypes.multiple) {
    questionTypes.single = true;
  }

  return {
    ...defaultAnalyzeOptions,
    ...raw,
    knowledgeDetailLevel: normalizeKnowledgeDetailLevel(raw.knowledgeDetailLevel),
    quizQuestionTypes: questionTypes,
  };
}

function normalizeKnowledgeDetailLevel(value: unknown): KnowledgeDetailLevel {
  return value === 'basic' || value === 'advanced' ? value : 'medium';
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const text = stripJsonFence(value.trim());
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('模型返回内容不是有效 JSON，请稍后重试');
  }
}

function stripJsonFence(value: string) {
  return value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function unwrapRawAnalysis(value: unknown): RawAnalysis {
  if (!value || typeof value !== 'object') {
    throw new Error('分析结果格式异常');
  }

  const raw = value as RawAnalysis;
  if (raw.data && typeof raw.data === 'object') {
    return unwrapRawAnalysis(raw.data);
  }
  if (raw.result && typeof raw.result === 'object') {
    return unwrapRawAnalysis(raw.result);
  }

  return raw;
}

function normalizeKnowledge(value: unknown): KnowledgeResult {
  if (!value) {
    return emptyKnowledge();
  }

  if (Array.isArray(value)) {
    return sectionsToKnowledge(value as KnowledgeSection[]);
  }

  if (typeof value === 'object') {
    const raw = value as Partial<Record<keyof KnowledgeResult, unknown>>;
    return {
      vocabulary: normalizeKnowledgeItems(raw.vocabulary),
      expressions: normalizeKnowledgeItems(raw.expressions),
      grammar: normalizeKnowledgeItems(raw.grammar),
    };
  }

  return emptyKnowledge();
}

function sectionsToKnowledge(sections: KnowledgeSection[]): KnowledgeResult {
  const find = (keywords: string[]) =>
    sections.find((section) => keywords.some((keyword) => section.title.toLowerCase().includes(keyword.toLowerCase())));

  return {
    vocabulary: normalizeKnowledgeItems(find(['重点词汇', '词汇', 'vocabulary', 'words'])?.items),
    expressions: normalizeKnowledgeItems(find(['常用表达', '表达', 'expression', 'phrases'])?.items),
    grammar: normalizeKnowledgeItems(find(['语法点', '语法', 'grammar'])?.items),
  };
}

function normalizeKnowledgeItems(value: unknown): KnowledgeItem[] {
  if (!Array.isArray(value)) return [];

  return value.map((item, index) => {
    const raw = item as KnowledgeItem & { name?: string; sourceExcerpt?: string; tip?: string };
    return {
      id: raw.id ? String(raw.id) : `knowledge-${index + 1}`,
      term: String(raw.term || raw.name || ''),
      explanation: String(raw.explanation || ''),
      sourceSnippet: String(raw.sourceSnippet || raw.sourceExcerpt || ''),
      note: raw.note ? String(raw.note) : raw.tip ? String(raw.tip) : undefined,
    };
  });
}

function normalizeQuiz(value: unknown, allowedTypes: QuizQuestionTypes): QuizQuestion[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const raw = item as QuizQuestion;
      const type: QuizType = raw.type === 'multiple' ? 'multiple' : 'single';
      return {
        id: String(raw.id || `quiz-${index + 1}`),
        type,
        question: String(raw.question || ''),
        options: Array.isArray(raw.options) ? raw.options.map((option) => String(option)) : [],
        answer: Array.isArray(raw.answer) ? raw.answer.map((answer) => String(answer)) : [],
        explanation: String(raw.explanation || ''),
      };
    })
    .filter((question) => allowedTypes[question.type]);
}

function normalizeDifficulty(value: unknown): DifficultyRating | null {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Partial<DifficultyRating>;
  const stars = normalizeStars(raw.stars);
  const cefr = normalizeCefr(raw.cefr);

  if (!stars || !cefr) return null;

  return {
    stars,
    cefr,
    label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim() : labelFromStars(stars),
    reason: typeof raw.reason === 'string' ? raw.reason.trim() : '',
  };
}

function normalizeStars(value: unknown): DifficultyRating['stars'] | null {
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) return null;
  if (numeric < 1 || numeric > 5) return null;
  return numeric as DifficultyRating['stars'];
}

function normalizeCefr(value: unknown): DifficultyRating['cefr'] | null {
  return value === 'A1' || value === 'A2' || value === 'B1' || value === 'B2' || value === 'C1' || value === 'C2'
    ? value
    : null;
}

function labelFromStars(stars: DifficultyRating['stars']) {
  const labels: Record<DifficultyRating['stars'], string> = {
    1: 'Beginner',
    2: 'Elementary',
    3: 'Intermediate',
    4: 'Upper-intermediate',
    5: 'Advanced',
  };

  return labels[stars];
}

function emptyKnowledge(): KnowledgeResult {
  return {
    vocabulary: [],
    expressions: [],
    grammar: [],
  };
}

function fallbackTitle(text: string) {
  const firstLine = text.split(/\n+/).map((line) => line.trim()).find(Boolean);
  return firstLine ? firstLine.slice(0, 48) : 'Untitled Language Note';
}
