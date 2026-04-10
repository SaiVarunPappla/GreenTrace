import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type RealtimeCallback = () => void;

/**
 * Subscribe to Supabase Realtime changes on a given table.
 * The callback is debounced to prevent excessive re-renders.
 */
export function useRealtimeSubscription(
  table: string,
  callback: RealtimeCallback,
  options?: { event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE'; debounceMs?: number }
) {
  const { event = '*', debounceMs = 500 } = options || {};
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const debouncedCallback = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => callbackRef.current(), debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}-${event}`)
      .on(
        'postgres_changes',
        { event, schema: 'public', table },
        debouncedCallback
      )
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [table, event, debouncedCallback]);
}
