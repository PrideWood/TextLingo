'use client';

import { CheckCircle2, ClipboardCopy, Copy, RotateCcw, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { buildMarkdownExport } from '../../../lib/export/markdown';
import type { AnalysisResult, AnalysisState, KnowledgeResult, KnowledgeSection, Language, QuizQuestion } from '../../types';
import { getKnowledgeNote, getKnowledgeSnippet, getKnowledgeTerm } from '../study/studyUtils';

interface ResultDocumentProps {
  sourceText: string;
  analysis: AnalysisState;
  sourceLanguage: Language;
}

export function ResultDocument({ sourceText, analysis, sourceLanguage }: ResultDocumentProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const title = analysis.data.title?.trim() || 'Untitled Language Note';
  const result = analysis.data as AnalysisResult;
  const legacyKnowledge = knowledgeToSections(result.knowledge);
  const markdown = useMemo(
    () =>
      buildMarkdownExport({
        title,
        sourceText,
        result,
      }),
    [result, sourceText, title],
  );

  const copy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1200);
  };

  if (analysis.status === 'loading') {
    return (
      <section className="panel min-h-[720px]">
        <div className="flex min-h-[620px] items-center justify-center">
          <div className="max-w-lg text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-mint/20 border-t-mint" />
            <p className="eyebrow">Analyzing</p>
            <h2 className="section-title">正在整理成可沉淀的学习笔记</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              标题、译文、知识点和练习题会按设置自动生成，并整理成适合复制到 Obsidian 的结构。
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (analysis.status === 'error') {
    return (
      <section className="panel min-h-[720px]">
        <div className="flex min-h-[620px] items-center justify-center">
          <div className="max-w-lg rounded-md border border-coral/30 bg-coral/10 p-6 text-center">
            <p className="eyebrow text-coral">Request Error</p>
            <h2 className="section-title text-coral">这次分析没有完成</h2>
            <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-200">{analysis.error || '服务请求失败'}</p>
          </div>
        </div>
      </section>
    );
  }

  if (analysis.status !== 'success') {
    return (
      <section className="panel min-h-[720px]">
        <div className="flex min-h-[620px] items-center justify-center">
          <div className="max-w-lg text-center">
            <p className="eyebrow">Quick Analyze</p>
            <h2 className="section-title">把一段语言素材整理成学习工作台</h2>
            <p className="mt-3 leading-7 text-zinc-500 dark:text-zinc-400">
              粘贴原文后点击一次开始分析，页面会自动生成标题、译文、知识点和练习题。
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel min-h-[720px]">
      <div className="flex flex-col gap-4 border-b border-black/10 pb-5 dark:border-white/10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow">Study Note</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            阅读、复制、继续整理都围绕这一个结果文档完成。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton label="复制全部 Markdown" copied={copiedKey === 'all'} onClick={() => copy('all', markdown)} />
          <CopyButton
            label="复制译文"
            copied={copiedKey === 'translation'}
            onClick={() => copy('translation', analysis.data.translation || '')}
            disabled={!analysis.data.translation}
          />
          <CopyButton
            label="复制知识点"
            copied={copiedKey === 'knowledge'}
            onClick={() => copy('knowledge', buildKnowledgeMarkdown(legacyKnowledge))}
            disabled={!legacyKnowledge.length}
          />
          <CopyButton
            label="复制练习题"
            copied={copiedKey === 'quiz'}
            onClick={() => copy('quiz', buildQuizMarkdown(analysis.data.quiz ?? []))}
            disabled={!analysis.data.quiz?.length}
          />
        </div>
      </div>

      <article className="mt-8 space-y-8">
        <MarkdownSection title="原文">
          <p className="whitespace-pre-wrap break-words text-base leading-8 text-zinc-700 dark:text-zinc-200">{sourceText}</p>
        </MarkdownSection>

        <MarkdownSection
          title="译文"
          action={
            <CopyTextLink copied={copiedKey === 'translation'} onClick={() => copy('translation', analysis.data.translation || '')} />
          }
        >
          <p className="whitespace-pre-wrap break-words text-base leading-8 text-zinc-800 dark:text-zinc-100">
            {analysis.data.translation || '暂无译文'}
          </p>
        </MarkdownSection>

        <MarkdownSection
          title="知识点"
          action={
            <CopyTextLink
              copied={copiedKey === 'knowledge'}
              onClick={() => copy('knowledge', buildKnowledgeMarkdown(legacyKnowledge))}
            />
          }
        >
          <div className="space-y-6">
            {legacyKnowledge.map((section) => (
              <KnowledgeBlock key={section.title} section={section} />
            ))}
          </div>
        </MarkdownSection>

        <MarkdownSection
          title="练习题"
          action={
            <CopyTextLink copied={copiedKey === 'quiz'} onClick={() => copy('quiz', buildQuizMarkdown(analysis.data.quiz ?? []))} />
          }
        >
          <div className="space-y-6">
            <QuizGroup
              title={sourceLanguage === 'English' ? 'Single choice' : '单选题'}
              questions={(analysis.data.quiz ?? []).filter((question) => question.type === 'single')}
              sourceLanguage={sourceLanguage}
            />
            <QuizGroup
              title={sourceLanguage === 'English' ? 'Multiple choice' : '多选题'}
              questions={(analysis.data.quiz ?? []).filter((question) => question.type === 'multiple')}
              sourceLanguage={sourceLanguage}
            />
          </div>
        </MarkdownSection>
      </article>
    </section>
  );
}

function MarkdownSection({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">## {title}</h2>
        {action}
      </div>
      <div className="rounded-md border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-950">{children}</div>
    </section>
  );
}

function KnowledgeBlock({ section }: { section: KnowledgeSection }) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">### {section.title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{section.intro}</p>
      <div className="mt-4 space-y-4">
        {section.items.map((item) => (
          <article key={`${section.title}-${getKnowledgeTerm(item)}-${getKnowledgeSnippet(item)}`} className="rounded-md bg-white p-4 shadow-sm dark:bg-zinc-900">
            <p className="text-base font-semibold text-zinc-900 dark:text-white">{getKnowledgeTerm(item)}</p>
            <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-200">{item.explanation}</p>
            <div className="mt-3 rounded-md border border-dashed border-mint/30 bg-mint/5 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">
              <p className="font-semibold text-mint">对应原文</p>
              <p className="mt-1 whitespace-pre-wrap break-words">{getKnowledgeSnippet(item)}</p>
            </div>
            {getKnowledgeNote(item) ? <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">学习提示：{getKnowledgeNote(item)}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function QuizGroup({
  title,
  questions,
  sourceLanguage,
}: {
  title: string;
  questions: QuizQuestion[];
  sourceLanguage: Language;
}) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setAnswers({});
    setSubmitted({});
  }, [questions]);

  const updateSingle = (questionId: string, option: string) => {
    setAnswers((current) => ({ ...current, [questionId]: [option] }));
  };

  const updateMultiple = (questionId: string, option: string) => {
    setAnswers((current) => {
      const selected = current[questionId] ?? [];
      return {
        ...current,
        [questionId]: selected.includes(option)
          ? selected.filter((item) => item !== option)
          : [...selected, option],
      };
    });
  };

  const submitQuestion = (questionId: string) => {
    setSubmitted((current) => ({ ...current, [questionId]: true }));
  };

  const resetQuestion = (questionId: string) => {
    setAnswers((current) => {
      const next = { ...current };
      delete next[questionId];
      return next;
    });
    setSubmitted((current) => {
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  };

  return (
    <section>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">### {title}</h3>
      <div className="mt-4 space-y-4">
        {questions.length ? (
          questions.map((question, index) => (
            <article key={question.id} className="rounded-md bg-white p-4 shadow-sm dark:bg-zinc-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-semibold leading-7 text-zinc-900 dark:text-white">
                  {index + 1}. {question.question}
                </p>
                <span className="rounded-md bg-mint/10 px-2 py-1 text-xs font-semibold text-mint">
                  {getQuizTypeLabel(question.type, sourceLanguage)}
                </span>
              </div>
              <fieldset className="mt-3 space-y-2 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                <legend className="sr-only">{question.question}</legend>
                {question.options.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-black/10 bg-zinc-50 px-3 py-2 transition hover:border-mint/40 dark:border-white/10 dark:bg-zinc-950"
                  >
                    <input
                      className="mt-1 accent-mint"
                      type={question.type === 'single' ? 'radio' : 'checkbox'}
                      name={question.id}
                      value={option}
                      checked={(answers[question.id] ?? []).includes(option)}
                      disabled={submitted[question.id]}
                      onChange={() =>
                        question.type === 'single'
                          ? updateSingle(question.id, option)
                          : updateMultiple(question.id, option)
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </fieldset>

              <div className="mt-4 flex flex-wrap gap-2">
                {submitted[question.id] ? (
                  <button className="btn-secondary py-2 text-sm" onClick={() => resetQuestion(question.id)}>
                    <RotateCcw size={16} />
                    重新作答
                  </button>
                ) : (
                  <button
                    className="btn-primary py-2 text-sm"
                    onClick={() => submitQuestion(question.id)}
                    disabled={!(answers[question.id] ?? []).length}
                  >
                    <CheckCircle2 size={16} />
                    提交答案
                  </button>
                )}
              </div>

              {submitted[question.id] ? (
                <QuizFeedback question={question} userAnswer={answers[question.id] ?? []} />
              ) : null}
            </article>
          ))
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">暂无 {title}</p>
        )}
      </div>
    </section>
  );
}

function QuizFeedback({ question, userAnswer }: { question: QuizQuestion; userAnswer: string[] }) {
  const correct = isSameAnswerSet(userAnswer, question.answer);

  return (
    <div
      className={`mt-4 rounded-md border px-4 py-3 text-sm leading-6 ${
        correct
          ? 'border-mint/30 bg-mint/10 text-zinc-700 dark:text-zinc-200'
          : 'border-coral/30 bg-coral/10 text-zinc-700 dark:text-zinc-200'
      }`}
    >
      <p className={`flex items-center gap-2 font-semibold ${correct ? 'text-mint' : 'text-coral'}`}>
        {correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
        {correct ? '回答正确' : '还差一点'}
      </p>
      <p className="mt-2">你的选择：{userAnswer.length ? userAnswer.join('、') : '未选择'}</p>
      <p>正确答案：{question.answer.join('、')}</p>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">{question.explanation}</p>
    </div>
  );
}

function isSameAnswerSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const normalizedLeft = [...left].sort();
  const normalizedRight = [...right].sort();
  return normalizedLeft.every((item, index) => item === normalizedRight[index]);
}

function getQuizTypeLabel(type: QuizQuestion['type'], sourceLanguage: Language) {
  if (sourceLanguage === 'English') {
    return type === 'single' ? 'Single choice' : 'Multiple choice';
  }

  return type === 'single' ? '单选题' : '多选题';
}

function CopyButton({
  label,
  copied,
  onClick,
  disabled,
}: {
  label: string;
  copied: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button className="btn-secondary py-2 text-sm" onClick={onClick} disabled={disabled}>
      {label.includes('全部') ? <Copy size={16} /> : <ClipboardCopy size={16} />}
      {copied ? '已复制' : label}
    </button>
  );
}

function CopyTextLink({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <button className="inline-flex items-center gap-2 text-sm font-semibold text-mint hover:text-mint/80" onClick={onClick}>
      <ClipboardCopy size={16} />
      {copied ? '已复制' : '复制本节'}
    </button>
  );
}

function buildKnowledgeMarkdown(knowledge: KnowledgeSection[]) {
  if (!knowledge.length) return '暂无知识点';

  return knowledge
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

function knowledgeToSections(knowledge?: KnowledgeResult): KnowledgeSection[] {
  if (!knowledge) return [];

  return [
    { title: '重点词汇', intro: '', items: knowledge.vocabulary },
    { title: '常用表达', intro: '', items: knowledge.expressions },
    { title: '语法点', intro: '', items: knowledge.grammar },
  ].filter((section) => section.items.length);
}

function buildQuizMarkdown(questions: QuizQuestion[]) {
  if (!questions.length) return '暂无练习题';

  const single = questions.filter((question) => question.type === 'single');
  const multiple = questions.filter((question) => question.type === 'multiple');

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
  ].join('\n');
}
