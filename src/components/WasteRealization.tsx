import { Activity } from '@/lib/carbonCalculator';
import { IndianRupee, TrendingUp, AlertTriangle, Fuel, Zap as ZapIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatINR } from '@/lib/carbonCalculator';

interface WasteRealizationProps {
  activities: Activity[];
}

const WasteRealization = ({ activities }: WasteRealizationProps) => {
  const transportTotal = activities
    .filter(a => a.category === 'transport')
    .reduce((s, a) => s + a.calculateImpact(), 0);
  const utilityTotal = activities
    .filter(a => a.category === 'utility')
    .reduce((s, a) => s + a.calculateImpact(), 0);
  const dietTotal = activities
    .filter(a => a.category === 'diet')
    .reduce((s, a) => s + a.calculateImpact(), 0);
  const totalEmissions = transportTotal + utilityTotal + dietTotal;

  // Convert CO2 to ₹ waste
  const fuelWaste = transportTotal * 12; // ~₹12 per kg CO2 from transport
  const electricityWaste = utilityTotal * 9.76; // ₹8/kWh ÷ 0.82 factor
  const dietWaste = dietTotal * 5; // Estimated premium for high-emission diet choices
  const totalWaste = fuelWaste + electricityWaste + dietWaste;
  const weeklyWaste = totalWaste * 0.25; // rough weekly estimate

  const wasteCards = [
    {
      label: 'Fuel & Commute Waste',
      amount: fuelWaste,
      icon: Fuel,
      gradient: 'from-red-500/20 to-orange-500/20',
      borderColor: 'border-red-500/30',
      iconColor: 'text-red-400',
    },
    {
      label: 'Electricity Waste',
      amount: electricityWaste,
      icon: ZapIcon,
      gradient: 'from-yellow-500/20 to-amber-500/20',
      borderColor: 'border-yellow-500/30',
      iconColor: 'text-yellow-400',
    },
    {
      label: 'Diet Impact Cost',
      amount: dietWaste,
      icon: TrendingUp,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero waste card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-destructive/30 p-8"
        style={{
          background: 'linear-gradient(145deg, hsl(0 40% 12% / 0.6), hsl(var(--card)))',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="absolute top-4 right-4">
          <AlertTriangle className="w-8 h-8 text-destructive/50" />
        </div>
        <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">
          Your Carbon Inefficiency Cost
        </p>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="flex items-baseline gap-1 mb-4"
        >
          <IndianRupee className="w-8 h-8 text-destructive" />
          <span className="text-5xl md:text-6xl font-display font-bold text-destructive">
            {Math.round(totalWaste).toLocaleString('en-IN')}
          </span>
        </motion.div>
        <p className="text-foreground/80 text-lg">
          Your commute & energy inefficiency cost you{' '}
          <span className="font-bold text-eco-warning">{formatINR(weeklyWaste)}</span> this week in fuel/time waste.
        </p>
        <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((totalWaste / 5000) * 100, 100)}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-destructive to-eco-warning"
          />
        </div>
      </motion.div>

      {/* Breakdown cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {wasteCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            className={`relative rounded-2xl border ${card.borderColor} p-6 overflow-hidden`}
            style={{
              background: `linear-gradient(145deg, hsl(var(--card)), hsl(var(--card)))`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-30`} />
            <div className="relative">
              <card.icon className={`w-6 h-6 ${card.iconColor} mb-3`} />
              <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
              <p className="text-2xl font-display font-bold text-foreground">
                {formatINR(card.amount)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lifetime Savings Counter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-primary/30 p-6"
        style={{
          background: 'linear-gradient(145deg, hsl(140 35% 8% / 0.8), hsl(var(--card)))',
          backdropFilter: 'blur(20px)',
        }}
      >
        <h4 className="font-display font-semibold text-foreground mb-2">
          💡 Potential Annual Savings
        </h4>
        <p className="text-muted-foreground">
          By switching to metro/cycling for commute and optimizing energy usage, you could save up to{' '}
          <span className="font-bold text-primary text-lg">{formatINR(totalWaste * 6)}</span> per year
          and reduce <span className="font-bold text-eco-leaf">{(totalEmissions * 0.6).toFixed(0)} kg CO₂</span>.
        </p>
      </motion.div>

      {/* 10-Year Lifetime Savings Projection */}
      <LifetimeSavings totalWaste={totalWaste} totalEmissions={totalEmissions} />
    </div>
  );
};

// Animated counter component
const LifetimeSavings = ({ totalWaste, totalEmissions }: { totalWaste: number; totalEmissions: number }) => {
  const [count, setCount] = useState(0);
  const annualSavings = totalWaste * 6;
  const tenYearSavings = annualSavings * 10;
  const tenYearCO2 = totalEmissions * 0.6 * 10;

  useEffect(() => {
    if (tenYearSavings === 0) return;
    const duration = 2000;
    const steps = 60;
    const increment = tenYearSavings / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= tenYearSavings) {
        setCount(tenYearSavings);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [tenYearSavings]);

  if (tenYearSavings === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="rounded-2xl border border-eco-glow/30 p-8 text-center overflow-hidden relative"
      style={{
        background: 'linear-gradient(145deg, hsl(145 40% 8% / 0.9), hsl(var(--card)))',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="relative">
        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
          🌟 Potential 10-Year Lifetime Savings
        </p>
        <div className="flex items-baseline justify-center gap-1 mb-2">
          <IndianRupee className="w-8 h-8 text-primary" />
          <span className="text-5xl md:text-6xl font-display font-bold text-primary">
            {Math.round(count).toLocaleString('en-IN')}
          </span>
        </div>
        <p className="text-muted-foreground">
          That's <span className="font-bold text-eco-leaf">{tenYearCO2.toFixed(0)} kg CO₂</span> prevented
          over a decade of green habits.
        </p>
      </div>
    </motion.div>
  );
};

export default WasteRealization;
