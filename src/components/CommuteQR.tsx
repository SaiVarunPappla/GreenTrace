import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { QrCode, Download, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type CommuteMode = 'company-bus' | 'metro' | 'carpool' | 'bicycle';

const MODES: { value: CommuteMode; label: string; emoji: string; distance: number }[] = [
  { value: 'company-bus', label: 'Company Bus', emoji: '🚌', distance: 15 },
  { value: 'metro', label: 'Metro', emoji: '🚇', distance: 12 },
  { value: 'carpool', label: 'Carpool', emoji: '🚗', distance: 18 },
  { value: 'bicycle', label: 'Bicycle', emoji: '🚲', distance: 5 },
];

const CommuteQR = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<CommuteMode>('company-bus');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedMode = MODES.find((m) => m.value === mode)!;
  const qrPayload = JSON.stringify({
    type: 'greentrace-checkin',
    userId: user?.id?.slice(0, 8) || 'anon',
    mode,
    distance: selectedMode.distance,
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
          Generate a QR code to scan on company bus/metro for instant trip logging.
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
            Scan at boarding point to auto-log {selectedMode.distance} km trip
          </p>
          <div className="flex gap-2">
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
