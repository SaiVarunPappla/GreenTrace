import { Activity } from '@/lib/carbonCalculator';
import { Trash2 } from 'lucide-react';

interface ActivityListProps {
  activities: Activity[];
  onDelete: (id: string) => void;
}

const ActivityList = ({ activities, onDelete }: ActivityListProps) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transport':
        return 'bg-eco-sky/20 text-eco-sky border-eco-sky/30';
      case 'diet':
        return 'bg-eco-earth/20 text-eco-warning border-eco-warning/30';
      case 'utility':
        return 'bg-eco-leaf/20 text-eco-leaf border-eco-leaf/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="eco-card text-center py-12">
        <div className="text-4xl mb-4">🌍</div>
        <p className="text-muted-foreground">
          No activities logged yet. Start tracking your carbon footprint!
        </p>
      </div>
    );
  }

  return (
    <div className="eco-card">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">
        Recent Activities
      </h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {activities.slice().reverse().map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-all duration-200 animate-slide-in-right"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{activity.getIcon()}</span>
              <div>
                <p className="font-medium text-foreground">
                  {activity.getDescription()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.date.toLocaleDateString()} at{' '}
                  {activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="font-display font-bold text-foreground">
                  {activity.calculateImpact().toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">kg CO₂</span>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                  activity.category
                )}`}
              >
                {activity.category}
              </span>
              <button
                onClick={() => onDelete(activity.id)}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityList;
