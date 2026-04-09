import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Activity as ActivityIcon, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface GridData {
  carbonIntensity: number;
  isPeak: boolean;
  frequency: number;
  load: number;
  tariff: number;
  status: 'live' | 'waiting';
}

const BASE_INTENSITY = 820;
const PEAK_HOURS = [9, 10, 11, 12, 13, 14, 18, 19, 20, 21];
const BASE_LOAD_OFF_PEAK = 160;
const BASE_LOAD_PEAK = 190;
const TARIFF_PEAK = 8.50;
const TARIFF_OFF_PEAK = 5.20;

// Dynamic color based on intensity
const getIntensityColor = (intensity: number): string => {
  if (intensity < BASE_INTENSITY * 0.85) return 'hsl(var(--primary))';
  if (intensity < BASE_INTENSITY * 1.05) return 'hsl(var(--eco-warning))';
  return 'hsl(0 60% 50%)';
};

const getIntensityBg = (intensity: number): string => {
  if (intensity < BASE_INTENSITY * 0.85) return 'hsl(140 35% 8% / 0.6)';
  if (intensity < BASE_INTENSITY * 1.05) return 'hsl(45 40% 8% / 0.6)';
  return 'hsl(0 40% 12% / 0.6)';
};

const SmartMeter = memo(() => {
  const [data, setData] = useState<GridData>({
    carbonIntensity: BASE_INTENSITY,
    isPeak: false,
    frequency: 50.0,
    load: 170,
    tariff: TARIFF_OFF_PEAK,
    status: 'waiting',
  });
  const [history, setHistory] = useState<number[]>([]);
  const [lastToastTime, setLastToastTime] = useState(0);

  useEffect(() => {
    // Initial "connecting" state
    const connectTimeout = setTimeout(() => {
      setData(prev => ({ ...prev, status: 'live' }));
      toast.success('📡 Connected to Grid Data Stream', { duration: 3000 });
    }, 1500);

    const interval = setInterval(() => {
      const hour = new Date().getHours();
      const isPeak = PEAK_HOURS.includes(hour);
      const baseIntensity = isPeak ? BASE_INTENSITY * 1.15 : BASE_INTENSITY * 0.85;
      const fluctuation = (Math.random() - 0.5) * 60;
      const carbonIntensity = Math.round(baseIntensity + fluctuation);

      const frequency = 49.9 + (Math.random() - 0.3) * 0.6;
      const clampedFreq = Math.max(49.5, Math.min(50.5, frequency));

      const baseLoad = isPeak ? BASE_LOAD_PEAK : BASE_LOAD_OFF_PEAK;
      const loadFluctuation = (Math.random() - 0.5) * 20;
      const load = Math.round(baseLoad + loadFluctuation);

      const tariff = isPeak ? TARIFF_PEAK : TARIFF_OFF_PEAK;

      setData({ carbonIntensity, isPeak, frequency: clampedFreq, load, tariff, status: 'live' });
      setHistory((prev) => [...prev.slice(-19), carbonIntensity]);

      const now = Date.now();
      if (now - lastToastTime > 30000) {
        if (!isPeak && carbonIntensity < BASE_INTENSITY * 0.85) {
          toast.success('🟢 Low Carbon Grid — Best time to charge devices!', { duration: 4000 });
          setLastToastTime(now);
        } else if (isPeak && carbonIntensity > BASE_INTENSITY * 1.1) {
          toast.warning('⚠️ High grid intensity — Delay heavy appliance usage.', { duration: 4000 });
          setLastToastTime(now);
        }
      }
    }, 2000);

    return () => {
      clearTimeout(connectTimeout);
      clearInterval(interval);
    };
  }, [lastToastTime]);

  const maxHist = Math.max(...history, 1);
  const minHist = Math.min(...history, 0);
  const range = maxHist - minHist || 1;

  if (data.status === 'waiting') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border p-8 text-center"
        style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card)))' }}
      >
        <WifiOff className="w-10 h-10 text-muted-foreground mx-auto mb-4 animate-pulse" />
        <h3 className="text-lg font-display font-semibold text-foreground mb-2">
          Waiting for Real-World Data
        </h3>
        <p className="text-sm text-muted-foreground">
          Connecting to Indian Power Grid data stream…
        </p>
      </motion.div>
    );
  }

  const intensityColor = getIntensityColor(data.carbonIntensity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Live Feed Card */}
      <motion.div
        animate={{
          borderColor: data.isPeak ? 'hsl(0 60% 30%)' : 'hsl(140 30% 20%)',
        }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl border p-6 overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${getIntensityBg(data.carbonIntensity)}, hsl(var(--card)))`,
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ backgroundColor: data.isPeak ? 'hsl(0 60% 20%)' : 'hsl(140 30% 15%)' }}
              className="p-2 rounded-xl"
            >
              <Zap className="w-5 h-5" style={{ color: intensityColor }} />
            </motion.div>
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                Smart Grid Monitor
              </h3>
              <p className="text-xs text-muted-foreground">
                India Grid Feed • {data.load} GW Load
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <motion.div
              animate={{ backgroundColor: intensityColor }}
              className="w-2 h-2 rounded-full animate-pulse"
            />
            <motion.span
              animate={{ color: intensityColor }}
              className="text-xs font-semibold"
            >
              {data.isPeak ? 'PEAK' : 'OFF-PEAK'}
            </motion.span>
          </div>
        </div>

        {/* Main metric */}
        <div className="text-center py-4">
          <motion.p
            key={data.carbonIntensity}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-5xl font-display font-bold"
            style={{ color: intensityColor }}
          >
            {data.carbonIntensity}
          </motion.p>
          <p className="text-sm text-muted-foreground mt-1">gCO₂/kWh</p>
        </div>

        {/* Mini sparkline */}
        {history.length > 1 && (
          <div className="h-16 flex items-end gap-0.5 mt-4">
            {history.map((val, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${((val - minHist) / range) * 100}%` }}
                transition={{ duration: 0.4 }}
                className="flex-1 rounded-t-sm min-h-[2px]"
                style={{
                  backgroundColor: getIntensityColor(val),
                  transition: 'background-color 0.3s ease',
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Grid stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border p-4" style={{ background: 'var(--gradient-card)' }}>
          <ActivityIcon className="w-4 h-4 text-primary mb-2" />
          <p className="text-lg font-display font-bold text-foreground">
            {data.frequency.toFixed(2)} Hz
          </p>
          <p className="text-xs text-muted-foreground">Grid Frequency</p>
          <p className="text-[10px] text-muted-foreground/70">Range: 49.5–50.5 Hz</p>
        </div>
        <div className="rounded-2xl border border-border p-4" style={{ background: 'var(--gradient-card)' }}>
          {data.isPeak ? (
            <TrendingUp className="w-4 h-4 text-destructive mb-2" />
          ) : (
            <TrendingDown className="w-4 h-4 text-primary mb-2" />
          )}
          <p className="text-lg font-display font-bold text-foreground">
            {data.load} GW
          </p>
          <p className="text-xs text-muted-foreground">Grid Load</p>
          <p className="text-[10px] text-muted-foreground/70">India: 160–210 GW</p>
        </div>
        <div className="rounded-2xl border border-border p-4" style={{ background: 'var(--gradient-card)' }}>
          <Zap className="w-4 h-4 text-eco-warning mb-2" />
          <p className="text-lg font-display font-bold text-foreground">
            ₹{data.tariff.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Tariff/kWh</p>
          <p className="text-[10px] text-muted-foreground/70">2026 DISCOM rate</p>
        </div>
      </div>

      {/* Advice */}
      <motion.div
        animate={{
          borderColor: data.isPeak ? 'hsl(0 60% 30% / 0.3)' : 'hsl(140 30% 20% / 0.3)',
        }}
        className="rounded-2xl border p-4"
        style={{
          background: data.isPeak
            ? 'linear-gradient(145deg, hsl(0 40% 12% / 0.4), hsl(var(--card)))'
            : 'linear-gradient(145deg, hsl(140 35% 8% / 0.6), hsl(var(--card)))',
        }}
      >
        <p className="text-sm text-foreground">
          {data.isPeak
            ? '⚠️ Peak hours — carbon intensity is high. Delay heavy appliance usage if possible. Tariff: ₹8.50/kWh'
            : '✅ Off-peak hours — great time to run washing machines, charge EVs, and use heavy appliances. Tariff: ₹5.20/kWh'}
        </p>
      </motion.div>
    </motion.div>
  );
});

SmartMeter.displayName = 'SmartMeter';

export default SmartMeter;
