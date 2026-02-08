import { TreePine, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface CarbonOffsetProps {
  totalEmissions: number;
}

const CarbonOffset = ({ totalEmissions }: CarbonOffsetProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate offset cost (approximately $15 per tonne of CO2)
  const offsetCost = (totalEmissions / 1000) * 15;
  const treesEquivalent = Math.ceil(totalEmissions / 21); // One tree absorbs ~21kg CO2/year

  return (
    <div 
      className="eco-card relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background glow */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-eco-leaf/20">
            <TreePine className="w-5 h-5 text-eco-leaf" />
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground">
            Carbon Offset
          </h3>
        </div>

        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-5xl font-display font-bold eco-gradient-text">
              {totalEmissions.toFixed(1)}
            </span>
            <span className="text-lg text-muted-foreground">kg CO₂</span>
          </div>

          <p className="text-muted-foreground mb-6">
            Your current emissions equal{' '}
            <span className="text-foreground font-medium">{treesEquivalent} trees</span>
            {' '}needed to offset for one year.
          </p>

          <button className="eco-button group flex items-center justify-center gap-2 mx-auto">
            <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
            Offset Now (${offsetCost.toFixed(2)})
          </button>

          <p className="text-xs text-muted-foreground mt-4">
            Funds go to verified reforestation projects 🌲
          </p>
        </div>

        {/* Decorative trees */}
        <div className="absolute bottom-4 right-4 flex gap-1 opacity-30">
          {[...Array(Math.min(treesEquivalent, 5))].map((_, i) => (
            <TreePine 
              key={i} 
              className="w-4 h-4 text-eco-leaf"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarbonOffset;
