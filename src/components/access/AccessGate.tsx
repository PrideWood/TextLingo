'use client';

import { LockKeyhole, Loader2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { clearAccessGrant, getStoredAccessCode, hasStoredAccessGrant, storeAccessGrant } from '../../../lib/client/access';
import type { ApiResponse } from '../../types';

interface AccessGateProps {
  onGranted: () => void;
  initialMessage?: string;
}

export function AccessGate({ onGranted, initialMessage = '' }: AccessGateProps) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'checking' | 'idle' | 'submitting'>('checking');
  const [error, setError] = useState(initialMessage);

  useEffect(() => {
    let alive = true;

    async function verifyStoredAccess() {
      const storedCode = getStoredAccessCode();
      if (storedCode) {
        setCode(storedCode);
      }

      if (!storedCode) {
        const devAccess = await verifyCode('');
        if (alive && devAccess.ok) {
          storeAccessGrant('');
          onGranted();
          return;
        }

        if (alive) {
          clearAccessGrant();
          setStatus('idle');
        }
        return;
      }

      if (!hasStoredAccessGrant()) {
        setStatus('idle');
        return;
      }

      const result = await verifyCode(storedCode);
      if (!alive) return;

      if (result.ok) {
        storeAccessGrant(storedCode);
        onGranted();
      } else {
        clearAccessGrant();
        setError(initialMessage || '');
        setStatus('idle');
      }
    }

    verifyStoredAccess();

    return () => {
      alive = false;
    };
  }, [initialMessage, onGranted]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError('请输入访问码。');
      return;
    }

    setStatus('submitting');
    setError('');
    const result = await verifyCode(trimmedCode);

    if (result.ok) {
      storeAccessGrant(trimmedCode);
      onGranted();
      return;
    }

    clearAccessGrant();
    setError(result.error || '访问码无效。');
    setStatus('idle');
  };

  if (status === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cloud px-5 text-ink dark:bg-zinc-950 dark:text-zinc-100">
        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 size={18} className="animate-spin" />
          Checking access...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud px-5 text-ink dark:bg-zinc-950 dark:text-zinc-100">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-mint/10 text-mint">
          <LockKeyhole size={22} />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight">TextLingo</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Enter your access code to open the language learning workspace.
        </p>

        <form className="mt-7 rounded-xl bg-white p-3 text-left shadow-soft dark:bg-zinc-900" onSubmit={submit}>
          <label className="sr-only" htmlFor="textlingo-access-code">
            Access code
          </label>
          <input
            id="textlingo-access-code"
            className="input h-12"
            type="password"
            value={code}
            autoFocus
            placeholder="Access code"
            onChange={(event) => setCode(event.target.value)}
          />
          <button className="btn-primary mt-3 h-11 w-full" type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? <Loader2 size={16} className="animate-spin" /> : null}
            Continue
          </button>
        </form>

        {error ? <p className="mt-4 rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p> : null}
      </section>
    </main>
  );
}

async function verifyCode(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('/api/access/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    });
    const json = (await response.json().catch(() => null)) as ApiResponse<{ granted: true }> | null;

    if (!json || typeof json.ok !== 'boolean') {
      return { ok: false, error: 'Access verification failed.' };
    }

    return json.ok ? { ok: true } : { ok: false, error: json.error || 'Invalid access code' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, error: 'Access verification timed out. Please check the local dev server.' };
    }

    return { ok: false, error: 'Access verification failed.' };
  } finally {
    window.clearTimeout(timeout);
  }
}
