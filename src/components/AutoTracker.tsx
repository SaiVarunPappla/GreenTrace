import { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, ActivityFactory, TransportVehicleType } from '@/lib/carbonCalculator';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Zap, ToggleLeft, ToggleRight, Navigation, Signal, AlertTriangle, Train } from 'lucide-react';
import { toast } from 'sonner';
import GPSMap from '@/components/GPSMap';

interface AutoTrackerProps {
  onAddActivity: (activity: Activity) => void;
}

interface TrackedPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

interface TripEvent {
  id: string;
  label: string;
  location: string;
  distance: number;
  time: string;
  coords: { lat: number; lng: number };
}

// Geofence locations
const GEOFENCES = {
  college: { lat: 17.4435, lng: 78.3772, radius: 0.3, label: 'VNRVJIET Campus' },
  home: { lat: 17.385, lng: 78.4867, radius: 0.2, label: 'Home Zone' },
};

// Personal Carbon Budget (kg CO₂ per day)
const DAILY_CARBON_BUDGET = 8.0;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function totalDistanceFromPoints(points: TrackedPoint[]): number {
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    dist += haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return dist;
}

const AutoTracker = ({ onAddActivity }: AutoTrackerProps) => {
  const [enabled, setEnabled] = useState(false);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [vehicleType, setVehicleType] = useState<TransportVehicleType>('two-wheeler');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ lat: number; lng: number }[]>([]);
  const [insideGeofence, setInsideGeofence] = useState<string | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const [carbonBudgetUsed, setCarbonBudgetUsed] = useState(0);
  const [highIntensityAlert, setHighIntensityAlert] = useState(false);
  const pointsRef = useRef<TrackedPoint[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const lastLoggedDistRef = useRef(0);
  const lastPushTimeRef = useRef(Date.now());
  const geofenceLoggedRef = useRef<Set<string>>(new Set());

  // Session buffer: push every 50m OR 60 seconds
  const DISTANCE_BUFFER_KM = 0.05; // 50 meters
  const TIME_BUFFER_MS = 60000; // 60 seconds

  const checkGeofences = useCallback(
    (lat: number, lng: number) => {
      for (const [key, fence] of Object.entries(GEOFENCES)) {
        const dist = haversineDistance(lat, lng, fence.lat, fence.lng);
        if (dist <= fence.radius) {
          if (!geofenceLoggedRef.current.has(key)) {
            geofenceLoggedRef.current.add(key);
            setInsideGeofence(fence.label);
            toast.success(`📍 Geofence: Entered ${fence.label}`, {
              description: 'Commute auto-logged!',
            });
            const commuteDist = key === 'college' ? 5 : 2;
            try {
              const activity = ActivityFactory.create({
                type: 'transport',
                distance: commuteDist,
                vehicleType,
              });
              onAddActivity(activity);
            } catch { /* skip */ }
          }
          return;
        }
      }
      setInsideGeofence(null);
    },
    [vehicleType, onAddActivity]
  );

  const logSegment = useCallback((distance: number) => {
    if (distance < 0.05) return;
    const roundedDist = Math.round(distance * 100) / 100;
    try {
      const activity = ActivityFactory.create({
        type: 'transport',
        distance: roundedDist,
        vehicleType,
      });
      onAddActivity(activity);

      // Update carbon budget
      const impact = activity.calculateImpact();
      setCarbonBudgetUsed(prev => prev + impact);

      const event: TripEvent = {
        id: `gps-${Date.now()}`,
        label: `Live Segment (${vehicleType})`,
        location: currentCoords
          ? `${currentCoords.lat.toFixed(4)}°N, ${currentCoords.lng.toFixed(4)}°E`
          : 'GPS',
        distance: roundedDist,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        coords: currentCoords || { lat: 0, lng: 0 },
      };
      setEvents((prev) => [event, ...prev]);
      toast.success(`📍 Auto-logged: ${roundedDist} km via ${vehicleType}`);
    } catch { /* skip */ }
  }, [vehicleType, onAddActivity, currentCoords]);

  const switchToGreenMode = useCallback((mode: 'metro' | 'shared') => {
    const newType: TransportVehicleType = mode === 'metro' ? 'metro' : 'bus-ac';
    setVehicleType(newType);
    setHighIntensityAlert(false);
    toast.success(`✅ Switched to ${mode === 'metro' ? 'Metro' : 'Shared Ride'} mode — lower emissions!`);
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation API unavailable on this device.');
      return;
    }

    pointsRef.current = [];
    lastLoggedDistRef.current = 0;
    lastPushTimeRef.current = Date.now();
    geofenceLoggedRef.current = new Set();
    setTotalDistance(0);
    setBreadcrumbs([]);
    setCarbonBudgetUsed(0);

    toast('🛰️ Acquiring GPS signal…', { duration: 2000 });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed } = position.coords;
        const now = Date.now();
        setCurrentCoords({ lat: latitude, lng: longitude });
        setGpsAccuracy(accuracy);
        setBreadcrumbs((prev) => [...prev, { lat: latitude, lng: longitude }]);

        // Speed detection (m/s to km/h)
        const speedKmh = speed !== null && speed >= 0 ? speed * 3.6 : null;
        setCurrentSpeed(speedKmh);

        // High intensity alert: >20 km/h on a motorized vehicle
        if (speedKmh && speedKmh > 20 && !['metro', 'bus-ac', 'bus-nonac', 'bicycle', 'walking'].includes(vehicleType)) {
          setHighIntensityAlert(true);
          toast.warning('⚠️ High Intensity Detected — Carbon budget depleting fast!', {
            id: 'high-intensity',
            duration: 5000,
          });
        } else {
          setHighIntensityAlert(false);
        }

        if (accuracy < 30) {
          toast('📡 GPS Signal: High Accuracy', { id: 'gps-signal', duration: 1500 });
        }

        checkGeofences(latitude, longitude);

        const points = pointsRef.current;
        if (points.length > 0) {
          const last = points[points.length - 1];
          const segmentDist = haversineDistance(last.lat, last.lng, latitude, longitude);
          if (segmentDist < 0.005) return; // noise filter: <5m

          const newTotal = totalDistanceFromPoints([...points, { lat: latitude, lng: longitude, timestamp: now }]);
          setTotalDistance(newTotal);

          // Session buffer: push to DB every 50m OR every 60s
          const distSinceLastLog = newTotal - lastLoggedDistRef.current;
          const timeSinceLastPush = now - lastPushTimeRef.current;

          if (distSinceLastLog >= DISTANCE_BUFFER_KM || timeSinceLastPush >= TIME_BUFFER_MS) {
            if (distSinceLastLog >= 0.05) {
              logSegment(distSinceLastLog);
              lastLoggedDistRef.current = newTotal;
              lastPushTimeRef.current = now;
            }
          }
        }

        points.push({ lat: latitude, lng: longitude, timestamp: now });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location permission denied. Please allow location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Waiting for real-world GPS data…');
            break;
          case error.TIMEOUT:
            toast.error('GPS signal timeout — move to an open area.');
            break;
        }
        setEnabled(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
      }
    );
  }, [vehicleType, checkGeofences, logSegment]);

  useEffect(() => {
    if (enabled) startTracking();
    else stopTracking();
    return () => stopTracking();
  }, [enabled, startTracking, stopTracking]);

  const handleToggle = () => {
    if (enabled) {
      const remaining = totalDistance - lastLoggedDistRef.current;
      if (remaining >= 0.05) {
        logSegment(remaining);
      }
      toast.info(`🛑 Tracking stopped. Total: ${totalDistance.toFixed(2)} km`);
    }
    setEnabled(!enabled);
    if (!enabled) {
      setEvents([]);
      setTotalDistance(0);
      setBreadcrumbs([]);
      setGpsAccuracy(null);
      setInsideGeofence(null);
      setCurrentSpeed(null);
      setHighIntensityAlert(false);
    }
  };

  const VEHICLE_OPTIONS: { value: TransportVehicleType; label: string; emoji: string }[] = [
    { value: 'two-wheeler', label: 'Two-Wheeler', emoji: '🛵' },
    { value: 'petrol', label: 'Car (Petrol)', emoji: '🚗' },
    { value: 'auto-rickshaw', label: 'Auto', emoji: '🛺' },
    { value: 'metro', label: 'Metro', emoji: '🚇' },
    { value: 'bus-ac', label: 'AC Bus', emoji: '🚌' },
    { value: 'bicycle', label: 'Bicycle', emoji: '🚲' },
    { value: 'walking', label: 'Walking', emoji: '🚶' },
  ];

  const budgetPercent = Math.min((carbonBudgetUsed / DAILY_CARBON_BUDGET) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Control Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl border border-border p-6 overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card)))',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Navigation className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                Live GPS Engine
              </h3>
              <p className="text-xs text-muted-foreground">
                Real-time Haversine • 50m buffer • Geofencing
              </p>
            </div>
          </div>
          <button onClick={handleToggle} className="flex items-center gap-2">
            {enabled ? (
              <ToggleRight className="w-10 h-10 text-primary" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-muted-foreground" />
            )}
          </button>
        </div>

        {!enabled && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Select vehicle before starting:</p>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  onClick={() => setVehicleType(v.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    vehicleType === v.value
                      ? 'bg-primary/20 border border-primary/50 text-foreground'
                      : 'bg-secondary/50 border border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {enabled && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-primary">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                GPS Active
              </div>
              {gpsAccuracy !== null && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Signal className="w-3 h-3" />
                  ±{Math.round(gpsAccuracy)}m
                </div>
              )}
              {currentSpeed !== null && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  🏎️ {currentSpeed.toFixed(1)} km/h
                </div>
              )}
              {insideGeofence && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  📍 {insideGeofence}
                </div>
              )}
            </div>

            {/* Carbon Budget Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Daily Carbon Budget</span>
                <span className={budgetPercent > 80 ? 'text-destructive font-semibold' : 'text-foreground'}>
                  {carbonBudgetUsed.toFixed(2)} / {DAILY_CARBON_BUDGET} kg CO₂
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${budgetPercent}%` }}
                  style={{
                    background: budgetPercent > 80
                      ? 'hsl(0 60% 50%)'
                      : budgetPercent > 50
                      ? 'hsl(var(--eco-warning))'
                      : 'hsl(var(--primary))',
                  }}
                />
              </div>
            </div>

            {/* High intensity alert with quick actions */}
            <AnimatePresence>
              {highIntensityAlert && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-destructive/30 p-3 space-y-2"
                  style={{ background: 'linear-gradient(145deg, hsl(0 40% 12% / 0.6), hsl(var(--card)))' }}
                >
                  <div className="flex items-center gap-2 text-sm text-destructive font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    High Intensity Detected — Budget depleting fast
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => switchToGreenMode('metro')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/40 text-xs text-foreground hover:bg-primary/30 transition-all"
                    >
                      <Train className="w-3 h-3" /> Switch to Metro
                    </button>
                    <button
                      onClick={() => switchToGreenMode('shared')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/40 text-xs text-foreground hover:bg-primary/30 transition-all"
                    >
                      🚌 Log Shared Ride
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="text-xl font-display font-bold text-foreground">
                  {totalDistance.toFixed(2)} km
                </p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground">Position</p>
                <p className="text-sm font-mono text-foreground">
                  {currentCoords
                    ? `${currentCoords.lat.toFixed(4)}°N, ${currentCoords.lng.toFixed(4)}°E`
                    : 'Acquiring…'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {!enabled && !events.length && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-1">
              Waiting for real-world GPS data
            </p>
            <p className="text-xs text-muted-foreground/70">
              Enable tracking to start live distance calculation via Haversine formula.
              Activities auto-push every 50m or 60s.
            </p>
          </div>
        )}
      </motion.div>

      {/* Live Map */}
      {enabled && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GPSMap points={breadcrumbs} currentCoords={currentCoords} />
        </motion.div>
      )}

      {/* Event Feed */}
      <AnimatePresence>
        {events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-2xl border border-border p-6"
            style={{ background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card)))' }}
          >
            <h4 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Live Trip Log
            </h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                  className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50"
                >
                  <span className="text-2xl">📍</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{event.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-primary">{event.time}</span>
                      <span className="text-xs text-muted-foreground">{event.distance} km</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-xs text-primary">GPS-verified</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AutoTracker;
