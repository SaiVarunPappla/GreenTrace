import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Activity as ActivityIcon } from 'lucide-react';
import { toast } from 'sonner';

interface GridData {
  carbonIntensity: number;
  isPeak: boolean;
  frequency: number;
  load: number; // GW
  tariff: number; // ₹/kWh
}

const BASE_INTENSITY = 820; // gCO₂/kWh India avg
// IST peak hours
const PEAK_HOURS = [9, 10, 11, 12, 13, 14, 18, 19, 20, 21];
// Realistic India grid load range: 160-210 GW
const BASE_LOAD_OFF_PEAK = 160;
const BASE_LOAD_PEAK = 190;
// 2026 Indian electricity tariffs (₹/kWh)
const TARIFF_PEAK = 8.50;
const TARIFF_OFF_PEAK = 5.20;

const SmartMeter = memo(() => {
  const [data, setData] = useState<GridData>({
    carbonIntensity: BASE_INTENSITY,
    isPeak: false,
    frequency: 50.0,
    load: 170,
    tariff: TARIFF_OFF_PEAK,
  });
  const [history, setHistory] = useState<number[]>([]);
  const [lastToastTime, setLastToastTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      const isPeak = PEAK_HOURS.includes(hour);
      const baseIntensity = isPeak ? BASE_INTENSITY * 1.15 : BASE_INTENSITY * 0.85;
      const fluctuation = (Math.random() - 0.5) * 60;
      const carbonIntensity = Math.round(baseIntensity + fluctuation);

      // Realistic frequency: 49.5–50.5 Hz (Indian grid standard)
      const frequency = 49.9 + (Math.random() - 0.3) * 0.6;
      const clampedFreq = Math.max(49.5, Math.min(50.5, frequency));

      // Realistic load in GW (160–210 GW range)
      const baseLoad = isPeak ? BASE_LOAD_PEAK : BASE_LOAD_OFF_PEAK;
      const loadFluctuation = (Math.random() - 0.5) * 20;
      const load = Math.round(baseLoad + loadFluctuation);

      const tariff = isPeak ? TARIFF_PEAK : TARIFF_OFF_PEAK;

      setData({ carbonIntensity, isPeak, frequency: clampedFreq, load, tariff });
      setHistory((prev) => [...prev.slice(-19), carbonIntensity]);

      // Smart toast notifications (max once per 30s)
      const now = Date.now();
      if (now - lastToastTime > 30000) {
        if (!isPeak && carbonIntensity < BASE_INTENSITY * 0.85) {
          toast.success('🟢 Low Carbon Grid detected — Best time to charge devices!', { duration: 4000 });
          setLastToastTime(now);
        } else if (isPeak && carbonIntensity > BASE_INTENSITY * 1.1) {
          toast.warning('⚠️ High grid intensity — Delay heavy appliance usage if possible.', { duration: 4000 });
          setLastToastTime(now);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [lastToastTime]);

  const maxHist = Math.max(...history, 1);
  const minHist = Math.min(...history, 0);
  const range = maxHist - minHist || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Live Feed Card */}
      <div
        className="relative rounded-2xl border border-border p-6 overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card)))',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${data.isPeak ? 'bg-destructive/20' : 'bg-primary/20'}`}>
              <Zap className={`w-5 h-5 ${data.isPeak ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                Virtual Smart Meter
              </h3>
              <p className="text-xs text-muted-foreground">
                Simulated India Grid Feed • {data.load} GW Load
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full animate-pulse ${data.isPeak ? 'bg-destructive' : 'bg-primary'}`} />
            <span className={`text-xs font-semibold ${data.isPeak ? 'text-destructive' : 'text-primary'}`}>
              {data.isPeak ? 'PEAK' : 'OFF-PEAK'}
            </span>
          </div>
        </div>

        {/* Main metric */}
        <div className="text-center py-4">
          <motion.p
            key={data.carbonIntensity}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-5xl font-display font-bold text-foreground"
          >
            {data.carbonIntensity}
          </motion.p>
          <p className="text-sm text-muted-foreground mt-1">gCO2/kWh</p>
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
                  backgroundColor:
                    val > BASE_INTENSITY * 1.05
                      ? 'hsl(0 60% 50%)'
                      : val < BASE_INTENSITY * 0.9
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--eco-warning))',
                }}
              />
            ))}
          </div>
        )}
      </div>

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
      <div
        className={`rounded-2xl border p-4 ${data.isPeak ? 'border-destructive/30' : 'border-primary/30'}`}
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
      </div>
    </motion.div>
  );
});

SmartMeter.displayName = 'SmartMeter';

export default SmartMeter;
