import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/hooks/useActivities';
import { User } from '@/lib/carbonCalculator';
import { motion } from 'framer-motion';

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
import WasteRealization from '@/components/WasteRealization';
import AutoTracker from '@/components/AutoTracker';
import Leaderboard from '@/components/Leaderboard';
import PredictiveAI from '@/components/PredictiveAI';
import ESGReport from '@/components/ESGReport';
import CarbonHeatmap from '@/components/CarbonHeatmap';
import SmartMeter from '@/components/SmartMeter';
import CommuteQR from '@/components/CommuteQR';
import AuroraBackground from '@/components/AuroraBackground';
import DepartmentChallenge from '@/components/DepartmentChallenge';
import PrivacyToggle from '@/components/PrivacyToggle';
import OrganizationView from '@/components/OrganizationView';
import LiveActivityFeed from '@/components/LiveActivityFeed';
import CentenaryBadge from '@/components/CentenaryBadge';

const Index = () => {
  const { user: authUser, loading: authLoading } = useAuth();
  const { activities, addActivity, deleteActivity } = useActivities();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewMode, setViewMode] = useState<'my' | 'org'>('my');
  const { profile } = useAuth();
  const greenGoal = profile?.green_goal || 100;
  const [appUser] = useState(new User('1', 'Guest User', 'guest@greentrace.ai', greenGoal));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-primary/20 animate-pulse" />
      </div>
    );
  }

  if (!authUser) return <Navigate to="/auth" replace />;

  const totalEmissions = activities.reduce(
    (sum, activity) => sum + activity.calculateImpact(),
    0
  );

  return (
    <div className="min-h-screen bg-background relative pb-12">
      <AuroraBackground totalEmissions={totalEmissions} />
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="container mx-auto px-4 py-8 relative z-10">
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                Your <span className="eco-gradient-text">Green Dashboard</span>
              </h2>
              <p className="text-muted-foreground mb-3">
                Track, reduce, and offset your carbon footprint
              </p>

              {/* View Mode Toggle */}
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
                <button
                  onClick={() => setViewMode('my')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'my'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My View
                </button>
                <button
                  onClick={() => setViewMode('org')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'org'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Organization View
                </button>
              </div>
            </div>

            {viewMode === 'my' ? (
              <>
                <StatsCards activities={activities} />
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="eco-card flex items-center justify-center">
                      <CarbonGauge value={totalEmissions} max={appUser.greenGoal} />
                    </div>
                  </div>
                  <div className="lg:col-span-1 space-y-6">
                    <ActivityLogger onAddActivity={addActivity} />
                    <EcoTip activities={activities} />
                  </div>
                  <div className="lg:col-span-1 space-y-6">
                    <EmissionsChart activities={activities} />
                    <CarbonHeatmap activities={activities} />
                  </div>
                </div>
                <ActivityList activities={activities} onDelete={deleteActivity} />
              </>
            ) : (
              <OrganizationView />
            )}
          </motion.div>
        )}

        {activeTab === 'waste' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                <span className="eco-gradient-text">Waste Realization</span>
              </h2>
              <p className="text-muted-foreground">Your carbon inefficiency converted to Indian Rupees (₹)</p>
            </div>
            <WasteRealization activities={activities} />
          </motion.div>
        )}

        {activeTab === 'autotrack' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                <span className="eco-gradient-text">Invisible Logger</span>
              </h2>
              <p className="text-muted-foreground">Automated commute & activity detection simulation</p>
            </div>
            <AutoTracker onAddActivity={addActivity} />
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                <span className="eco-gradient-text">Department Leaderboard</span>
              </h2>
              <p className="text-muted-foreground">Compete for the highest Green Score</p>
            </div>
            <DepartmentChallenge />
            <div className="mt-6">
              <Leaderboard />
            </div>
          </motion.div>
        )}

        {activeTab === 'predictions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                <span className="eco-gradient-text">AI Predictions</span>
              </h2>
              <p className="text-muted-foreground">AI-powered emission forecasting & waste analysis</p>
            </div>
            <PredictiveAI activities={activities} />
          </motion.div>
        )}

        {activeTab === 'smartmeter' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                <span className="eco-gradient-text">Smart Grid Monitor</span>
              </h2>
              <p className="text-muted-foreground">Real-time India grid carbon intensity simulation</p>
            </div>
            <SmartMeter />
          </motion.div>
        )}

        {activeTab === 'qr' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                <span className="eco-gradient-text">QR Check-in</span>
              </h2>
              <p className="text-muted-foreground">Generate commute QR codes for instant trip logging</p>
            </div>
            <CommuteQR />
          </motion.div>
        )}

        {activeTab === 'marketplace' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                <span className="eco-gradient-text">Eco Marketplace</span>
              </h2>
              <p className="text-muted-foreground">Sustainable products for a greener lifestyle</p>
            </div>
            <Marketplace />
          </motion.div>
        )}

        {activeTab === 'offset' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                <span className="eco-gradient-text">Carbon Offset</span>
              </h2>
              <p className="text-muted-foreground">Neutralize your impact through verified projects</p>
            </div>
            <CarbonOffset totalEmissions={totalEmissions} />
          </motion.div>
        )}

        {activeTab === 'report' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                <span className="eco-gradient-text">ESG Report</span>
              </h2>
              <p className="text-muted-foreground">Generate professional sustainability reports for HR</p>
            </div>
            <ESGReport activities={activities} />
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                <span className="eco-gradient-text">Settings</span>
              </h2>
              <p className="text-muted-foreground">Configure privacy and preferences</p>
            </div>
            <PrivacyToggle />
          </motion.div>
        )}
      </main>

      <footer className="border-t border-border py-8 mt-16 relative z-10 mb-10">
        <div className="container mx-auto px-4 text-center space-y-3">
          <CentenaryBadge />
          <p className="text-sm text-muted-foreground">🌍 GreenTrace India • Enterprise ESG & Carbon Intelligence</p>
          <p className="text-xs text-primary font-medium">🇮🇳 Designed for the Green India Initiative</p>
        </div>
      </footer>

      <LiveActivityFeed />
    </div>
  );
};

export default Index;
