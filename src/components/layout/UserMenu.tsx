'use client';

import Link from 'next/link';
import { BarChart3, ClipboardCopy, LogIn, LogOut, Settings, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { copyTextToClipboard } from '../../../lib/clipboard';
import { UsageDetailsModal } from '../progress/UsageDetailsModal';

interface UserMenuProps {
  markdown?: string;
}

export function UserMenu({ markdown }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const startCloseTimer = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 500);
  };

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-user-menu]')) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      clearCloseTimer();
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  const copyMarkdown = async () => {
    if (!markdown) return;
    const ok = await copyTextToClipboard(markdown);
    if (!ok) return;
    setCopied(true);
    setOpen(false);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative" data-user-menu onMouseEnter={clearCloseTimer} onMouseLeave={startCloseTimer}>
      <button
        className="inline-flex min-h-10 items-center gap-2 rounded-md bg-transparent px-2 py-1.5 text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-mint/10 text-mint">
          <UserRound size={18} />
        </span>
        <span className="hidden text-sm md:inline">Guest learner</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-40 w-64 rounded-md border border-black/10 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-zinc-900">
          <div className="border-b border-black/10 px-3 py-3 dark:border-white/10">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Guest learner</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Local learning profile</p>
          </div>

          <Link className="menu-item" href="/settings" onClick={() => setOpen(false)}>
            <Settings size={16} />
            Settings
          </Link>
          <button
            className="menu-item w-full"
            onClick={() => {
              setStatsOpen(true);
              setOpen(false);
            }}
          >
            <BarChart3 size={16} />
            Learning stats
          </button>
          <button className="menu-item w-full" onClick={copyMarkdown} disabled={!markdown}>
            <ClipboardCopy size={16} />
            {copied ? 'Copied Markdown' : 'Copy Markdown'}
          </button>
          <button className="menu-item w-full" disabled>
            <LogIn size={16} />
            Sign in soon
          </button>
          <button className="menu-item w-full" disabled>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      ) : null}

      <UsageDetailsModal open={statsOpen} onClose={() => setStatsOpen(false)} />
    </div>
  );
}
