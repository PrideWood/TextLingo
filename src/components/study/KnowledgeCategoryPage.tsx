import type { KnowledgeItem } from '../../types';
import { getKnowledgeNote, getKnowledgeSnippet, getKnowledgeTerm } from './studyUtils';

interface KnowledgeCategoryPageProps {
  items: KnowledgeItem[];
  intro: string;
  pageId: 'vocabulary' | 'expressions' | 'grammar';
  title: string;
  emptyText: string;
}

export function VocabularyPage({ items }: { items: KnowledgeItem[] }) {
  return <KnowledgeCategoryPage pageId="vocabulary" title="重点词汇" intro="从原文中抽出的词汇和短语。" items={items} emptyText="No vocabulary items generated yet." />;
}

export function ExpressionsPage({ items }: { items: KnowledgeItem[] }) {
  return <KnowledgeCategoryPage pageId="expressions" title="常用表达" intro="可以迁移到真实表达里的短语和句式。" items={items} emptyText="No expression items generated yet." />;
}

export function GrammarPage({ items }: { items: KnowledgeItem[] }) {
  return <KnowledgeCategoryPage pageId="grammar" title="语法点" intro="关注结构、时态、连接方式和可复用模式。" items={items} emptyText="No grammar items generated yet." />;
}

function KnowledgeCategoryPage({ items, intro, pageId, title, emptyText }: KnowledgeCategoryPageProps) {
  if (!items.length) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-md border border-dashed border-black/10 bg-zinc-50 p-6 text-center dark:border-white/10 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {intro ? <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">{intro}</p> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((item, index) => (
          <article
            id={`${pageId}-item-${index}`}
            key={`${title}-${getKnowledgeTerm(item)}-${getKnowledgeSnippet(item)}`}
            className="scroll-mt-4 rounded-md border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950"
          >
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
    </div>
  );
}
