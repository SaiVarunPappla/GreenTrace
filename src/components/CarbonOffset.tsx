import { TreePine, Sparkles, MapPin } from 'lucide-react';
import { useState } from 'react';
import { formatINR } from '@/lib/carbonCalculator';

interface CarbonOffsetProps {
  totalEmissions: number;
}

const offsetProjects = [
  {
    id: 1,
    name: 'Plant a Tree in Western Ghats',
    price: 85,
    description: 'Native species reforestation',
    icon: '🌳',
  },
  {
    id: 2,
    name: 'Mangrove Restoration - Sundarbans',
    price: 150,
    description: 'Coastal ecosystem protection',
    icon: '🌿',
  },
  {
    id: 3,
    name: 'Solar Cookstove for Rural Family',
    price: 500,
    description: 'Clean cooking initiative',
    icon: '☀️',
  },
];

const CarbonOffset = ({ totalEmissions }: CarbonOffsetProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedProject, setSelectedProject] = useState(offsetProjects[0]);
  
  // Calculate offset cost in INR (approximately ₹1,250 per tonne of CO2 in India)
  const offsetCost = Math.ceil((totalEmissions / 1000) * 1250);
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

        <div className="text-center py-4">
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

          {/* Offset Projects */}
          <div className="space-y-3 mb-6">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />
              Choose an offset project in India
            </p>
            <div className="grid gap-2">
              {offsetProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`w-full p-3 rounded-xl text-left transition-all duration-300 ${
                    selectedProject.id === project.id
                      ? 'bg-primary/20 border border-primary/40'
                      : 'bg-secondary/50 border border-transparent hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{project.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">
                        {project.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.description}
                      </p>
                    </div>
                    <span className="font-display font-bold text-primary">
                      {formatINR(project.price)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button className="eco-button group flex items-center justify-center gap-2 mx-auto">
            <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
            Offset Now ({formatINR(selectedProject.price)})
          </button>

          <p className="text-xs text-muted-foreground mt-4">
            Funds go to verified NGOs & reforestation projects in India 🌲
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
