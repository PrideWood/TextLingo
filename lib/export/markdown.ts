import type { AnalysisResult, KnowledgeSection, QuizQuestion } from '../../src/types';
import { getKnowledgeNote, getKnowledgeSnippet, getKnowledgeTerm } from '../../src/components/study/studyUtils';

function knowledgeSectionMarkdown(section: KnowledgeSection) {
  const lines = [`### ${section.title}`, section.intro];

  for (const item of section.items) {
    lines.push(`- **${getKnowledgeTerm(item)}**：${item.explanation}`);
    lines.push(`  - 对应原文：${getKnowledgeSnippet(item)}`);
    if (getKnowledgeNote(item)) {
      lines.push(`  - 学习提示：${getKnowledgeNote(item)}`);
    }
  }

  return lines.join('\n');
}

function quizSectionMarkdown(typeLabel: string, questions: QuizQuestion[]) {
  const lines = [`### ${typeLabel}`];

  questions.forEach((question, index) => {
    lines.push(`${index + 1}. ${question.question}`);
    question.options.forEach((option) => lines.push(`   - ${option}`));
    lines.push(`   - ${question.type === 'translation' ? '原文答案' : '正确答案'}：${question.answer.join('、')}`);
    lines.push(`   - 解析：${question.explanation}`);
  });

  return lines.join('\n');
}

export function buildMarkdownExport(params: {
  title: string;
  sourceText: string;
  result: AnalysisResult;
  sourceLanguage?: string;
  targetLanguage?: string;
  createdAt?: string;
}) {
  const { title, sourceText, result, sourceLanguage, targetLanguage, createdAt } = params;
  const frontmatter = [
    '---',
    `title: ${yamlString(title)}`,
    sourceLanguage ? `source_language: ${yamlString(sourceLanguage)}` : null,
    targetLanguage ? `target_language: ${yamlString(targetLanguage)}` : null,
    result.difficulty ? `difficulty_stars: ${result.difficulty.stars}` : null,
    result.difficulty ? `difficulty_cefr: ${yamlString(result.difficulty.cefr)}` : null,
    result.difficulty ? `difficulty_label: ${yamlString(result.difficulty.label)}` : null,
    `created_at: ${yamlString(createdAt ?? new Date().toISOString())}`,
    '---',
  ].filter(Boolean);
  const sections = [
    frontmatter.join('\n'),
    '',
    `# ${title}`,
    '',
    '## 原文',
    sourceText,
    '',
    '## 译文',
    result.translation || '暂无译文',
    '',
    '## 知识点',
  ];

  const knowledgeSections: KnowledgeSection[] = [
    { title: '重点词汇', intro: '', items: result.knowledge?.vocabulary ?? [] },
    { title: '常用表达', intro: '', items: result.knowledge?.expressions ?? [] },
    { title: '语法点', intro: '', items: result.knowledge?.grammar ?? [] },
  ];
  const filledKnowledgeSections = knowledgeSections.filter((section) => section.items.length);

  if (filledKnowledgeSections.length) {
    sections.push(filledKnowledgeSections.map(knowledgeSectionMarkdown).join('\n\n'));
  } else {
    sections.push('暂无知识点');
  }

  sections.push('', '## 练习题');
  const single = result.quiz?.filter((question) => question.type === 'single') ?? [];
  const multiple = result.quiz?.filter((question) => question.type === 'multiple') ?? [];
  const translation = result.quiz?.filter((question) => question.type === 'translation') ?? [];
  sections.push(single.length ? quizSectionMarkdown('单选题', single) : '### 单选题\n暂无');
  sections.push('', multiple.length ? quizSectionMarkdown('多选题', multiple) : '### 多选题\n暂无');
  sections.push('', translation.length ? quizSectionMarkdown('翻译题', translation) : '### 翻译题\n暂无');

  return sections.join('\n');
}

function yamlString(value: string) {
  return JSON.stringify(value ?? '');
}
