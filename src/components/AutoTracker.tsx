import { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, ActivityFactory, TransportVehicleType } from '@/lib/carbonCalculator';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Zap, ToggleLeft, ToggleRight, Radio, Navigation } from 'lucide-react';
import { toast } from 'sonner';

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

// Haversine formula for accurate distance between two GPS coordinates
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in km
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
  const [enabled, setEnabled] = useState(false);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [vehicleType, setVehicleType] = useState<TransportVehicleType>('two-wheeler');
  const pointsRef = useRef<TrackedPoint[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const lastLoggedDistRef = useRef(0);

  const DISTANCE_THRESHOLD_KM = 0.5; // Log every 500m

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    pointsRef.current = [];
    lastLoggedDistRef.current = 0;
    setTotalDistance(0);

    toast.success('📍 GPS Tracking enabled — move around to log your trip!');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const now = Date.now();
        setCurrentCoords({ lat: latitude, lng: longitude });

        const points = pointsRef.current;
        if (points.length > 0) {
          const last = points[points.length - 1];
          const segmentDist = haversineDistance(last.lat, last.lng, latitude, longitude);

          // Ignore GPS jitter (< 10m movements)
          if (segmentDist < 0.01) return;

          const newTotal = totalDistanceFromPoints([...points, { lat: latitude, lng: longitude, timestamp: now }]);
          setTotalDistance(newTotal);

          // Auto-log activity every DISTANCE_THRESHOLD_KM
          const distSinceLastLog = newTotal - lastLoggedDistRef.current;
          if (distSinceLastLog >= DISTANCE_THRESHOLD_KM) {
            const roundedDist = Math.round(distSinceLastLog * 10) / 10;
            try {
              const activity = ActivityFactory.create({
                type: 'transport',
                distance: roundedDist,
                vehicleType,
              });
              onAddActivity(activity);

              const event: TripEvent = {
                id: `gps-${now}`,
                label: `Live Trip Segment (${vehicleType})`,
                location: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
                distance: roundedDist,
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                coords: { lat: latitude, lng: longitude },
              };
              setEvents((prev) => [event, ...prev]);
              lastLoggedDistRef.current = newTotal;
              toast.success(`📍 Auto-logged: ${roundedDist} km via ${vehicleType}`);
            } catch {
              // skip invalid
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
            toast.error('Location information unavailable.');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out.');
            break;
        }
        setEnabled(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  }, [vehicleType, onAddActivity]);

  function totalDistanceFromPoints(points: TrackedPoint[]): number {
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      dist += haversineDistance(
        points[i - 1].lat, points[i - 1].lng,
        points[i].lat, points[i].lng
      );
    }
    return dist;
  }

  useEffect(() => {
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [enabled, startTracking, stopTracking]);

  const handleToggle = () => {
    if (enabled) {
      // Final log of remaining distance
      const remaining = totalDistance - lastLoggedDistRef.current;
      if (remaining >= 0.1) {
        const roundedDist = Math.round(remaining * 10) / 10;
        try {
          const activity = ActivityFactory.create({
            type: 'transport',
            distance: roundedDist,
            vehicleType,
          });
          onAddActivity(activity);
          toast.success(`📍 Final segment logged: ${roundedDist} km`);
        } catch { /* skip */ }
      }
      toast.info(`🛑 Tracking stopped. Total: ${totalDistance.toFixed(2)} km`);
    }
    setEnabled(!enabled);
    if (!enabled) {
      setEvents([]);
      setTotalDistance(0);
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
                Live GPS Tracker
              </h3>
              <p className="text-sm text-muted-foreground">
                Real-time location tracking with Haversine distance
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

        {/* Vehicle selector */}
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
            <div className="flex items-center gap-2 text-sm text-primary">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              GPS Active — Tracking movement...
            </div>
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
                    : 'Acquiring...'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {!enabled && !events.length && (
          <p className="text-sm text-muted-foreground">
            Enable to track your real-time location via GPS. Distance is calculated using the Haversine formula.
            Activities auto-log every 500m of movement.
          </p>
        )}
      </motion.div>

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
                    <Zap className="w-3 h-3 text-eco-leaf" />
                    <span className="text-xs text-eco-leaf">GPS-logged</span>
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
