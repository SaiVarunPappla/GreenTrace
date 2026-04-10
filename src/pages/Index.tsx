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
import AuditTrail from '@/components/AuditTrail';

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

      <main className="container mx-auto px-3 py-5 relative z-10">
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  <span className="eco-gradient-text">Green Dashboard</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time carbon intelligence • GPS-verified
                </p>
              </div>
              <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-secondary/50 border border-border">
                <button
                  onClick={() => setViewMode('my')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'my'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My View
                </button>
                <button
                  onClick={() => setViewMode('org')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'org'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Org View
                </button>
              </div>
            </div>

            {viewMode === 'my' ? (
              <>
                <StatsCards activities={activities} />
                <div className="grid lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1">
                    <div className="eco-card flex items-center justify-center p-4">
                      <CarbonGauge value={totalEmissions} max={appUser.greenGoal} />
                    </div>
                  </div>
                  <div className="lg:col-span-1 space-y-4">
                    <ActivityLogger onAddActivity={addActivity} />
                    <EcoTip activities={activities} />
                  </div>
                  <div className="lg:col-span-1 space-y-4">
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="mb-5">
              <h2 className="text-2xl font-display font-bold text-foreground">
                <span className="eco-gradient-text">Waste Realization</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Carbon inefficiency in ₹ — based on actual GPS & utility logs</p>
            </div>
            <WasteRealization activities={activities} />
          </motion.div>
        )}

        {activeTab === 'autotrack' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <div className="mb-5">
              <h2 className="text-2xl font-display font-bold text-foreground">
                <span className="eco-gradient-text">Invisible Logger</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Live GPS • Reverse geocoding • Cloud-synced every 10s</p>
            </div>
            <AutoTracker onAddActivity={addActivity} />
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <div className="mb-5">
              <h2 className="text-2xl font-display font-bold text-foreground">
                <span className="eco-gradient-text">Department Leaderboard</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Realtime Green Score rankings</p>
            </div>
            <DepartmentChallenge />
            <div className="mt-4">
              <Leaderboard />
            </div>
          </motion.div>
        )}

        {activeTab === 'predictions' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <div className="mb-5">
              <h2 className="text-2xl font-display font-bold text-foreground">
                <span className="eco-gradient-text">Predictive Analytics</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Linear regression on actual logs + AI deep analysis</p>
            </div>
            <PredictiveAI activities={activities} />
          </motion.div>
        )}

        {activeTab === 'smartmeter' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <div className="mb-5">
              <h2 className="text-2xl font-display font-bold text-foreground">
                <span className="eco-gradient-text">Smart Grid Monitor</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time India grid intensity • CEA/POSOCO data</p>
            </div>
            <SmartMeter />
          </motion.div>
        )}

        {activeTab === 'qr' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <div className="mb-5">
              <h2 className="text-2xl font-display font-bold text-foreground">
                <span className="eco-gradient-text">QR Check-in</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Instant commute logging via scannable QR</p>
            </div>
            <CommuteQR />
          </motion.div>
        )}

        {activeTab === 'marketplace' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="mb-5">
              <h2 className="text-2xl font-display font-bold text-foreground">
                <span className="eco-gradient-text">Eco Marketplace</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Sustainable products for a greener lifestyle</p>
            </div>
            <Marketplace />
          </motion.div>
        )}

        {activeTab === 'offset' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <div className="mb-5">
              <h2 className="text-2xl font-display font-bold text-foreground">
                <span className="eco-gradient-text">Carbon Offset</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Verified Indian offset projects</p>
            </div>
            <CarbonOffset totalEmissions={totalEmissions} />
          </motion.div>
        )}

        {activeTab === 'report' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <div className="mb-5">
              <h2 className="text-2xl font-display font-bold text-foreground">
                <span className="eco-gradient-text">ESG Report</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Audit-ready PDF with GPS-verified data & hash verification</p>
            </div>
            <ESGReport activities={activities} />
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <div className="mb-5">
              <h2 className="text-2xl font-display font-bold text-foreground">
                <span className="eco-gradient-text">Settings</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Privacy & preferences</p>
            </div>
            <PrivacyToggle />
          </motion.div>
        )}
      </main>

      <footer className="border-t border-border py-6 mt-12 relative z-10 mb-8">
        <div className="container mx-auto px-4 text-center space-y-2">
          <AuditTrail />
          <p className="text-xs text-muted-foreground">GreenTrace India • Enterprise ESG & Carbon Intelligence Platform</p>
          <p className="text-[10px] text-primary/70 font-medium">🇮🇳 100% Real-World Data • Zero Simulation • GPS-Verified</p>
        </div>
      </footer>

      <LiveActivityFeed />
    </div>
  );
};

export default Index;
