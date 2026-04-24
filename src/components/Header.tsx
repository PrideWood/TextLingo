'use client';

import { UserMenu } from './layout/UserMenu';

interface HeaderProps {
  markdown?: string;
}

export function Header({ markdown }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">TextLingo</h1>
        <div className="flex items-center">
          <UserMenu markdown={markdown} />
        </div>
      </div>
    </header>
  );
}
