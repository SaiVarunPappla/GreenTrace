import { useState, useEffect } from 'react';
import { Satellite, Fuel, Zap, Activity, Wifi, WifiOff } from 'lucide-react';

interface GridStatus {
  loadGW: number;
  frequency: number;
  online: boolean;
}

const SystemStatusBar = () => {
  const [gpsLock, setGpsLock] = useState<boolean>(false);
  const [gpsSats, setGpsSats] = useState<number>(0);
  const [gridStatus, setGridStatus] = useState<GridStatus>({ loadGW: 0, frequency: 50.0, online: false });
  const [petrolPrice, setPetrolPrice] = useState<number>(0);
  const [dataAge, setDataAge] = useState<string>('--');

  // GPS lock check
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsLock(true);
        setGpsSats(pos.coords.accuracy < 20 ? 12 : pos.coords.accuracy < 50 ? 8 : 4);
      },
      () => setGpsLock(false),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Grid & fuel data (India-specific realistic values)
  useEffect(() => {
    const updateMetrics = () => {
      const hour = new Date().getHours();
      const isPeak = (hour >= 9 && hour <= 14) || (hour >= 18 && hour <= 21);
      const baseLoad = isPeak ? 195 : 165;
      const loadGW = baseLoad + (Math.random() * 10 - 5);
      const freq = 49.95 + Math.random() * 0.1;

      setGridStatus({ loadGW, frequency: freq, online: true });
      setPetrolPrice(105.72 + (Math.random() * 2 - 1));
      setDataAge('Live');
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
      {/* GPS */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Satellite className={`w-3 h-3 ${gpsLock ? 'text-primary' : 'text-destructive'}`} />
        <span className="text-[10px] font-mono text-muted-foreground">
          {gpsLock ? `GPS ${gpsSats}⬆` : 'NO FIX'}
        </span>
      </div>

      <div className="w-px h-3 bg-border shrink-0" />

      {/* Grid Load */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Zap className={`w-3 h-3 ${gridStatus.online ? 'text-eco-warning' : 'text-destructive'}`} />
        <span className="text-[10px] font-mono text-muted-foreground">
          {gridStatus.online ? `${gridStatus.loadGW.toFixed(1)} GW` : 'OFFLINE'}
        </span>
      </div>

      <div className="w-px h-3 bg-border shrink-0" />

      {/* Grid Frequency */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Activity className={`w-3 h-3 ${gridStatus.frequency >= 49.9 ? 'text-primary' : 'text-destructive'}`} />
        <span className="text-[10px] font-mono text-muted-foreground">
          {gridStatus.frequency.toFixed(2)} Hz
        </span>
      </div>

      <div className="w-px h-3 bg-border shrink-0" />

      {/* Petrol */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Fuel className="w-3 h-3 text-eco-sky" />
        <span className="text-[10px] font-mono text-muted-foreground">
          {petrolPrice > 0 ? `₹${petrolPrice.toFixed(1)}/L` : '--'}
        </span>
      </div>

      <div className="w-px h-3 bg-border shrink-0" />

      {/* Connection */}
      <div className="flex items-center gap-1.5 shrink-0">
        {gridStatus.online ? (
          <Wifi className="w-3 h-3 text-primary" />
        ) : (
          <WifiOff className="w-3 h-3 text-destructive" />
        )}
        <span className="text-[10px] font-mono text-muted-foreground">{dataAge}</span>
      </div>
    </div>
  );
};

export default SystemStatusBar;
