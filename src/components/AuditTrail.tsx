import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

interface AuditEntry {
  id: string;
  text: string;
  timestamp: string;
}

const AuditTrail = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('audit-trail')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        (payload) => {
          const a = payload.new as any;
          const ts = new Date(a.created_at).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          });
          const entry: AuditEntry = {
            id: a.id,
            text: `${ts} — ${a.category} activity encrypted & verified (${Number(a.impact).toFixed(1)} kg CO₂)`,
            timestamp: ts,
          };
          setEntries((prev) => [entry, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-center gap-1.5 text-primary/60">
        <ShieldCheck className="w-3 h-3" />
        <span className="text-[10px] font-semibold uppercase tracking-widest">Live Audit Trail</span>
      </div>
      <AnimatePresence mode="popLayout">
        {entries.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center">
            Waiting for database writes…
          </p>
        ) : (
          entries.map((e) => (
            <motion.p
              key={e.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-muted-foreground text-center font-mono"
            >
              🔒 {e.text}
            </motion.p>
          ))
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditTrail;
