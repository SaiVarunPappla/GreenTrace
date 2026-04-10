import { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, ActivityFactory, TransportVehicleType } from '@/lib/carbonCalculator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Zap, Navigation, Signal, AlertTriangle, Train, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import GPSMap from '@/components/GPSMap';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';

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

const DAILY_CARBON_BUDGET = 8.0;
const NOISE_THRESHOLD_KM = 0.002; // 2 meters
const SEGMENT_LOG_THRESHOLD_KM = 0.05; // 50 meters
const CLOUD_SYNC_INTERVAL_MS = 10000; // 10 seconds

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

const AutoTracker = ({ onAddActivity }: AutoTrackerProps) => {
  const { user } = useAuth();
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
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'acquiring' | 'active' | 'lost'>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { location: currentLocation, reverseGeocode } = useReverseGeocode();

  const pointsRef = useRef<TrackedPoint[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const lastLoggedDistRef = useRef(0);
  const geofenceLoggedRef = useRef<Set<string>>(new Set());
  const totalDistRef = useRef(0);
  const carbonUsedRef = useRef(0);
  const breadcrumbsRef = useRef<{ lat: number; lng: number }[]>([]);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // ============= Cloud Sync =============
  const syncToCloud = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid || !user) return;

    const coords = lastCoordsRef.current;
    const crumbs = breadcrumbsRef.current;

    // Only send last 500 breadcrumbs to keep payload reasonable
    const recentCrumbs = crumbs.slice(-500);

    await supabase.from('tracking_sessions').update({
      distance_traveled: totalDistRef.current,
      last_lat: coords?.lat ?? null,
      last_lng: coords?.lng ?? null,
      breadcrumbs: recentCrumbs,
      carbon_used: carbonUsedRef.current,
    }).eq('id', sid);
  }, [user]);

  // ============= Geofence Check =============
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

  // ============= Log Segment to DB =============
  const logSegment = useCallback(async (distance: number) => {
    if (distance < SEGMENT_LOG_THRESHOLD_KM) return;
    const roundedDist = Math.round(distance * 100) / 100;
    try {
      const activity = ActivityFactory.create({
        type: 'transport',
        distance: roundedDist,
        vehicleType,
      });
      onAddActivity(activity);

      const impact = activity.calculateImpact();
      carbonUsedRef.current += impact;
      setCarbonBudgetUsed(carbonUsedRef.current);

      const coords = lastCoordsRef.current;
      
      // Reverse geocode for real street name
      let locationStr = coords ? `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E` : 'GPS';
      if (coords) {
        const geoResult = await reverseGeocode(coords.lat, coords.lng);
        if (geoResult?.display) {
          locationStr = geoResult.display;
        }
      }

      const event: TripEvent = {
        id: `gps-${Date.now()}`,
        label: `Live Segment (${vehicleType})`,
        location: locationStr,
        distance: roundedDist,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        coords: coords || { lat: 0, lng: 0 },
      };
      setEvents((prev) => [event, ...prev]);
      toast.success(`📍 ${locationStr} — ${roundedDist} km`);
    } catch { /* skip */ }
  }, [vehicleType, onAddActivity, reverseGeocode]);

  // ============= Speed Alert =============
  const switchToGreenMode = useCallback((mode: 'metro' | 'shared') => {
    const newType: TransportVehicleType = mode === 'metro' ? 'metro' : 'bus-ac';
    setVehicleType(newType);
    setHighIntensityAlert(false);
    toast.success(`✅ Switched to ${mode === 'metro' ? 'Metro' : 'Shared Ride'} mode`);
  }, []);

  // ============= Stop Tracking =============
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    // Final sync & mark session completed
    if (sessionIdRef.current && user) {
      await supabase.from('tracking_sessions').update({
        status: 'completed',
        distance_traveled: totalDistRef.current,
        carbon_used: carbonUsedRef.current,
        breadcrumbs: breadcrumbsRef.current.slice(-500),
        ended_at: new Date().toISOString(),
      }).eq('id', sessionIdRef.current);
    }
    sessionIdRef.current = null;
    setSessionId(null);
    setGpsStatus('idle');
  }, [user]);

  // ============= Start Tracking =============
  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation API unavailable on this device.');
      return;
    }
    if (!user) {
      toast.error('Please sign in to use tracking.');
      return;
    }

    // Reset state
    pointsRef.current = [];
    lastLoggedDistRef.current = 0;
    geofenceLoggedRef.current = new Set();
    totalDistRef.current = 0;
    carbonUsedRef.current = 0;
    breadcrumbsRef.current = [];
    setTotalDistance(0);
    setBreadcrumbs([]);
    setCarbonBudgetUsed(0);
    setGpsStatus('acquiring');

    toast('🛰️ Acquiring GPS signal…', { duration: 2000 });

    // Create cloud session
    const { data: session, error } = await supabase.from('tracking_sessions').insert({
      user_id: user.id,
      vehicle_type: vehicleType,
      status: 'active',
    }).select('id').single();

    if (error || !session) {
      toast.error('Failed to create tracking session');
      setGpsStatus('idle');
      return;
    }

    sessionIdRef.current = session.id;
    setSessionId(session.id);

    // Start cloud sync interval (every 10s)
    syncIntervalRef.current = setInterval(() => {
      syncToCloud();
    }, CLOUD_SYNC_INTERVAL_MS);

    // Start GPS watch with strict params
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed } = position.coords;
        const now = Date.now();

        setCurrentCoords({ lat: latitude, lng: longitude });
        lastCoordsRef.current = { lat: latitude, lng: longitude };
        setGpsAccuracy(accuracy);
        setGpsStatus('active');

        // Add breadcrumb
        breadcrumbsRef.current = [...breadcrumbsRef.current, { lat: latitude, lng: longitude }];
        setBreadcrumbs([...breadcrumbsRef.current]);

        // Speed (m/s → km/h)
        const speedKmh = speed !== null && speed >= 0 ? speed * 3.6 : null;
        setCurrentSpeed(speedKmh);

        // High intensity alert
        if (speedKmh && speedKmh > 20 && !['metro', 'bus-ac', 'bus-nonac', 'bicycle', 'walking'].includes(vehicleType)) {
          setHighIntensityAlert(true);
          toast.warning('⚠️ High Intensity Detected — Carbon budget depleting fast!', {
            id: 'high-intensity',
            duration: 5000,
          });
        } else {
          setHighIntensityAlert(false);
        }

        // Geofence check
        checkGeofences(latitude, longitude);

        // Distance accumulation with noise filtering
        const points = pointsRef.current;
        if (points.length > 0) {
          const last = points[points.length - 1];
          const segmentDist = haversineDistance(last.lat, last.lng, latitude, longitude);

          // Noise filter: ignore movement under 2 meters
          if (segmentDist < NOISE_THRESHOLD_KM) return;

          totalDistRef.current += segmentDist;
          setTotalDistance(totalDistRef.current);

          // Log segment every 50m
          const distSinceLastLog = totalDistRef.current - lastLoggedDistRef.current;
          if (distSinceLastLog >= SEGMENT_LOG_THRESHOLD_KM) {
            logSegment(distSinceLastLog);
            lastLoggedDistRef.current = totalDistRef.current;
          }
        }

        points.push({ lat: latitude, lng: longitude, timestamp: now });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location permission denied. Please allow location access in your browser settings.');
            setEnabled(false);
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsStatus('lost');
            toast.error('🛰️ Searching for satellites…', { id: 'gps-lost' });
            break;
          case error.TIMEOUT:
            setGpsStatus('lost');
            toast.error('GPS signal timeout — move to an open area.', { id: 'gps-timeout' });
            break;
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  }, [user, vehicleType, checkGeofences, logSegment, syncToCloud]);

  // ============= Background Persistence =============
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && enabled && sessionIdRef.current) {
        // Tab lost focus — force sync immediately
        syncToCloud();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, syncToCloud]);

  // ============= Lifecycle =============
  useEffect(() => {
    if (enabled) startTracking();
    else stopTracking();
    return () => { stopTracking(); };
  }, [enabled, startTracking, stopTracking]);

  // ============= Resume active session on mount =============
  useEffect(() => {
    if (!user) return;
    const resumeSession = async () => {
      const { data } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        // Restore state from cloud
        totalDistRef.current = Number(data.distance_traveled) || 0;
        carbonUsedRef.current = Number(data.carbon_used) || 0;
        const crumbs = Array.isArray(data.breadcrumbs) ? data.breadcrumbs as { lat: number; lng: number }[] : [];
        breadcrumbsRef.current = crumbs;

        setTotalDistance(totalDistRef.current);
        setCarbonBudgetUsed(carbonUsedRef.current);
        setBreadcrumbs(crumbs);
        if (data.last_lat && data.last_lng) {
          setCurrentCoords({ lat: data.last_lat, lng: data.last_lng });
          lastCoordsRef.current = { lat: data.last_lat, lng: data.last_lng };
        }

        sessionIdRef.current = data.id;
        setSessionId(data.id);
        setEnabled(true);
        toast.info(`🔄 Resumed active tracking session (${totalDistRef.current.toFixed(2)} km)`);
      }
    };
    resumeSession();
  }, [user]);

  const handleToggle = () => {
    if (enabled) {
      const remaining = totalDistRef.current - lastLoggedDistRef.current;
      if (remaining >= SEGMENT_LOG_THRESHOLD_KM) {
        logSegment(remaining);
      }
      toast.info(`🛑 Tracking stopped. Total: ${totalDistRef.current.toFixed(2)} km`);
    }
    setEnabled(!enabled);
    if (!enabled) {
      setEvents([]);
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
            <div className="p-2 rounded-xl bg-primary/20 relative">
              <Navigation className="w-5 h-5 text-primary" />
              {/* Recording pulse */}
              {enabled && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                Live GPS Engine
              </h3>
              <p className="text-xs text-muted-foreground">
                {enabled
                  ? gpsStatus === 'acquiring'
                    ? '🛰️ Acquiring satellite signal…'
                    : gpsStatus === 'lost'
                    ? '🛰️ Searching for satellites…'
                    : `● Recording — Cloud syncing every 10s`
                  : 'Real-time Haversine • 2m noise filter • Cloud-synced'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {enabled && (
              <div className="flex items-center gap-1 text-xs">
                {gpsStatus === 'active' ? (
                  <Wifi className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-destructive" />
                )}
              </div>
            )}
            <button
              onClick={handleToggle}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                enabled
                  ? 'bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30'
                  : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
              }`}
            >
              {enabled ? '■ Stop' : '▶ Start'}
            </button>
          </div>
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
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {gpsStatus === 'active' ? 'GPS Active' : gpsStatus === 'acquiring' ? 'Acquiring…' : 'Signal Lost'}
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
              {sessionId && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  ☁️ Session synced
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

            {/* High intensity alert */}
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

            {/* GPS Status: Searching for Satellites */}
            {gpsStatus === 'lost' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 rounded-xl border border-border p-3 bg-secondary/30"
              >
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Searching for satellites… Move to an open area.</span>
              </motion.div>
            )}

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
              Enable tracking to start live distance calculation.
              Sessions persist in the cloud — resume on any device.
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
