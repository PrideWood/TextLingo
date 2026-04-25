import type { KnowledgeItem, KnowledgeResult, KnowledgeSection, QuizQuestion } from '../../types';

export function getKnowledgeTerm(item: KnowledgeItem) {
  return item.term || item.name || '';
}

export function getKnowledgeSnippet(item: KnowledgeItem) {
  return item.sourceSnippet || item.sourceExcerpt || '';
}

export function getKnowledgeNote(item: KnowledgeItem) {
  return item.note || item.tip || '';
}

export function sectionMatches(section: KnowledgeSection, keywords: string[]) {
  const title = section.title.toLowerCase();
  return keywords.some((keyword) => title.includes(keyword.toLowerCase()));
}

export function findKnowledgeSection(sections: KnowledgeSection[], keywords: string[]) {
  return sections.find((section) => sectionMatches(section, keywords));
}

export function buildKnowledgeMarkdown(knowledge: KnowledgeResult) {
  const sections: KnowledgeSection[] = [
    { title: '重点词汇', intro: '', items: knowledge.vocabulary },
    { title: '常用表达', intro: '', items: knowledge.expressions },
    { title: '语法点', intro: '', items: knowledge.grammar },
  ];

  if (!sections.some((section) => section.items.length)) return '暂无知识点';

  return sections
    .filter((section) => section.items.length)
    .map((section) =>
      [
        `### ${section.title}`,
        section.intro,
        ...section.items.flatMap((item) => [
          `- **${getKnowledgeTerm(item)}**：${item.explanation}`,
          `  - 对应原文：${getKnowledgeSnippet(item)}`,
          getKnowledgeNote(item) ? `  - 学习提示：${getKnowledgeNote(item)}` : null,
        ]),
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n\n');
}

export function buildQuizMarkdown(questions: QuizQuestion[]) {
  if (!questions.length) return '暂无练习题';

  const single = questions.filter((question) => getEffectiveQuizType(question) === 'single');
  const multiple = questions.filter((question) => getEffectiveQuizType(question) === 'multiple');
  const translation = questions.filter((question) => getEffectiveQuizType(question) === 'translation');

  return [
    '### 单选题',
    ...single.flatMap((question, index) => [
      `${index + 1}. ${question.question}`,
      ...question.options.map((option) => `   - ${option}`),
      `   - 正确答案：${question.answer.join('、')}`,
      `   - 解析：${question.explanation}`,
    ]),
    '',
    '### 多选题',
    ...multiple.flatMap((question, index) => [
      `${index + 1}. ${question.question}`,
      ...question.options.map((option) => `   - ${option}`),
      `   - 正确答案：${question.answer.join('、')}`,
      `   - 解析：${question.explanation}`,
    ]),
    '',
    '### 翻译题',
    ...translation.flatMap((question, index) => [
      `${index + 1}. ${question.question}`,
      `   - 原文答案：${question.answer.join('、')}`,
      `   - 解析：${question.explanation}`,
    ]),
  ].join('\n');
}

export function isSameAnswerSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const normalizedLeft = [...left].sort();
  const normalizedRight = [...right].sort();
  return normalizedLeft.every((item, index) => item === normalizedRight[index]);
}

export function getEffectiveQuizType(question: QuizQuestion) {
  if (question.type === 'translation') return 'translation';
  if (!question.options.length) return 'translation';
  return question.type;
}
