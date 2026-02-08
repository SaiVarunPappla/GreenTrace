import { useState, useEffect } from 'react';
import { Activity, DataManager, User } from '@/lib/carbonCalculator';

// Use Singleton pattern for DataManager
const dataManager = DataManager.getInstance();
import Header from '@/components/Header';
import CarbonGauge from '@/components/CarbonGauge';
import ActivityLogger from '@/components/ActivityLogger';
import ActivityList from '@/components/ActivityList';
import StatsCards from '@/components/StatsCards';
import EcoTip from '@/components/EcoTip';
import EmissionsChart from '@/components/EmissionsChart';
import Marketplace from '@/components/Marketplace';
import CarbonOffset from '@/components/CarbonOffset';
import Confetti from '@/components/Confetti';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [user] = useState(new User('1', 'Guest User', 'guest@greentrace.ai', 100));

  // Load activities on mount
  useEffect(() => {
    const savedActivities = dataManager.loadActivities();
    setActivities(savedActivities);
  }, []);

  // Calculate total emissions
  const totalEmissions = activities.reduce(
    (sum, activity) => sum + activity.calculateImpact(),
    0
  );

  // Check for goal achievement
  useEffect(() => {
    if (activities.length > 0 && user.isGoalMet(totalEmissions) && totalEmissions > 0) {
      setShowConfetti(true);
    }
  }, [totalEmissions, activities.length]);

  const handleAddActivity = (activity: Activity) => {
    const newActivities = [...activities, activity];
    setActivities(newActivities);
    dataManager.saveActivities(newActivities);
  };

  const handleDeleteActivity = (id: string) => {
    const newActivities = activities.filter((a) => a.id !== id);
    setActivities(newActivities);
    dataManager.saveActivities(newActivities);
  };

  return (
    <div className="min-h-screen bg-background">
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                Your <span className="eco-gradient-text">Green Dashboard</span>
              </h2>
              <p className="text-muted-foreground">
                Track, reduce, and offset your carbon footprint
              </p>
            </div>

            {/* Stats Overview */}
            <StatsCards activities={activities} />

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Gauge */}
              <div className="lg:col-span-1">
                <div className="eco-card flex items-center justify-center">
                  <CarbonGauge 
                    value={totalEmissions} 
                    max={user.greenGoal} 
                  />
                </div>
              </div>

              {/* Middle Column - Logger & Tips */}
              <div className="lg:col-span-1 space-y-6">
                <ActivityLogger onAddActivity={handleAddActivity} />
                <EcoTip activities={activities} />
              </div>

              {/* Right Column - Chart */}
              <div className="lg:col-span-1">
                <EmissionsChart activities={activities} />
              </div>
            </div>

            {/* Activity List */}
            <ActivityList 
              activities={activities} 
              onDelete={handleDeleteActivity} 
            />
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                <span className="eco-gradient-text">Eco Marketplace</span>
              </h2>
              <p className="text-muted-foreground">
                Sustainable products for a greener lifestyle
              </p>
            </div>
            <Marketplace />
          </div>
        )}

        {activeTab === 'offset' && (
          <div className="max-w-2xl mx-auto animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                <span className="eco-gradient-text">Carbon Offset</span>
              </h2>
              <p className="text-muted-foreground">
                Neutralize your impact through verified projects
              </p>
            </div>
            <CarbonOffset totalEmissions={totalEmissions} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            🌍 GreenTrace • Built for a sustainable future
          </p>
          <p className="text-xs text-primary font-medium">
            🇮🇳 Designed for the Green India Initiative
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
