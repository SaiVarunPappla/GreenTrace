import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { QrCode, Copy, Check, Scan } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/hooks/useActivities';
import { ActivityFactory } from '@/lib/carbonCalculator';
import { toast } from 'sonner';

type CommuteMode = 'company-bus' | 'metro' | 'carpool' | 'bicycle';

const MODES: { value: CommuteMode; label: string; emoji: string; distance: number; vehicleType: string }[] = [
  { value: 'company-bus', label: 'Company Bus', emoji: '🚌', distance: 15, vehicleType: 'bus-ac' },
  { value: 'metro', label: 'Metro', emoji: '🚇', distance: 5, vehicleType: 'metro' },
  { value: 'carpool', label: 'Carpool', emoji: '🚗', distance: 18, vehicleType: 'petrol' },
  { value: 'bicycle', label: 'Bicycle', emoji: '🚲', distance: 5, vehicleType: 'bicycle' },
];

const CommuteQR = () => {
  const { user } = useAuth();
  const { addActivity } = useActivities();
  const [mode, setMode] = useState<CommuteMode>('metro');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scanning, setScanning] = useState(false);

  const selectedMode = MODES.find((m) => m.value === mode)!;
  const qrPayload = JSON.stringify({
    type: 'greentrace-checkin',
    userId: user?.id?.slice(0, 8) || 'anon',
    mode,
    distance: selectedMode.distance,
    vehicleType: selectedMode.vehicleType,
    timestamp: new Date().toISOString(),
  });

  const handleGenerate = () => {
    setGenerated(true);
    toast.success(`QR generated for ${selectedMode.label} check-in!`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Check-in data copied!');
  };

  // Simulate QR scan — instantly logs a trip
  const handleScan = async () => {
    setScanning(true);
    try {
      const activity = ActivityFactory.create({
        type: 'transport',
        distance: selectedMode.distance,
        vehicleType: selectedMode.vehicleType as any,
      });
      await addActivity(activity);
      toast.success(
        `🎉 ${selectedMode.emoji} ${selectedMode.label} check-in scanned! ${selectedMode.distance} km trip logged instantly.`,
        { duration: 5000 }
      );
    } catch (err) {
      toast.error('Failed to log trip from QR scan.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border p-6"
        style={{ background: 'var(--gradient-card)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-display font-semibold text-foreground">
            Commute QR Check-in
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Generate a QR code, then click "Scan QR" to instantly log the trip to your dashboard.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => { setMode(m.value); setGenerated(false); }}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === m.value
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-border bg-secondary/30 hover:bg-secondary/60'
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <p className="text-sm font-medium text-foreground mt-1">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.distance} km est.</p>
            </button>
          ))}
        </div>

        <button onClick={handleGenerate} className="eco-button w-full flex items-center justify-center gap-2">
          <QrCode className="w-4 h-4" />
          Generate Commute QR
        </button>
      </motion.div>

      {/* QR Display */}
      {generated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-primary/30 p-8 flex flex-col items-center"
          style={{
            background: 'linear-gradient(145deg, hsl(140 35% 8% / 0.8), hsl(var(--card)))',
          }}
        >
          <div className="bg-white rounded-2xl p-4 mb-4">
            <QRCodeSVG
              value={qrPayload}
              size={200}
              bgColor="#ffffff"
              fgColor="#064E3B"
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-foreground font-display font-semibold mb-1">
            {selectedMode.emoji} {selectedMode.label} Check-in
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Click "Scan QR" to auto-log {selectedMode.distance} km trip
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="eco-button px-5 py-2.5 flex items-center gap-2 disabled:opacity-50"
            >
              <Scan className="w-4 h-4" />
              {scanning ? 'Logging...' : 'Scan QR'}
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-secondary text-foreground text-sm flex items-center gap-2 hover:bg-secondary/80 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Data'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CommuteQR;
