import { Activity } from '@/lib/carbonCalculator';
import { Car, Utensils, Zap, TrendingDown } from 'lucide-react';

interface StatsCardsProps {
  activities: Activity[];
}

const StatsCards = ({ activities }: StatsCardsProps) => {
  const calculateCategoryTotal = (category: string) => {
    return activities
      .filter((a) => a.category === category)
      .reduce((sum, a) => sum + a.calculateImpact(), 0);
  };

  const transportTotal = calculateCategoryTotal('transport');
  const dietTotal = calculateCategoryTotal('diet');
  const utilityTotal = calculateCategoryTotal('utility');
  const grandTotal = transportTotal + dietTotal + utilityTotal;

  const stats = [
    {
      label: 'Transport',
      value: transportTotal,
      icon: Car,
      color: 'text-eco-sky',
      bgColor: 'bg-eco-sky/10',
      percentage: grandTotal > 0 ? (transportTotal / grandTotal) * 100 : 0,
    },
    {
      label: 'Diet',
      value: dietTotal,
      icon: Utensils,
      color: 'text-eco-warning',
      bgColor: 'bg-eco-warning/10',
      percentage: grandTotal > 0 ? (dietTotal / grandTotal) * 100 : 0,
    },
    {
      label: 'Utilities',
      value: utilityTotal,
      icon: Zap,
      color: 'text-eco-leaf',
      bgColor: 'bg-eco-leaf/10',
      percentage: grandTotal > 0 ? (utilityTotal / grandTotal) * 100 : 0,
    },
    {
      label: 'Saved vs Avg',
      value: Math.max(0, 350 - grandTotal), // Average person: ~350kg/month
      icon: TrendingDown,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      percentage: Math.max(0, ((350 - grandTotal) / 350) * 100),
      isSavings: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="eco-stat-card animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            {!stat.isSavings && (
              <span className="text-xs text-muted-foreground">
                {stat.percentage.toFixed(0)}%
              </span>
            )}
          </div>
          
          <p className="text-2xl font-display font-bold text-foreground">
            {stat.value.toFixed(1)}
            <span className="text-xs font-normal text-muted-foreground ml-1">
              kg
            </span>
          </p>
          
          <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                stat.isSavings ? 'bg-primary' : stat.color.replace('text-', 'bg-')
              }`}
              style={{ width: `${Math.min(stat.percentage, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
