import { Trash2 } from 'lucide-react';
import type { RecentStudyRecord } from '../../types/recent';

interface RecentListProps {
  records: RecentStudyRecord[];
  onOpen: (record: RecentStudyRecord) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function RecentList({ records, onOpen, onDelete, onClear }: RecentListProps) {
  return (
    <section className="px-1 py-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Recent</h2>
        {records.length ? (
          <button className="text-xs font-semibold text-zinc-400 hover:text-coral" onClick={onClear}>
            清空
          </button>
        ) : null}
      </div>

      <div className="mt-3 space-y-1">
        {records.length ? (
          records.slice(0, 8).map((record) => (
            <article
              key={record.id}
              className="group flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-zinc-100/70 dark:hover:bg-zinc-900"
              onClick={() => onOpen(record)}
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm text-zinc-700 group-hover:text-zinc-950 group-hover:underline dark:text-zinc-300 dark:group-hover:text-white">{record.title}</h3>
              </div>
              <span className="hidden shrink-0 text-xs text-zinc-300 sm:inline">{formatDate(record.updatedAt)}</span>
              <button
                className="rounded-md p-1.5 text-zinc-300 opacity-0 transition hover:bg-coral/10 hover:text-coral group-hover:opacity-100"
                title="删除记录"
                aria-label="删除记录"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(record.id);
                }}
              >
                <Trash2 size={14} />
              </button>
            </article>
          ))
        ) : null}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
