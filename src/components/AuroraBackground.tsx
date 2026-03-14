import { useMemo } from 'react';

interface AuroraBackgroundProps {
  totalEmissions: number;
  maxEmissions?: number;
}

const AuroraBackground = ({ totalEmissions, maxEmissions = 200 }: AuroraBackgroundProps) => {
  const intensity = useMemo(() => {
    const ratio = Math.min(totalEmissions / maxEmissions, 1);
    return ratio;
  }, [totalEmissions, maxEmissions]);

  // Green when low, grey-green when high
  const hue = useMemo(() => 140 - intensity * 40, [intensity]); // 140 (green) → 100 (yellow-green)
  const saturation = useMemo(() => 50 - intensity * 30, [intensity]); // 50% → 20%
  const lightness = useMemo(() => 15 - intensity * 8, [intensity]); // 15% → 7%
  const opacity = useMemo(() => 0.4 - intensity * 0.2, [intensity]); // 0.4 → 0.2

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Primary aurora blob */}
      <div
        className="absolute w-[800px] h-[600px] rounded-full blur-[120px]"
        style={{
          top: '-200px',
          left: '10%',
          background: `radial-gradient(ellipse, hsl(${hue} ${saturation}% ${lightness}% / ${opacity}), transparent 70%)`,
          animation: 'aurora-drift 20s ease-in-out infinite',
        }}
      />
      {/* Secondary blob */}
      <div
        className="absolute w-[600px] h-[400px] rounded-full blur-[100px]"
        style={{
          bottom: '-100px',
          right: '5%',
          background: `radial-gradient(ellipse, hsl(${hue + 20} ${saturation + 10}% ${lightness + 3}% / ${opacity * 0.7}), transparent 70%)`,
          animation: 'aurora-drift 25s ease-in-out infinite reverse',
        }}
      />
      {/* Mist layer */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[150px]"
        style={{
          top: '40%',
          left: '40%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(ellipse, hsl(${hue - 10} ${saturation}% ${lightness + 2}% / ${opacity * 0.5}), transparent 70%)`,
          animation: 'aurora-float 30s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes aurora-drift {
          0%, 100% { transform: translateX(0) translateY(0) scale(1); }
          33% { transform: translateX(50px) translateY(-30px) scale(1.05); }
          66% { transform: translateX(-30px) translateY(20px) scale(0.95); }
        }
        @keyframes aurora-float {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-45%, -55%) scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AuroraBackground;
