import { Leaf, Menu, User, LogOut, LayoutDashboard, IndianRupee, Radio, Trophy, Brain, ShoppingBag, TreePine, FileText, Zap, QrCode, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'waste', label: 'Waste ₹', icon: IndianRupee },
    { id: 'autotrack', label: 'AutoTrack', icon: Radio },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'predictions', label: 'AI Predict', icon: Brain },
    { id: 'smartmeter', label: 'Grid', icon: Zap },
    { id: 'qr', label: 'QR Check-in', icon: QrCode },
    { id: 'marketplace', label: 'Shop', icon: ShoppingBag },
    { id: 'offset', label: 'Offset', icon: TreePine },
    { id: 'report', label: 'ESG Report', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const { profile } = useAuth();
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const deptLabel = profile?.department || profile?.employee_id;

  return (
    <header className="sticky top-0 z-40 border-b border-border"
      style={{
        background: 'linear-gradient(180deg, hsl(160 30% 5% / 0.95), hsl(160 30% 5% / 0.85))',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute inset-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent blur-lg opacity-50" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-foreground">GreenTrace</h1>
              <p className="text-[10px] text-primary font-medium tracking-wider uppercase">Enterprise ESG Platform</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-3 h-3 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-foreground max-w-[120px] truncate leading-tight">{displayName}</span>
                {deptLabel && <span className="text-[10px] text-muted-foreground leading-tight">{deptLabel}</span>}
              </div>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="lg:hidden pb-4 animate-fade-in-up">
            <div className="grid grid-cols-2 gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                  className={`px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 text-left flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
