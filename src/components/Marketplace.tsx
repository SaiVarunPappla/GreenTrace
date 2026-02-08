import { ExternalLink, Leaf, ShoppingBag } from 'lucide-react';
import { formatINR } from '@/lib/carbonCalculator';

const products = [
  {
    id: 1,
    name: 'Bamboo Toothbrush Set',
    description: 'Pack of 4 eco-friendly brushes',
    price: 199,
    savings: 'Saves 4 plastic brushes/year',
    emoji: '🎋',
    tag: 'Best Seller',
  },
  {
    id: 2,
    name: 'Jute Shopping Bags',
    description: 'Set of 3 reusable grocery bags',
    price: 299,
    savings: 'Replaces 500+ plastic bags',
    emoji: '👜',
    tag: 'Eco Pick',
  },
  {
    id: 3,
    name: 'Solar Power Bank',
    description: '10000mAh portable solar charger',
    price: 1500,
    savings: 'Reduces grid dependency',
    emoji: '☀️',
    tag: 'Popular',
  },
  {
    id: 4,
    name: 'Copper Water Bottle',
    description: 'Traditional & sustainable hydration',
    price: 549,
    savings: 'Saves 167 plastic bottles/year',
    emoji: '🫙',
    tag: 'Ayurvedic',
  },
  {
    id: 5,
    name: 'LED Smart Bulb Set',
    description: '4-pack WiFi-enabled, energy efficient',
    price: 899,
    savings: 'Cuts energy use by 85%',
    emoji: '💡',
    tag: 'Smart Home',
  },
  {
    id: 6,
    name: 'Organic Cotton Tote',
    description: 'Handwoven by rural artisans',
    price: 399,
    savings: 'Supports local communities',
    emoji: '🧺',
    tag: 'Handmade',
  },
];

const Marketplace = () => {
  return (
    <div className="eco-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/20">
            <ShoppingBag className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">
              Eco Marketplace
            </h3>
            <p className="text-sm text-muted-foreground">
              Sustainable products for Green India
            </p>
          </div>
        </div>
        <Leaf className="w-6 h-6 text-primary animate-float" />
      </div>

      <div className="grid gap-4">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="group relative p-4 rounded-xl bg-secondary/50 hover:bg-secondary/70 border border-transparent hover:border-primary/20 transition-all duration-300 cursor-pointer animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{product.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">
                    {product.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/20 text-primary">
                    {product.tag}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {product.description}
                </p>
                <p className="text-xs text-eco-leaf mt-2">
                  🌱 {product.savings}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-foreground">
                  {formatINR(product.price)}
                </p>
                <ExternalLink className="w-4 h-4 text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Affiliate links • Purchases support eco initiatives across India 🇮🇳
      </p>
    </div>
  );
};

export default Marketplace;
