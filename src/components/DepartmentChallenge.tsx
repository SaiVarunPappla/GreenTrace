import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Swords, Timer, Trophy } from 'lucide-react';
import Confetti from './Confetti';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenger_name: string;
  defender_name: string;
  target_date: string;
  goal_type: string;
  is_active: boolean;
}

const DepartmentChallenge = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    const { data: rawChallenges } = await supabase
      .from('department_challenges')
      .select('*')
      .eq('is_active', true);

    if (!rawChallenges?.length) return;

    const { data: depts } = await supabase.from('departments').select('id, name');
    const deptMap = new Map((depts || []).map((d) => [d.id, d.name]));

    const mapped: Challenge[] = rawChallenges.map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      challenger_name: deptMap.get(c.challenger_dept_id) || 'Team A',
      defender_name: deptMap.get(c.defender_dept_id) || 'Team B',
      target_date: c.target_date,
      goal_type: c.goal_type,
      is_active: c.is_active,
    }));

    setChallenges(mapped);
  };

  const getDaysLeft = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleCelebrate = () => {
    setShowCelebration(true);
  };

  if (challenges.length === 0) return null;

  return (
    <>
      <Confetti isActive={showCelebration} onComplete={() => setShowCelebration(false)} />
      <div className="space-y-4">
        {challenges.map((challenge, i) => {
          const daysLeft = getDaysLeft(challenge.target_date);
          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-eco-warning/30 p-6 overflow-hidden"
              style={{
                background:
                  'linear-gradient(145deg, hsl(45 50% 10% / 0.3), hsl(var(--card)))',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-eco-warning via-primary to-eco-warning" />

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Swords className="w-5 h-5 text-eco-warning" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-eco-warning">
                      Active Challenge
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-foreground text-lg mb-1">
                    {challenge.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {challenge.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold">
                      {challenge.challenger_name}
                    </span>
                    <span className="text-muted-foreground text-xs font-bold">VS</span>
                    <span className="px-3 py-1 rounded-full bg-eco-warning/20 text-eco-warning text-sm font-semibold">
                      {challenge.defender_name}
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Timer className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}
                    </span>
                  </div>
                  {daysLeft === 0 && (
                    <button
                      onClick={handleCelebrate}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-eco-warning/20 text-eco-warning text-xs font-semibold hover:bg-eco-warning/30 transition-colors"
                    >
                      <Trophy className="w-3 h-3" />
                      Celebrate! 🎉
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
};

export default DepartmentChallenge;
