import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio } from 'lucide-react';

interface FeedItem {
  id: string;
  text: string;
  timestamp: Date;
  isNew?: boolean;
}

const categoryEmoji: Record<string, string> = {
  transport: '🚇',
  diet: '🥗',
  utility: '⚡',
};

const LiveActivityFeed = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [pingActive, setPingActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('activities')
        .select('id, category, name, impact, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setItems(
          data.reverse().map(a => ({
            id: a.id,
            text: `${categoryEmoji[a.category] || '📊'} Someone just logged ${a.name} — ${Number(a.impact).toFixed(1)} kg CO₂`,
            timestamp: new Date(a.created_at),
          }))
        );
      }
    };

    fetchRecent();

    const channel = supabase
      .channel('live-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        (payload) => {
          const a = payload.new as any;
          const newItem: FeedItem = {
            id: a.id,
            text: `${categoryEmoji[a.category] || '📊'} Someone just logged ${a.name} — ${Number(a.impact).toFixed(1)} kg CO₂`,
            timestamp: new Date(a.created_at),
            isNew: true,
          };
          setItems(prev => [...prev.slice(-19), newItem]);

          // Trigger ping animation
          setPingActive(true);
          setTimeout(() => setPingActive(false), 1500);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border"
      style={{
        background: 'linear-gradient(180deg, hsl(160 30% 5% / 0.95), hsl(160 30% 5% / 0.98))',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="container mx-auto px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0 relative">
          <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Live</span>
          {/* Ping ring on new data */}
          <AnimatePresence>
            {pingActive && (
              <motion.div
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 rounded-full border-2 border-red-400"
                style={{ left: -2, top: -2, right: 'auto', bottom: 'auto', width: 20, height: 20 }}
              />
            )}
          </AnimatePresence>
        </div>
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto scrollbar-hide flex items-center gap-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          <AnimatePresence>
            {items.map(item => (
              <motion.span
                key={item.id}
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40 }}
                className={`text-xs whitespace-nowrap shrink-0 ${
                  item.isNew ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                {item.text}
                <span className="text-primary/40 ml-2">
                  {item.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LiveActivityFeed;
