import { useState, useEffect, useCallback } from 'react';
import { Activity, ActivityFactory, TransportVehicleType } from '@/lib/carbonCalculator';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Zap, ToggleLeft, ToggleRight, Radio } from 'lucide-react';
import { toast } from 'sonner';

interface AutoTrackerProps {
  onAddActivity: (activity: Activity) => void;
}

interface SimulatedEvent {
  id: string;
  type: 'office-checkin' | 'meeting-commute' | 'lunch-break' | 'home-departure';
  label: string;
  location: string;
  vehicleType: TransportVehicleType;
  distance: number;
  time: string;
  detected: boolean;
}

const SIMULATED_SCHEDULE: Omit<SimulatedEvent, 'id' | 'detected'>[] = [
  { type: 'home-departure', label: 'Home → Office Commute', location: 'Koramangala, Bangalore', vehicleType: 'metro', distance: 12, time: '08:30 AM' },
  { type: 'office-checkin', label: 'Office Check-in Detected', location: 'HSR Layout Tech Park', vehicleType: 'walking', distance: 0.5, time: '09:15 AM' },
  { type: 'meeting-commute', label: 'Client Meeting Commute', location: 'MG Road, Bangalore', vehicleType: 'auto-rickshaw', distance: 6, time: '11:00 AM' },
  { type: 'lunch-break', label: 'Lunch Run', location: 'Nearby Restaurant', vehicleType: 'two-wheeler', distance: 2, time: '01:00 PM' },
];

const AutoTracker = ({ onAddActivity }: AutoTrackerProps) => {
  const [enabled, setEnabled] = useState(false);
  const [events, setEvents] = useState<SimulatedEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const simulateDetection = useCallback(() => {
    if (currentIndex >= SIMULATED_SCHEDULE.length) return;

    const schedule = SIMULATED_SCHEDULE[currentIndex];
    const newEvent: SimulatedEvent = {
      ...schedule,
      id: `auto-${Date.now()}-${currentIndex}`,
      detected: true,
    };

    setEvents(prev => [newEvent, ...prev]);
    setCurrentIndex(prev => prev + 1);

    // Auto-log if not walking
    if (schedule.distance > 0 && schedule.vehicleType !== 'walking') {
      try {
        const activity = ActivityFactory.create({
          type: 'transport',
          distance: schedule.distance,
          vehicleType: schedule.vehicleType,
        });
        onAddActivity(activity);
        toast.success(`Auto-logged: ${schedule.label} (${schedule.distance}km via ${schedule.vehicleType})`);
      } catch {
        // silently skip invalid
      }
    }
  }, [currentIndex, onAddActivity]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(simulateDetection, 4000);
    return () => clearInterval(interval);
  }, [enabled, simulateDetection]);

  const handleToggle = () => {
    if (!enabled) {
      setEvents([]);
      setCurrentIndex(0);
      toast.info('AutoTracker enabled — simulating location events...');
    }
    setEnabled(!enabled);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'office-checkin': return '🏢';
      case 'meeting-commute': return '🤝';
      case 'lunch-break': return '🍛';
      case 'home-departure': return '🏠';
      default: return '📍';
    }
  };

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
              <Radio className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                Invisible Logger
              </h3>
              <p className="text-sm text-muted-foreground">
                Simulated automated commute detection
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

        {enabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-primary"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Listening for location events...
          </motion.div>
        )}

        {!enabled && (
          <p className="text-sm text-muted-foreground">
            Enable to simulate automatic detection of office check-ins, meeting commutes, and daily travel patterns.
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
            style={{
              background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card)))',
            }}
          >
            <h4 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Activity Feed
            </h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50"
                >
                  <span className="text-2xl">{getEventIcon(event.type)}</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{event.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-primary">{event.time}</span>
                      {event.distance > 0 && (
                        <span className="text-xs text-muted-foreground">{event.distance} km</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-eco-leaf" />
                    <span className="text-xs text-eco-leaf">Auto-logged</span>
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
