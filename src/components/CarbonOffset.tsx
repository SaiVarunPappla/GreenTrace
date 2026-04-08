import { TreePine, Sparkles, MapPin, Download, Sun } from 'lucide-react';
import { useState, useMemo } from 'react';
import { formatINR } from '@/lib/carbonCalculator';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface CarbonOffsetProps {
  totalEmissions: number;
}

const offsetRates = {
  tree: { name: 'Trees in Western Ghats', cost: 85, icon: '🌳', unit: 'tree', co2PerUnit: 21 },
  solar: { name: 'Solar Lamps in Rural India', cost: 350, icon: '☀️', unit: 'lamp', co2PerUnit: 50 },
  mangrove: { name: 'Mangrove Saplings - Sundarbans', cost: 150, icon: '🌿', unit: 'sapling', co2PerUnit: 35 },
  cookstove: { name: 'Solar Cookstoves', cost: 500, icon: '🍳', unit: 'stove', co2PerUnit: 200 },
};

const CarbonOffset = ({ totalEmissions }: CarbonOffsetProps) => {
  const [budget, setBudget] = useState([500]);
  const [isHovered, setIsHovered] = useState(false);
  const { user, profile } = useAuth();
  const treesEquivalent = Math.ceil(totalEmissions / 21);

  const impact = useMemo(() => {
    const b = budget[0];
    return Object.entries(offsetRates).map(([key, rate]) => ({
      key,
      ...rate,
      count: Math.floor(b / rate.cost),
      co2Offset: Math.floor(b / rate.cost) * rate.co2PerUnit,
    }));
  }, [budget]);

  const generateCertificate = () => {
    const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Employee';
    const doc = new jsPDF({ orientation: 'landscape' });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Border
    doc.setDrawColor(6, 78, 59);
    doc.setLineWidth(3);
    doc.rect(10, 10, w - 20, h - 20);
    doc.setLineWidth(1);
    doc.rect(14, 14, w - 28, h - 28);

    // Header
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 78, 59);
    doc.text('Certificate of Impact', w / 2, 45, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('GreenTrace India - Carbon Offset Program', w / 2, 55, { align: 'center' });

    // Body
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('This is to certify that', w / 2, 80, { align: 'center' });

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 78, 59);
    doc.text(displayName, w / 2, 95, { align: 'center' });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(`has pledged ${formatINR(budget[0])} towards carbon offset initiatives`, w / 2, 112, { align: 'center' });

    // Impact summary
    const bestImpact = impact.reduce((best, curr) => curr.co2Offset > best.co2Offset ? curr : best);
    doc.text(`Estimated impact: ${bestImpact.count} ${bestImpact.unit}(s) = ${bestImpact.co2Offset} kg CO2 offset`, w / 2, 125, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, w / 2, 150, { align: 'center' });
    doc.text('Verified by GreenTrace India | Funds directed to verified NGOs & reforestation projects', w / 2, 160, { align: 'center' });

    doc.save(`GreenTrace_Certificate_${displayName.replace(/\s+/g, '_')}.pdf`);
    toast.success('Certificate of Impact generated! 🌳');
  };

  return (
    <div
      className="eco-card relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
            Direct-Impact Offset
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
            Equals{' '}
            <span className="text-foreground font-medium">{treesEquivalent} trees</span>
            {' '}needed to offset for one year.
          </p>

          {/* Budget Slider */}
          <div className="mb-6 px-4">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-4">
              <MapPin className="w-4 h-4" />
              Drag to set your offset budget
            </p>
            <div className="text-3xl font-display font-bold text-primary mb-4">
              {formatINR(budget[0])}
            </div>
            <Slider
              value={budget}
              onValueChange={setBudget}
              min={100}
              max={10000}
              step={50}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>₹100</span>
              <span>₹10,000</span>
            </div>
          </div>

          {/* Impact Breakdown */}
          <div className="grid gap-2 mb-6">
            {impact.map(item => (
              <div
                key={item.key}
                className={`p-3 rounded-xl text-left transition-all duration-300 ${
                  item.count > 0
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-secondary/30 border border-transparent opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.count > 0
                        ? `${item.count} ${item.unit}(s) → offsets ${item.co2Offset} kg CO₂/yr`
                        : `Min ${formatINR(item.cost)} needed`}
                    </p>
                  </div>
                  <span className="font-display font-bold text-primary text-lg">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <button className="eco-button group flex items-center gap-2">
              <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
              Offset Now ({formatINR(budget[0])})
            </button>
            <button
              onClick={generateCertificate}
              className="px-4 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Get Certificate
            </button>
          </div>

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
