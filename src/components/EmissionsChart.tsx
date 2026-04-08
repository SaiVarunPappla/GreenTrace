import { Activity } from '@/lib/carbonCalculator';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface EmissionsChartProps {
  activities: Activity[];
}

const EmissionsChart = ({ activities }: EmissionsChartProps) => {
  // Group emissions by date
  const dailyData: Record<string, { transport: number; diet: number; utility: number }> = {};

  activities.forEach(a => {
    const key = a.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    if (!dailyData[key]) dailyData[key] = { transport: 0, diet: 0, utility: 0 };
    const impact = a.calculateImpact();
    if (a.category === 'transport') dailyData[key].transport += impact;
    else if (a.category === 'diet') dailyData[key].diet += impact;
    else if (a.category === 'utility') dailyData[key].utility += impact;
  });

  const data = Object.entries(dailyData).map(([date, vals]) => ({
    date,
    ...vals,
    total: vals.transport + vals.diet + vals.utility,
  }));

  if (data.length === 0) {
    return (
      <div className="eco-card flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground text-center">
          📊 Chart will appear once you log activities
        </p>
      </div>
    );
  }

  return (
    <div className="eco-card">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">
        Emissions Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradTransport" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(200, 50%, 45%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(200, 50%, 45%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradDiet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(45, 90%, 55%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(45, 90%, 55%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradUtility" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(160, 20%, 15%)" />
          <XAxis
            dataKey="date"
            stroke="hsl(120, 10%, 50%)"
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            stroke="hsl(120, 10%, 50%)"
            fontSize={10}
            tickLine={false}
            tickFormatter={(v: number) => `${v.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(160, 25%, 8%)',
              border: '1px solid hsl(160, 20%, 18%)',
              borderRadius: '12px',
              color: 'hsl(120, 10%, 92%)',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)} kg CO₂`,
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
          />
          <Area
            type="monotone"
            dataKey="transport"
            stackId="1"
            stroke="hsl(200, 50%, 45%)"
            fill="url(#gradTransport)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="diet"
            stackId="1"
            stroke="hsl(45, 90%, 55%)"
            fill="url(#gradDiet)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="utility"
            stackId="1"
            stroke="hsl(145, 60%, 45%)"
            fill="url(#gradUtility)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EmissionsChart;
