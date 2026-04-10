import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Building2, Users, Award, TrendingDown } from 'lucide-react';
import { formatINR } from '@/lib/carbonCalculator';

interface OrgStats {
  totalEmployees: number;
  totalEmissions: number;
  avgEmissionsPerEmployee: number;
  totalActivities: number;
  greenestEmployee: { name: string; emissions: number } | null;
  departmentAvgWaste: { name: string; avgWaste: number }[];
}

const OrganizationView = () => {
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrgStats();

    const channel = supabase
      .channel('org-view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
        fetchOrgStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrgStats = async () => {
    try {
      const [activitiesRes, profilesRes, membersRes, deptsRes] = await Promise.all([
        supabase.from('activities').select('user_id, impact, category'),
        supabase.rpc('get_public_profiles'),
        supabase.from('department_members').select('user_id, department_id'),
        supabase.from('departments').select('id, name'),
      ]);

      const activities = activitiesRes.data || [];
      const profiles = profilesRes.data || [];
      const members = membersRes.data || [];
      const depts = deptsRes.data || [];

      const uniqueUsers = new Set(activities.map(a => a.user_id));
      const totalEmissions = activities.reduce((s, a) => s + (Number(a.impact) || 0), 0);

      // Greenest employee (lowest emissions)
      const userEmissions: Record<string, number> = {};
      activities.forEach(a => {
        userEmissions[a.user_id] = (userEmissions[a.user_id] || 0) + (Number(a.impact) || 0);
      });

      let greenestEmployee: OrgStats['greenestEmployee'] = null;
      if (Object.keys(userEmissions).length > 0) {
        const [greenestId, greenestVal] = Object.entries(userEmissions)
          .sort(([, a], [, b]) => a - b)[0];
        const profile = profiles.find(p => p.id === greenestId);
        greenestEmployee = {
          name: profile?.display_name || 'Anonymous',
          emissions: greenestVal,
        };
      }

      // Department avg waste
      const departmentAvgWaste = depts.map(dept => {
        const deptMembers = members.filter(m => m.department_id === dept.id);
        const memberIds = deptMembers.map(m => m.user_id);
        const deptEmissions = activities
          .filter(a => memberIds.includes(a.user_id))
          .reduce((s, a) => s + (Number(a.impact) || 0), 0);
        const avgWaste = deptMembers.length > 0
          ? (deptEmissions * 12) / deptMembers.length // convert to INR waste
          : 0;
        return { name: dept.name, avgWaste };
      }).sort((a, b) => a.avgWaste - b.avgWaste);

      setStats({
        totalEmployees: uniqueUsers.size,
        totalEmissions,
        avgEmissionsPerEmployee: uniqueUsers.size > 0 ? totalEmissions / uniqueUsers.size : 0,
        totalActivities: activities.length,
        greenestEmployee,
        departmentAvgWaste,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 rounded-2xl bg-secondary/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Campus Footprint',
            value: `${stats.totalEmissions.toFixed(1)} kg`,
            icon: Building2,
            color: 'text-eco-sky',
            bg: 'bg-eco-sky/10',
          },
          {
            label: 'Active Employees',
            value: stats.totalEmployees.toString(),
            icon: Users,
            color: 'text-primary',
            bg: 'bg-primary/10',
          },
          {
            label: 'Avg per Employee',
            value: `${stats.avgEmissionsPerEmployee.toFixed(1)} kg`,
            icon: TrendingDown,
            color: 'text-eco-warning',
            bg: 'bg-eco-warning/10',
          },
          {
            label: 'Total Activities',
            value: stats.totalActivities.toString(),
            icon: Award,
            color: 'text-eco-leaf',
            bg: 'bg-eco-leaf/10',
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="eco-stat-card"
          >
            <div className={`p-2 rounded-xl ${card.bg} w-fit mb-3`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Greenest Employee */}
      {stats.greenestEmployee && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-eco-leaf/30 p-6 text-center"
          style={{
            background: 'linear-gradient(145deg, hsl(140 35% 8% / 0.8), hsl(var(--card)))',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Award className="w-10 h-10 text-eco-warning mx-auto mb-2" />
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
            🌟 Greenest Employee of the Month
          </p>
          <p className="text-2xl font-display font-bold text-foreground">
            {stats.greenestEmployee.name}
          </p>
          <p className="text-muted-foreground">
            Only <span className="font-bold text-eco-leaf">{stats.greenestEmployee.emissions.toFixed(1)} kg CO₂</span> logged
          </p>
        </motion.div>
      )}

      {/* Department Average Waste */}
      {stats.departmentAvgWaste.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl border border-border p-6"
          style={{
            background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card)))',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h4 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Avg Department Waste (₹/employee)
          </h4>
          <div className="space-y-3">
            {stats.departmentAvgWaste.map((dept, i) => (
              <div key={dept.name} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-6 text-right">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{dept.name}</span>
                    <span className="text-sm font-display font-bold text-foreground">
                      {formatINR(dept.avgWaste)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-eco-leaf transition-all duration-1000"
                      style={{
                        width: `${Math.min(
                          (dept.avgWaste / (stats.departmentAvgWaste[stats.departmentAvgWaste.length - 1]?.avgWaste || 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OrganizationView;
