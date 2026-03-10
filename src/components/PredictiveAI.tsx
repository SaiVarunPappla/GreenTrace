import { useState } from 'react';
import { Activity } from '@/lib/carbonCalculator';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, IndianRupee, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import { formatINR } from '@/lib/carbonCalculator';
import { toast } from 'sonner';

interface PredictiveAIProps {
  activities: Activity[];
}

interface Prediction {
  yearEndForecast: { totalKg: number; monthlyAvgKg: number };
  financialWaste: { weeklyINR: number; monthlyINR: number; yearlyINR: number; breakdown: string };
  recommendations: { title: string; impact: string; savingsINR: number }[];
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
}

const PredictiveAI = ({ activities }: PredictiveAIProps) => {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);

  const totalEmissions = activities.reduce((s, a) => s + a.calculateImpact(), 0);
  const categoryBreakdown = {
    transport: activities.filter(a => a.category === 'transport').reduce((s, a) => s + a.calculateImpact(), 0),
    diet: activities.filter(a => a.category === 'diet').reduce((s, a) => s + a.calculateImpact(), 0),
    utility: activities.filter(a => a.category === 'utility').reduce((s, a) => s + a.calculateImpact(), 0),
  };

  const fetchPrediction = async () => {
    if (activities.length === 0) {
      toast.error('Log some activities first to get predictions');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predict-emissions', {
        body: {
          activities: activities.length,
          totalEmissions,
          categoryBreakdown,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPrediction(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-eco-leaf';
      case 'medium': return 'text-eco-warning';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'low': return 'bg-eco-leaf/20 border-eco-leaf/30';
      case 'medium': return 'bg-eco-warning/20 border-eco-warning/30';
      case 'high': return 'bg-destructive/20 border-destructive/30';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate button */}
      {!prediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border p-8 text-center"
          style={{
            background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card)))',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-display font-bold text-foreground mb-2">
            AI-Powered Emission Forecast
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Our AI analyzes your activity patterns to predict end-of-year emissions and identify financial waste in ₹.
          </p>
          <button
            onClick={fetchPrediction}
            disabled={loading}
            className="eco-button inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate AI Forecast
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {prediction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Summary + Risk */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border p-6"
              style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card)))', backdropFilter: 'blur(20px)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  AI Analysis
                </h4>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskBg(prediction.riskLevel)}`}>
                  <span className={getRiskColor(prediction.riskLevel)}>
                    {prediction.riskLevel.toUpperCase()} RISK
                  </span>
                </span>
              </div>
              <p className="text-foreground/80 leading-relaxed">{prediction.summary}</p>
            </motion.div>

            {/* Forecast cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-eco-sky/30 p-6"
                style={{ background: 'linear-gradient(145deg, hsl(200 30% 10% / 0.5), hsl(var(--card)))', backdropFilter: 'blur(20px)' }}
              >
                <TrendingUp className="w-6 h-6 text-eco-sky mb-3" />
                <p className="text-sm text-muted-foreground">Year-End Forecast</p>
                <p className="text-3xl font-display font-bold text-foreground mt-1">
                  {prediction.yearEndForecast.totalKg.toFixed(0)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">kg CO₂</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Monthly avg: {prediction.yearEndForecast.monthlyAvgKg.toFixed(1)} kg
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-destructive/30 p-6"
                style={{ background: 'linear-gradient(145deg, hsl(0 30% 10% / 0.5), hsl(var(--card)))', backdropFilter: 'blur(20px)' }}
              >
                <IndianRupee className="w-6 h-6 text-destructive mb-3" />
                <p className="text-sm text-muted-foreground">Projected Financial Waste</p>
                <p className="text-3xl font-display font-bold text-destructive mt-1">
                  {formatINR(prediction.financialWaste.yearlyINR)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">/year</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatINR(prediction.financialWaste.weeklyINR)}/week • {formatINR(prediction.financialWaste.monthlyINR)}/month
                </p>
              </motion.div>
            </div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-primary/30 p-6"
              style={{ background: 'linear-gradient(145deg, hsl(140 35% 8% / 0.8), hsl(var(--card)))', backdropFilter: 'blur(20px)' }}
            >
              <h4 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-eco-warning" />
                AI Recommendations
              </h4>
              <div className="space-y-3">
                {prediction.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50"
                  >
                    <span className="text-lg">💡</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.impact}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{formatINR(rec.savingsINR)}</p>
                      <p className="text-[10px] text-muted-foreground">savings</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Regenerate */}
            <div className="text-center">
              <button
                onClick={fetchPrediction}
                disabled={loading}
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Regenerate Analysis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PredictiveAI;
