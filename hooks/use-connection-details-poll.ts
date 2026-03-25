'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

function hasDocumentKeys(details: unknown): boolean {
  if (!details || typeof details !== 'object') return false;
  const d = details as Record<string, unknown>;
  return (
    (typeof d.pdf_key === 'string' && d.pdf_key.length > 0) ||
    (typeof d.html_key === 'string' && d.html_key.length > 0)
  );
}

export type ConnectionDetailsPollStatus =
  | 'idle'
  | 'polling'
  | 'ready'
  | 'timeout';

const MAX_MS = 5 * 60 * 1000;
const INTERVAL_MS = 12_000;

/**
 * Polls `connections.connection_details` for pdf_key/html_key after registration.
 */
export function useConnectionDetailsPoll(
  connectionId: string | null,
  enabled: boolean
): ConnectionDetailsPollStatus {
  const [status, setStatus] = useState<ConnectionDetailsPollStatus>('idle');

  useEffect(() => {
    if (!enabled || !connectionId) {
      setStatus('idle');
      return;
    }

    setStatus('polling');
    const supabase = createClient();
    const started = Date.now();
    let cancelled = false;

    const check = async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('connections')
        .select('connection_details')
        .eq('id', connectionId)
        .maybeSingle();

      if (cancelled) return true;
      if (error) return false;

      if (data && hasDocumentKeys(data.connection_details)) {
        setStatus('ready');
        return true;
      }
      return false;
    };

    let intervalId: ReturnType<typeof setInterval>;

    const tick = async () => {
      const done = await check();
      if (done || cancelled) {
        clearInterval(intervalId);
        return;
      }
      if (Date.now() - started >= MAX_MS) {
        setStatus('timeout');
        clearInterval(intervalId);
      }
    };

    void tick();
    intervalId = setInterval(() => void tick(), INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [connectionId, enabled]);

  return status;
}
