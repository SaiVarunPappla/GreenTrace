import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Trophy, Medal, Users, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface DepartmentScore {
  id: string;
  name: string;
  memberCount: number;
  totalEmissions: number;
  greenScore: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<DepartmentScore[]>([]);
  const [userDept, setUserDept] = useState<string | null>(null);
  const [availableDepts, setAvailableDepts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Fetch departments
      const { data: depts } = await supabase.from('departments').select('*');
      setAvailableDepts(depts || []);

      // Fetch user's membership
      if (user) {
        const { data: membership } = await supabase
          .from('department_members')
          .select('department_id')
          .eq('user_id', user.id)
          .maybeSingle();
        setUserDept(membership?.department_id || null);
      }

      // Fetch members with activities for scoring
      const { data: members } = await supabase
        .from('department_members')
        .select('department_id, user_id');

      const { data: activities } = await supabase
        .from('activities')
        .select('user_id, impact');

      // Calculate department scores
      const deptScores: DepartmentScore[] = (depts || []).map(dept => {
        const deptMembers = (members || []).filter(m => m.department_id === dept.id);
        const memberIds = deptMembers.map(m => m.user_id);
        const deptActivities = (activities || []).filter(a => memberIds.includes(a.user_id));
        const totalEmissions = deptActivities.reduce((sum, a) => sum + (Number(a.impact) || 0), 0);
        const memberCount = deptMembers.length;
        // Green Score: lower emissions per member = higher score
        const avgEmissions = memberCount > 0 ? totalEmissions / memberCount : 0;
        const greenScore = Math.max(0, Math.round(1000 - avgEmissions * 10));

        return {
          id: dept.id,
          name: dept.name,
          memberCount,
          totalEmissions: Math.round(totalEmissions * 100) / 100,
          greenScore,
        };
      }).sort((a, b) => b.greenScore - a.greenScore);

      setDepartments(deptScores);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const joinDepartment = async (deptId: string) => {
    if (!user) return;

    // Leave existing department first
    if (userDept) {
      await supabase.from('department_members').delete().eq('user_id', user.id);
    }

    const { error } = await supabase.from('department_members').insert({
      user_id: user.id,
      department_id: deptId,
    });

    if (error) {
      toast.error('Failed to join department');
    } else {
      setUserDept(deptId);
      toast.success('Joined department! 🎉');
      fetchLeaderboard();
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-300" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{index + 1}</span>;
  };

  const getRankBorder = (index: number) => {
    if (index === 0) return 'border-yellow-500/40';
    if (index === 1) return 'border-gray-400/30';
    if (index === 2) return 'border-amber-600/30';
    return 'border-border';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-secondary/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Join department prompt */}
      {!userDept && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/30 p-6"
          style={{
            background: 'linear-gradient(145deg, hsl(140 35% 8% / 0.8), hsl(var(--card)))',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h4 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Join Your Department
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availableDepts.map(dept => (
              <button
                key={dept.id}
                onClick={() => joinDepartment(dept.id)}
                className="px-4 py-2 rounded-xl bg-secondary/50 hover:bg-primary/20 border border-border hover:border-primary/40 text-sm text-foreground transition-all"
              >
                {dept.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Leaderboard */}
      <div className="space-y-3">
        {departments.map((dept, index) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative rounded-2xl border ${getRankBorder(index)} p-5 overflow-hidden transition-all ${
              dept.id === userDept ? 'ring-2 ring-primary/50' : ''
            }`}
            style={{
              background: index === 0
                ? 'linear-gradient(145deg, hsl(45 50% 10% / 0.4), hsl(var(--card)))'
                : 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card)))',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center gap-4">
              {getRankIcon(index)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-semibold text-foreground">{dept.name}</h4>
                  {dept.id === userDept && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/20 text-primary">
                      Your Team
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{dept.memberCount} members</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-eco-warning" />
                  <span className="text-xl font-display font-bold text-foreground">{dept.greenScore}</span>
                </div>
                <p className="text-xs text-muted-foreground">Green Score</p>
              </div>
              <div className="text-right min-w-[80px]">
                <p className="text-sm font-medium text-foreground">{dept.totalEmissions.toFixed(1)} kg</p>
                <p className="text-xs text-muted-foreground">Total CO₂</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
