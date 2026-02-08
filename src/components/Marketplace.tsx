import { ExternalLink, Leaf, ShoppingBag } from 'lucide-react';

const products = [
  {
    id: 1,
    name: 'Bamboo Water Bottle',
    description: 'Sustainable, reusable, and stylish',
    price: '$24.99',
    savings: 'Saves 167 plastic bottles/year',
    emoji: '🎋',
    tag: 'Best Seller',
  },
  {
    id: 2,
    name: 'Solar Power Bank',
    description: '10000mAh eco-friendly charging',
    price: '$45.99',
    savings: 'Reduces grid dependency',
    emoji: '☀️',
    tag: 'Popular',
  },
  {
    id: 3,
    name: 'Organic Cotton Tote',
    description: 'Zero-waste shopping companion',
    price: '$18.99',
    savings: 'Replaces 500+ plastic bags',
    emoji: '👜',
    tag: 'Eco Pick',
  },
  {
    id: 4,
    name: 'LED Smart Bulb Set',
    description: 'WiFi-enabled, energy efficient',
    price: '$32.99',
    savings: 'Cuts energy use by 85%',
    emoji: '💡',
    tag: 'Smart Home',
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
              Products that reduce your footprint
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
                  {product.price}
                </p>
                <ExternalLink className="w-4 h-4 text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Affiliate links • Purchases support eco initiatives
      </p>
    </div>
  );
};

export default Marketplace;
