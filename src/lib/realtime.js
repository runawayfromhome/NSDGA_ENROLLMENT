import { supabase } from './supabase';

// Realtime events only invalidate the current view; callers re-fetch through
// their existing data-layer functions so RLS and derived UI state stay intact.
export function subscribeToTable(table, { channelName, filter, onChange }) {
  const channel = supabase
    .channel(channelName || `realtime-${table}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table,
      ...(filter ? { filter } : {}),
    }, onChange)
    .subscribe((status, error) => {
      if (error || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[realtime] ${table} subscription ${status.toLowerCase()}`, error || '');
      }
    });

  return () => { supabase.removeChannel(channel); };
}
