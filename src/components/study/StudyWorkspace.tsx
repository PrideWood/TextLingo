'use client';

import {
  BookOpen,
  CircleHelp,
  ClipboardCopy,
  Columns2,
  FileText,
  LayoutDashboard,
  Quote,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { buildMarkdownExport } from '../../../lib/export/markdown';
import type { AnalysisResult, DifficultyRating, Language, UiLanguage } from '../../types';
import { ExportPage } from './ExportPage';
import { ExpressionsPage, GrammarPage, VocabularyPage } from './KnowledgeCategoryPage';
import { OriginalTranslationPage } from './OriginalTranslationPage';
import { QuizPage } from './QuizPage';
import { StudyOutline, type StudyNavItem } from './StudyOutline';
import { StudyPageFrame } from './StudyPageFrame';

interface StudyWorkspaceProps {
  sourceText: string;
  result: AnalysisResult;
  sourceLanguage: Language;
  targetLanguage: Language;
  uiLanguage: UiLanguage;
}

const navItemsBase: Array<Omit<StudyNavItem, 'label'> & { label: Record<UiLanguage, string> }> = [
  { id: 'overview', label: { zh: '总览', en: 'Overview' }, icon: LayoutDashboard },
  { id: 'compare', label: { zh: '原文 / 译文', en: 'Original & Translation' }, icon: Columns2 },
  { id: 'vocabulary', label: { zh: '重点词汇', en: 'Vocabulary' }, icon: BookOpen },
  { id: 'expressions', label: { zh: '常用表达', en: 'Expressions' }, icon: Quote },
  { id: 'grammar', label: { zh: '语法点', en: 'Grammar' }, icon: FileText },
  { id: 'quiz', label: { zh: '练习题', en: 'Quiz' }, icon: CircleHelp },
  { id: 'export', label: { zh: '导出 Markdown', en: 'Export / Markdown' }, icon: ClipboardCopy },
];

export function StudyWorkspace({ sourceText, result, sourceLanguage, targetLanguage, uiLanguage }: StudyWorkspaceProps) {
  const navItems = useMemo(() => navItemsBase.map((item) => ({ ...item, label: item.label[uiLanguage] })), [uiLanguage]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [visited, setVisited] = useState<Set<string>>(() => new Set(['overview']));

  const title = result.title?.trim() || 'Untitled Language Note';
  const knowledge = result.knowledge ?? { vocabulary: [], expressions: [], grammar: [] };
  const quiz = result.quiz ?? [];
  const markdown = useMemo(
    () => buildMarkdownExport({ title, sourceText, result, sourceLanguage, targetLanguage }),
    [result, sourceLanguage, sourceText, targetLanguage, title],
  );

  useEffect(() => {
    const current = navItems[currentPageIndex];
    setVisited((value) => new Set(value).add(current.id));
  }, [currentPageIndex, navItems]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        setCurrentPageIndex((index) => Math.min(index + 1, navItems.length - 1));
      }
      if (event.key === 'ArrowLeft') {
        setCurrentPageIndex((index) => Math.max(index - 1, 0));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navItems.length]);

  const goPrevious = () => setCurrentPageIndex((index) => Math.max(index - 1, 0));
  const goNext = () => setCurrentPageIndex((index) => Math.min(index + 1, navItems.length - 1));
  const current = navItems[currentPageIndex];

  return (
    <section className="flex flex-col gap-4 lg:h-[calc(100vh-128px)] lg:min-h-[680px] lg:flex-row">
      <StudyOutline items={navItems} currentIndex={currentPageIndex} visited={visited} onSelect={setCurrentPageIndex} />

      <div className="min-w-0 flex-1">
        <StudyPageFrame
          key={current.id}
          label={current.label}
          title={getPageTitle(current.id, title, uiLanguage)}
          currentIndex={currentPageIndex}
          total={navItems.length}
          onPrevious={goPrevious}
          onNext={goNext}
          previousLabel={uiLanguage === 'zh' ? '上一页' : 'Previous page'}
          nextLabel={uiLanguage === 'zh' ? '下一页' : 'Next page'}
        >
          {current.id === 'overview' ? (
            <OverviewPage
              title={title}
              sourceText={sourceText}
              translation={result.translation}
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              difficulty={result.difficulty ?? null}
              uiLanguage={uiLanguage}
              knowledgeCount={knowledge.vocabulary.length + knowledge.expressions.length + knowledge.grammar.length}
              quizCount={quiz.length}
            />
          ) : null}

          {current.id === 'compare' ? <OriginalTranslationPage sourceText={sourceText} translation={result.translation} /> : null}
          {current.id === 'vocabulary' ? <VocabularyPage items={knowledge.vocabulary} /> : null}
          {current.id === 'expressions' ? <ExpressionsPage items={knowledge.expressions} /> : null}
          {current.id === 'grammar' ? <GrammarPage items={knowledge.grammar} /> : null}
          {current.id === 'quiz' ? <QuizPage questions={quiz} sourceLanguage={sourceLanguage} /> : null}
          {current.id === 'export' ? (
            <ExportPage title={title} markdown={markdown} translation={result.translation} knowledge={knowledge} quiz={quiz} uiLanguage={uiLanguage} />
          ) : null}
        </StudyPageFrame>
      </div>
    </section>
  );
}

function OverviewPage({
  title,
  sourceText,
  translation,
  sourceLanguage,
  targetLanguage,
  difficulty,
  knowledgeCount,
  quizCount,
  uiLanguage,
}: {
  title: string;
  sourceText: string;
  translation?: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  difficulty: DifficultyRating | null;
  knowledgeCount: number;
  quizCount: number;
  uiLanguage: UiLanguage;
}) {
  const paragraphCount = sourceText.split(/\n\s*\n/).filter(Boolean).length || 1;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <article className="rounded-md border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-950">
        <p className="eyebrow">{uiLanguage === 'zh' ? '学习笔记' : 'Generated Note'}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
          {uiLanguage === 'zh'
            ? '这份学习材料已经拆成多个页面。可以用左侧目录、底部按钮，或键盘左右方向键逐页学习。'
            : 'This study note is split into pages. Use the outline, footer buttons, or keyboard arrows.'}
        </p>
        {difficulty ? <DifficultyBadge difficulty={difficulty} /> : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <OverviewMetric label={uiLanguage === 'zh' ? '语言方向' : 'Languages'} value={`${sourceLanguage} → ${targetLanguage}`} />
          <OverviewMetric label={uiLanguage === 'zh' ? '原文段落' : 'Paragraphs'} value={uiLanguage === 'zh' ? `${paragraphCount} 段` : `${paragraphCount}`} />
          <OverviewMetric label={uiLanguage === 'zh' ? '知识点' : 'Learning points'} value={uiLanguage === 'zh' ? `${knowledgeCount} 条` : `${knowledgeCount}`} />
          <OverviewMetric label={uiLanguage === 'zh' ? '练习题' : 'Quiz questions'} value={uiLanguage === 'zh' ? `${quizCount} 题` : `${quizCount}`} />
        </div>
      </article>

      <aside className="rounded-md border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-950">
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{uiLanguage === 'zh' ? '译文预览' : 'Translation preview'}</p>
        <p className="mt-3 line-clamp-[12] whitespace-pre-wrap break-words text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          {translation || '暂无译文'}
        </p>
      </aside>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: DifficultyRating }) {
  const stars = `${'★'.repeat(difficulty.stars)}${'☆'.repeat(5 - difficulty.stars)}`;

  return (
    <div className="mt-4 rounded-md border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-900">
      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {stars} · {difficulty.cefr} · {difficulty.label}
      </p>
      {difficulty.reason ? (
        <p className="mt-1 text-xs leading-6 text-zinc-500 dark:text-zinc-400">{difficulty.reason}</p>
      ) : null}
    </div>
  );
}

function OverviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">{value}</p>
    </div>
  );
}

function getPageTitle(pageId: string, noteTitle: string, uiLanguage: UiLanguage) {
  const titles: Record<string, string> = {
    overview: noteTitle,
    compare: uiLanguage === 'zh' ? '原文与译文对照' : 'Original & Translation',
    vocabulary: uiLanguage === 'zh' ? '重点词汇' : 'Vocabulary',
    expressions: uiLanguage === 'zh' ? '常用表达' : 'Expressions',
    grammar: uiLanguage === 'zh' ? '语法点' : 'Grammar',
    quiz: uiLanguage === 'zh' ? '练习题' : 'Quiz',
    export: uiLanguage === 'zh' ? 'Markdown 导出' : 'Markdown Export',
  };

  return titles[pageId] ?? noteTitle;
}
