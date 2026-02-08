import { useEffect, useState } from 'react';

interface CarbonGaugeProps {
  value: number; // Current CO2 in kg
  max: number; // Goal/Max CO2 in kg
  label?: string;
}

const CarbonGauge = ({ value, max, label = "CO₂ This Month" }: CarbonGaugeProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = Math.min((animatedValue / max) * 100, 100);
  
  // Calculate the stroke dashoffset for the arc
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75; // 270 degrees
  const offset = arc - (percentage / 100) * arc;

  useEffect(() => {
    // Animate the value
    const duration = 1500;
    const startTime = Date.now();
    const startValue = animatedValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      setAnimatedValue(startValue + (value - startValue) * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  // Color based on percentage
  const getColor = () => {
    if (percentage <= 50) return 'hsl(145, 70%, 50%)'; // Green
    if (percentage <= 75) return 'hsl(45, 90%, 55%)'; // Yellow/Warning
    return 'hsl(0, 62%, 50%)'; // Red
  };

  const getStatus = () => {
    if (percentage <= 50) return { text: 'Excellent', emoji: '🌱' };
    if (percentage <= 75) return { text: 'Good', emoji: '🌿' };
    if (percentage <= 100) return { text: 'Caution', emoji: '⚠️' };
    return { text: 'Over Limit', emoji: '🔴' };
  };

  const status = getStatus();

  return (
    <div className="relative flex flex-col items-center justify-center p-6">
      <svg
        width="200"
        height="180"
        viewBox="0 0 200 180"
        className="carbon-gauge"
      >
        {/* Background arc */}
        <path
          d="M 30 150 A 70 70 0 1 1 170 150"
          fill="none"
          stroke="hsl(160, 20%, 15%)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Animated progress arc */}
        <path
          d="M 30 150 A 70 70 0 1 1 170 150"
          fill="none"
          stroke={getColor()}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={arc}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke 0.5s ease',
            filter: `drop-shadow(0 0 10px ${getColor()})`,
          }}
        />
        
        {/* Glow effect */}
        <circle
          cx="100"
          cy="80"
          r="50"
          fill="none"
          style={{
            filter: `drop-shadow(0 0 30px ${getColor()})`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-center">
        <div className="text-4xl font-display font-bold text-foreground">
          {animatedValue.toFixed(1)}
        </div>
        <div className="text-sm text-muted-foreground">kg CO₂</div>
      </div>

      {/* Status badge */}
      <div 
        className="mt-4 px-4 py-2 rounded-full text-sm font-medium"
        style={{ 
          backgroundColor: `${getColor()}20`,
          color: getColor(),
          border: `1px solid ${getColor()}40`,
        }}
      >
        {status.emoji} {status.text}
      </div>

      {/* Label and goal */}
      <div className="mt-4 text-center">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-foreground/70 text-xs mt-1">
          Goal: {max} kg CO₂/month
        </p>
      </div>
    </div>
  );
};

export default CarbonGauge;
