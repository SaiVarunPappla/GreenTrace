import { useState, useMemo } from 'react';
import { Activity } from '@/lib/carbonCalculator';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, IndianRupee, Lightbulb, Loader2, Sparkles, AlertTriangle, BarChart3 } from 'lucide-react';
import { formatINR } from '@/lib/carbonCalculator';
import { toast } from 'sonner';
import {
  linearRegression,
  generateOptimizations,
  type RegressionResult,
  type DailyEmission,
} from '@/lib/linearRegression';

interface PredictiveAIProps {
  activities: Activity[];
}

const PredictiveAI = ({ activities }: PredictiveAIProps) => {
  const [aiPrediction, setAiPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ============= Local Regression Analysis =============
  const regression = useMemo(() => {
    if (activities.length < 3) return null;

    // Group by day
    const dailyMap = new Map<string, number>();
    const sorted = [...activities].sort((a, b) => a.date.getTime() - b.date.getTime());
    const startDate = sorted[0].date;

    sorted.forEach((a) => {
      const key = a.date.toISOString().split('T')[0];
      dailyMap.set(key, (dailyMap.get(key) || 0) + a.calculateImpact());
    });

    const dailyData: DailyEmission[] = Array.from(dailyMap.entries()).map(([dateStr, emissions]) => ({
      dayIndex: Math.floor((new Date(dateStr).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      emissions,
    }));

    return linearRegression(dailyData);
  }, [activities]);

  const categoryBreakdown = useMemo(() => ({
    transport: activities.filter((a) => a.category === 'transport').reduce((s, a) => s + a.calculateImpact(), 0),
    diet: activities.filter((a) => a.category === 'diet').reduce((s, a) => s + a.calculateImpact(), 0),
    utility: activities.filter((a) => a.category === 'utility').reduce((s, a) => s + a.calculateImpact(), 0),
  }), [activities]);

  const totalEmissions = categoryBreakdown.transport + categoryBreakdown.diet + categoryBreakdown.utility;

  const optimizations = useMemo(() => {
    const days = activities.length > 0
      ? Math.max(1, Math.ceil((Date.now() - Math.min(...activities.map((a) => a.date.getTime()))) / (1000 * 60 * 60 * 24)))
      : 1;
    return generateOptimizations(categoryBreakdown, days);
  }, [activities, categoryBreakdown]);

  // ============= AI-Enhanced Prediction (Edge Function) =============
  const fetchAIPrediction = async () => {
    if (activities.length === 0) {
      toast.error('Log some activities first to get predictions');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predict-emissions', {
        body: { activities: activities.length, totalEmissions, categoryBreakdown },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiPrediction(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate AI prediction');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (trend: number) => {
    if (trend < -5) return 'text-primary';
    if (trend < 10) return 'text-eco-warning';
    return 'text-destructive';
  };

  const hasData = activities.length >= 3;

  return (
    <div className="space-y-5">
      {/* Local Regression Analysis */}
      {!hasData ? (
        <div className="rounded-2xl border border-border p-8 text-center" style={{ background: 'var(--gradient-card)' }}>
          <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-display font-semibold text-foreground mb-1">Awaiting Real-World Data</h3>
          <p className="text-sm text-muted-foreground">Log at least 3 activities to unlock regression analysis.</p>
        </div>
      ) : regression && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Trend Header */}
          <div className="rounded-2xl border border-border p-5" style={{ background: 'var(--gradient-card)' }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display font-semibold text-foreground flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-primary" />
                30-Day Regression Analysis
              </h4>
              <span className="text-[10px] text-muted-foreground font-mono">
                R² = {regression.r2.toFixed(3)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-secondary/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Next Month Forecast</p>
                <p className="text-lg font-display font-bold text-foreground mt-1">
                  {regression.predictedNextMonth.toFixed(1)}
                  <span className="text-[10px] font-normal text-muted-foreground ml-1">kg</span>
                </p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Weekly Trend</p>
                <p className={`text-lg font-display font-bold mt-1 flex items-center gap-1 ${getRiskColor(regression.weeklyTrend)}`}>
                  {regression.weeklyTrend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(regression.weeklyTrend).toFixed(1)}%
                </p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Daily Slope</p>
                <p className="text-lg font-display font-bold text-foreground mt-1">
                  {regression.slope > 0 ? '+' : ''}{regression.slope.toFixed(3)}
                  <span className="text-[10px] font-normal text-muted-foreground ml-1">kg/day</span>
                </p>
              </div>
            </div>
          </div>

          {/* Anomalies */}
          {regression.anomalies.length > 0 && (
            <div className="rounded-2xl border border-eco-warning/30 p-4" style={{ background: 'linear-gradient(145deg, hsl(45 30% 8% / 0.5), hsl(var(--card)))' }}>
              <h4 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-eco-warning" />
                Anomaly Detection
              </h4>
              <div className="space-y-2">
                {regression.anomalies.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-eco-warning mt-0.5">⚡</span>
                    <span className="text-foreground/80">{a.message}</span>
                    <span className="text-muted-foreground ml-auto shrink-0">
                      {a.actual.toFixed(1)} vs {a.expected.toFixed(1)} kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimizations */}
          <div className="rounded-2xl border border-primary/20 p-4" style={{ background: 'var(--gradient-card)' }}>
            <h4 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-eco-warning" />
              Route-Based Optimizations
            </h4>
            <div className="space-y-2">
              {optimizations.map((opt, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-xs">{opt.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{opt.impact}</p>
                  </div>
                  {opt.savingsINR > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-primary">{formatINR(opt.savingsINR)}</p>
                      <p className="text-[9px] text-muted-foreground">savings/mo</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Deep Analysis Button */}
      <div className="rounded-2xl border border-border p-5 text-center" style={{ background: 'var(--gradient-card)' }}>
        <Brain className="w-8 h-8 text-primary mx-auto mb-2" />
        <h3 className="text-sm font-display font-semibold text-foreground mb-1">AI Deep Analysis</h3>
        <p className="text-xs text-muted-foreground mb-3 max-w-sm mx-auto">
          Get AI-powered financial waste analysis & personalized recommendations in ₹.
        </p>
        <button
          onClick={fetchAIPrediction}
          disabled={loading || activities.length === 0}
          className="eco-button inline-flex items-center gap-2 text-sm px-4 py-2 disabled:opacity-50"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</> : <><Sparkles className="w-4 h-4" /> Run AI Analysis</>}
        </button>
      </div>

      {/* AI Results */}
      <AnimatePresence>
        {aiPrediction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-2xl border border-border p-5" style={{ background: 'var(--gradient-card)' }}>
              <p className="text-xs text-foreground/80 leading-relaxed">{aiPrediction.summary}</p>
            </div>
            {aiPrediction.financialWaste && (
              <div className="rounded-2xl border border-destructive/30 p-5" style={{ background: 'linear-gradient(145deg, hsl(0 30% 8% / 0.5), hsl(var(--card)))' }}>
                <IndianRupee className="w-5 h-5 text-destructive mb-2" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Projected Financial Waste</p>
                <p className="text-2xl font-display font-bold text-destructive mt-1">
                  {formatINR(aiPrediction.financialWaste.yearlyINR)}<span className="text-xs font-normal text-muted-foreground ml-1">/year</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatINR(aiPrediction.financialWaste.weeklyINR)}/week • {formatINR(aiPrediction.financialWaste.monthlyINR)}/month
                </p>
              </div>
            )}
            {aiPrediction.recommendations?.length > 0 && (
              <div className="rounded-2xl border border-primary/20 p-4" style={{ background: 'var(--gradient-card)' }}>
                <h4 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-eco-warning" /> AI Recommendations
                </h4>
                <div className="space-y-2">
                  {aiPrediction.recommendations.map((rec: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-xs">{rec.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{rec.impact}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-primary">{formatINR(rec.savingsINR)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="text-center">
              <button
                onClick={fetchAIPrediction}
                disabled={loading}
                className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Regenerate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PredictiveAI;
