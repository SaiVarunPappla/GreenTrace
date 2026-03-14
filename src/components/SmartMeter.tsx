import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Activity as ActivityIcon } from 'lucide-react';

interface GridData {
  carbonIntensity: number; // gCO₂/kWh
  isPeak: boolean;
  frequency: number; // Hz
  load: number; // MW
}

const BASE_INTENSITY = 820; // India avg gCO₂/kWh
const PEAK_HOURS = [9, 10, 11, 12, 13, 14, 18, 19, 20, 21]; // IST peak

const SmartMeter = () => {
  const [data, setData] = useState<GridData>({
    carbonIntensity: BASE_INTENSITY,
    isPeak: false,
    frequency: 50.0,
    load: 180000,
  });
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      const isPeak = PEAK_HOURS.includes(hour);
      const baseIntensity = isPeak ? BASE_INTENSITY * 1.15 : BASE_INTENSITY * 0.85;
      const fluctuation = (Math.random() - 0.5) * 60;
      const carbonIntensity = Math.round(baseIntensity + fluctuation);

      const frequency = 50 + (Math.random() - 0.5) * 0.4;
      const load = isPeak
        ? 190000 + Math.random() * 20000
        : 150000 + Math.random() * 30000;

      setData({ carbonIntensity, isPeak, frequency, load });
      setHistory((prev) => [...prev.slice(-19), carbonIntensity]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
                Simulated India Grid Feed • Real-time
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
            className="text-5xl font-display font-bold text-foreground"
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
        </div>
        <div className="rounded-2xl border border-border p-4" style={{ background: 'var(--gradient-card)' }}>
          {data.isPeak ? (
            <TrendingUp className="w-4 h-4 text-destructive mb-2" />
          ) : (
            <TrendingDown className="w-4 h-4 text-primary mb-2" />
          )}
          <p className="text-lg font-display font-bold text-foreground">
            {(data.load / 1000).toFixed(0)} GW
          </p>
          <p className="text-xs text-muted-foreground">Grid Load</p>
        </div>
        <div className="rounded-2xl border border-border p-4" style={{ background: 'var(--gradient-card)' }}>
          <Zap className="w-4 h-4 text-eco-warning mb-2" />
          <p className="text-lg font-display font-bold text-foreground">
            ₹{data.isPeak ? '8.50' : '5.20'}
          </p>
          <p className="text-xs text-muted-foreground">Est. ₹/kWh</p>
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
            ? '⚠️ Peak hours — carbon intensity is high. Delay heavy appliance usage if possible.'
            : '✅ Off-peak hours — great time to run washing machines, charge EVs, and use heavy appliances.'}
        </p>
      </div>
    </motion.div>
  );
};

export default SmartMeter;
