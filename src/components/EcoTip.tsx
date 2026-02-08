import { Activity, EcoCoach } from '@/lib/carbonCalculator';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EcoTipProps {
  activities: Activity[];
}

const EcoTip = ({ activities }: EcoTipProps) => {
  const [tip, setTip] = useState('');
  const [category, setCategory] = useState<'transport' | 'diet' | 'utility'>('transport');
  const ecoCoach = new EcoCoach();

  const refreshTip = () => {
    if (activities.length > 0) {
      const highestCategory = ecoCoach.getHighestCategory(activities);
      setCategory(highestCategory);
      setTip(ecoCoach.getTip(highestCategory));
    } else {
      setTip("Start logging your activities to get personalized eco-tips! 🌱");
    }
  };

  useEffect(() => {
    refreshTip();
  }, [activities.length]);

  const getCategoryEmoji = () => {
    switch (category) {
      case 'transport':
        return '🚗';
      case 'diet':
        return '🍽️';
      case 'utility':
        return '💡';
    }
  };

  return (
    <div className="eco-card relative overflow-hidden group">
      {/* Decorative glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl transition-all duration-500 group-hover:bg-primary/30" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground">
              Eco Coach
            </h3>
          </div>
          <button
            onClick={refreshTip}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            title="Get new tip"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {activities.length > 0 && (
          <div className="mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-eco-forest/50 text-eco-sage border border-eco-sage/30">
              {getCategoryEmoji()} Focus: {category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
          </div>
        )}

        <p className="text-foreground/90 leading-relaxed">
          {tip}
        </p>
      </div>
    </div>
  );
};

export default EcoTip;
