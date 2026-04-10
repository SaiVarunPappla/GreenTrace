/**
 * Simple Linear Regression for emissions forecasting.
 * Analyzes daily emissions data and projects future values.
 */

export interface DailyEmission {
  dayIndex: number; // 0-based day from start
  emissions: number; // kg CO2
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  predictedNextMonth: number;
  weeklyTrend: number; // percentage change week-over-week
  anomalies: AnomalyResult[];
}

export interface AnomalyResult {
  dayIndex: number;
  actual: number;
  expected: number;
  deviation: number; // std deviations from mean
  message: string;
}

export function linearRegression(data: DailyEmission[]): RegressionResult | null {
  if (data.length < 3) return null;

  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (const d of data) {
    sumX += d.dayIndex;
    sumY += d.emissions;
    sumXY += d.dayIndex * d.emissions;
    sumX2 += d.dayIndex * d.dayIndex;
    sumY2 += d.emissions * d.emissions;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  for (const d of data) {
    const predicted = slope * d.dayIndex + intercept;
    ssTot += (d.emissions - meanY) ** 2;
    ssRes += (d.emissions - predicted) ** 2;
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Predict next 30 days cumulative
  const lastDay = data[data.length - 1].dayIndex;
  let predictedNextMonth = 0;
  for (let i = 1; i <= 30; i++) {
    predictedNextMonth += Math.max(0, slope * (lastDay + i) + intercept);
  }

  // Weekly trend
  const recentWeek = data.slice(-7);
  const prevWeek = data.slice(-14, -7);
  const recentAvg = recentWeek.reduce((s, d) => s + d.emissions, 0) / (recentWeek.length || 1);
  const prevAvg = prevWeek.length > 0
    ? prevWeek.reduce((s, d) => s + d.emissions, 0) / prevWeek.length
    : recentAvg;
  const weeklyTrend = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;

  // Anomaly detection (Z-score > 2)
  const residuals = data.map(d => d.emissions - (slope * d.dayIndex + intercept));
  const meanRes = residuals.reduce((s, r) => s + r, 0) / n;
  const stdRes = Math.sqrt(residuals.reduce((s, r) => s + (r - meanRes) ** 2, 0) / n);
  
  const anomalies: AnomalyResult[] = [];
  if (stdRes > 0) {
    data.forEach((d, i) => {
      const zScore = Math.abs(residuals[i]) / stdRes;
      if (zScore > 2) {
        const expected = slope * d.dayIndex + intercept;
        const pctChange = ((d.emissions - expected) / expected) * 100;
        anomalies.push({
          dayIndex: d.dayIndex,
          actual: d.emissions,
          expected,
          deviation: zScore,
          message: pctChange > 0
            ? `${Math.abs(pctChange).toFixed(0)}% spike in emissions detected`
            : `${Math.abs(pctChange).toFixed(0)}% drop in emissions — great job!`,
        });
      }
    });
  }

  return { slope, intercept, r2, predictedNextMonth, weeklyTrend, anomalies };
}

/**
 * Generate optimization suggestions based on category breakdown.
 */
export interface OptimizationSuggestion {
  title: string;
  impact: string;
  savingsINR: number;
  savingsKg: number;
}

export function generateOptimizations(
  categoryBreakdown: { transport: number; diet: number; utility: number },
  totalDays: number
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  const dailyTransport = totalDays > 0 ? categoryBreakdown.transport / totalDays : 0;
  const dailyUtility = totalDays > 0 ? categoryBreakdown.utility / totalDays : 0;

  if (dailyTransport > 2) {
    const savings = dailyTransport * 0.6 * 30; // 60% reduction via metro
    suggestions.push({
      title: 'Switch to Metro/Local Train for daily commute',
      impact: `Saves ${savings.toFixed(1)} kg CO₂/month based on your actual travel pattern`,
      savingsINR: Math.round(savings * 35), // ₹35 per kg CO2 equivalent fuel cost
      savingsKg: savings,
    });
  }

  if (dailyTransport > 0.5) {
    const savings = dailyTransport * 0.3 * 30;
    suggestions.push({
      title: 'Carpool 3 days/week on your current route',
      impact: `Reduces commute emissions by ~30% (${savings.toFixed(1)} kg CO₂/month)`,
      savingsINR: Math.round(savings * 25),
      savingsKg: savings,
    });
  }

  if (dailyUtility > 3) {
    const savings = dailyUtility * 0.25 * 30;
    suggestions.push({
      title: 'Shift heavy appliance usage to off-peak hours (10PM–6AM)',
      impact: `Lower tariff + cleaner grid mix saves ${savings.toFixed(1)} kg CO₂/month`,
      savingsINR: Math.round(savings * 8), // ₹8/kWh savings
      savingsKg: savings,
    });
  }

  if (categoryBreakdown.diet > categoryBreakdown.transport * 0.5) {
    suggestions.push({
      title: 'Add 2 vegetarian days per week',
      impact: 'Traditional Indian thalis cut diet emissions by ~40%',
      savingsINR: 800,
      savingsKg: 12,
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: 'Maintain your current green habits',
      impact: 'Your emissions are well within sustainable range',
      savingsINR: 0,
      savingsKg: 0,
    });
  }

  return suggestions;
}
