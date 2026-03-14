import { Activity } from '@/lib/carbonCalculator';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface CarbonHeatmapProps {
  activities: Activity[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'];

const getTimeSlot = (hour: number): number => {
  if (hour >= 5 && hour < 12) return 0;
  if (hour >= 12 && hour < 17) return 1;
  if (hour >= 17 && hour < 21) return 2;
  return 3;
};

const CarbonHeatmap = ({ activities }: CarbonHeatmapProps) => {
  // Build grid: days × time slots
  const grid: number[][] = Array.from({ length: 7 }, () => Array(4).fill(0));

  activities.forEach((a) => {
    const day = (a.date.getDay() + 6) % 7; // Mon=0
    const slot = getTimeSlot(a.date.getHours());
    grid[day][slot] += a.calculateImpact();
  });

  const maxVal = Math.max(...grid.flat(), 0.01);

  const getColor = (value: number): string => {
    if (value === 0) return 'hsl(var(--secondary))';
    const intensity = Math.min(value / maxVal, 1);
    if (intensity < 0.25) return 'hsl(140 35% 30%)';
    if (intensity < 0.5) return 'hsl(60 50% 40%)';
    if (intensity < 0.75) return 'hsl(30 60% 45%)';
    return 'hsl(0 60% 45%)';
  };

  const hasData = activities.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="eco-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-destructive" />
        <h3 className="text-lg font-display font-semibold text-foreground">
          Carbon Hotspots
        </h3>
      </div>

      {!hasData ? (
        <p className="text-muted-foreground text-center py-8 text-sm">
          🔥 Heatmap appears after logging activities
        </p>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex gap-1 ml-12">
            {TIME_SLOTS.map((slot) => (
              <div key={slot} className="flex-1 text-[10px] text-muted-foreground text-center">
                {slot}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {DAYS.map((day, di) => (
            <div key={day} className="flex items-center gap-1">
              <span className="w-10 text-xs text-muted-foreground text-right pr-1">
                {day}
              </span>
              {grid[di].map((val, ti) => (
                <motion.div
                  key={ti}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (di * 4 + ti) * 0.02 }}
                  className="flex-1 h-8 rounded-md cursor-default transition-all hover:ring-1 hover:ring-primary/50"
                  style={{ backgroundColor: getColor(val) }}
                  title={`${day} ${TIME_SLOTS[ti]}: ${val.toFixed(2)} kg CO₂`}
                />
              ))}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-3 pt-2">
            <span className="text-[10px] text-muted-foreground">Low</span>
            {['hsl(140 35% 30%)', 'hsl(60 50% 40%)', 'hsl(30 60% 45%)', 'hsl(0 60% 45%)'].map((c, i) => (
              <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
            ))}
            <span className="text-[10px] text-muted-foreground">High</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CarbonHeatmap;
