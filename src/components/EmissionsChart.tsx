import { Activity } from '@/lib/carbonCalculator';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface EmissionsChartProps {
  activities: Activity[];
}

const EmissionsChart = ({ activities }: EmissionsChartProps) => {
  const calculateCategoryTotal = (category: string) => {
    return activities
      .filter((a) => a.category === category)
      .reduce((sum, a) => sum + a.calculateImpact(), 0);
  };

  const data = [
    { name: 'Transport', value: calculateCategoryTotal('transport'), color: 'hsl(200, 50%, 45%)' },
    { name: 'Diet', value: calculateCategoryTotal('diet'), color: 'hsl(45, 90%, 55%)' },
    { name: 'Utilities', value: calculateCategoryTotal('utility'), color: 'hsl(145, 60%, 45%)' },
  ].filter((item) => item.value > 0);

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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(160, 25%, 8%)',
              border: '1px solid hsl(160, 20%, 18%)',
              borderRadius: '12px',
              color: 'hsl(120, 10%, 92%)',
            }}
            formatter={(value: number) => [`${value.toFixed(2)} kg CO₂`, '']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span style={{ color: 'hsl(120, 10%, 92%)' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EmissionsChart;
