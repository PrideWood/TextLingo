import type { KnowledgeDetailLevel, KnowledgeItem, KnowledgeSection } from '../../src/types';
import { hasLlmCredentials, requestLlmJson } from './llm';

export interface KnowledgeProviderInput {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  title?: string;
  detailLevel?: KnowledgeDetailLevel;
}

interface KnowledgePayload {
  sections: KnowledgeSection[];
}

export function hasKnowledgeCredentials() {
  return hasLlmCredentials(['KNOWLEDGE', 'TRANSLATE']);
}

function normalizeKnowledgePayload(payload: KnowledgePayload): KnowledgeSection[] {
  if (!Array.isArray(payload.sections)) {
    throw new Error('知识点结果格式异常');
  }

  return payload.sections.map((section) => ({
    title: String(section.title || ''),
    intro: String(section.intro || ''),
    items: Array.isArray(section.items)
      ? section.items.map((item) => normalizeKnowledgeItem(item as KnowledgeItem))
      : [],
  }));
}

function normalizeKnowledgeItem(item: KnowledgeItem): KnowledgeItem {
  const legacyItem = item as KnowledgeItem & {
    name?: string;
    sourceExcerpt?: string;
    tip?: string;
  };

  return {
    id: item?.id ? String(item.id) : undefined,
    term: String(item?.term || legacyItem?.name || ''),
    explanation: String(item?.explanation || ''),
    sourceSnippet: String(item?.sourceSnippet || legacyItem?.sourceExcerpt || ''),
    note: item?.note ? String(item.note) : legacyItem?.tip ? String(legacyItem.tip) : undefined,
  };
}

export async function extractKnowledge(input: KnowledgeProviderInput): Promise<KnowledgeSection[]> {
  const detailLevel = input.detailLevel ?? 'medium';
  const payload = await requestLlmJson<KnowledgePayload>({
    prefixes: ['KNOWLEDGE', 'TRANSLATE'],
    feature: 'knowledge',
    userPrompt: [
      `Source language: ${input.sourceLanguage}`,
      `Target language: ${input.targetLanguage}`,
      input.title?.trim() ? `Title: ${input.title.trim()}` : null,
      `Knowledge detail level: ${detailLevel}`,
      'Analyze the following text and return json only.',
      'The input text may contain blank lines. Blank lines are allowed in the source input, but every JSON string value must escape line breaks as \\n. Never put raw line breaks inside a JSON string.',
      'Return exactly this shape:',
      '{"sections":[{"title":"重点词汇","intro":"...","items":[{"id":"v1","term":"source term exactly as written","explanation":"...","sourceSnippet":"complete source sentence whenever possible","note":"..."}]},{"title":"常用表达","intro":"...","items":[{"id":"e1","term":"source expression exactly as written","explanation":"...","sourceSnippet":"complete source sentence whenever possible","note":"..."}]},{"title":"语法点","intro":"...","items":[{"id":"g1","term":"source-language grammar pattern or structure","explanation":"...","sourceSnippet":"complete source sentence whenever possible","note":"..."}]}]}',
      'KnowledgeItem contract:',
      '- term = a real word, phrase, expression, or grammar structure that appears in the source text. Do not translate term.',
      '- explanation = concise explanation written in the target language.',
      '- sourceSnippet = source-language context copied from the original text. Prefer a complete original sentence. If a full sentence is too long, keep enough context to make the usage clear.',
      '- note = optional learning tip written in the target language.',
      'Category rules:',
      '- Vocabulary: extract vocabulary terms exactly from the source text. Do not translate the vocabulary term itself.',
      '- Expressions: extract expressions exactly as they appear in the source text. Do not translate the expression itself.',
      '- Grammar: term may be a target-language label plus the exact source-language structure, for example "条件句: If + subject + did not..."; sourceSnippet must include the complete original sentence.',
      'Language contract: termLanguage = sourceLanguage; sourceSnippetLanguage = sourceLanguage; explanationLanguage = targetLanguage; noteLanguage = targetLanguage.',
      'For each item, provide a complete source sentence from the original text whenever possible. Avoid one-word or broken fragments as sourceSnippet.',
      'If a sourceSnippet spans multiple lines, either choose the most relevant complete sentence or encode the line break as \\n inside the JSON string.',
      knowledgeDetailInstruction(detailLevel),
      'Return the three main sections: 重点词汇, 常用表达, 语法点. The number and selection of items must follow Knowledge detail level.',
      'Text:',
      input.text,
    ]
      .filter(Boolean)
      .join('\n'),
    systemPrompt:
      'You are a language learning assistant. Return valid json only. Do not add markdown fences or extra explanation.',
  });

  return normalizeKnowledgePayload(payload);
}

function knowledgeDetailInstruction(detailLevel: KnowledgeDetailLevel) {
  if (detailLevel === 'basic') {
    return [
      'Knowledge detail level rules for basic:',
      '- Extract more learning points with broader coverage.',
      '- Include common vocabulary, useful expressions, and basic grammar patterns.',
      '- Explanations should be friendly to beginners.',
      '- Do not only pick advanced expressions; include basic but useful words and sentence patterns.',
      '- Each section may contain more items when the text supports it.',
    ].join('\n');
  }

  if (detailLevel === 'advanced') {
    return [
      'Knowledge detail level rules for advanced:',
      '- Extract fewer but more valuable learning points.',
      '- Focus on nuanced expressions, advanced vocabulary, collocations, discourse features, and complex grammar.',
      '- Avoid explaining very basic words unless they are contextually important.',
      '- Keep the output selective and concise.',
    ].join('\n');
  }

  return [
    'Knowledge detail level rules for medium:',
    '- Extract a balanced number of important learning points.',
    '- Focus on vocabulary, expressions, and grammar useful for general learners.',
    '- Avoid too many trivial items, but do not keep only advanced content.',
  ].join('\n');
}
