import { useState } from 'react';
import { Car, Utensils, Zap, Plus } from 'lucide-react';
import { 
  Activity, 
  ActivityFactory,
  TransportVehicleType,
  MealType,
  UtilityType,
  ValidationError,
} from '@/lib/carbonCalculator';
import { toast } from 'sonner';

interface ActivityLoggerProps {
  onAddActivity: (activity: Activity) => void;
}

type ActivityType = 'transport' | 'diet' | 'utility';

const ActivityLogger = ({ onAddActivity }: ActivityLoggerProps) => {
  const [activeTab, setActiveTab] = useState<ActivityType>('transport');
  const [isOpen, setIsOpen] = useState(false);

  // Transport state
  const [distance, setDistance] = useState('');
  const [vehicleType, setVehicleType] = useState<TransportVehicleType>('two-wheeler');

  // Diet state
  const [mealType, setMealType] = useState<MealType>('vegetarian');
  const [servings, setServings] = useState('1');

  // Utility state
  const [utilityType, setUtilityType] = useState<UtilityType>('electricity');
  const [usage, setUsage] = useState('');

  const handleSubmit = () => {
    try {
      let activity: Activity;

      switch (activeTab) {
        case 'transport':
          if (!distance) {
            toast.error('Please enter distance');
            return;
          }
          activity = ActivityFactory.create({
            type: 'transport',
            distance: parseFloat(distance),
            vehicleType,
          });
          setDistance('');
          break;
        case 'diet':
          activity = ActivityFactory.create({
            type: 'diet',
            mealType,
            servings: parseInt(servings) || 1,
          });
          setServings('1');
          break;
        case 'utility':
          if (!usage) {
            toast.error('Please enter usage amount');
            return;
          }
          activity = ActivityFactory.create({
            type: 'utility',
            utilityType,
            usage: parseFloat(usage),
          });
          setUsage('');
          break;
        default:
          return;
      }

      onAddActivity(activity);
      setIsOpen(false);
      toast.success('Activity logged successfully! 🌱');
    } catch (error) {
      if (error instanceof ValidationError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to log activity. Please try again.');
      }
    }
  };

  const tabs = [
    { id: 'transport', label: 'Transport', icon: Car },
    { id: 'diet', label: 'Diet', icon: Utensils },
    { id: 'utility', label: 'Utility', icon: Zap },
  ] as const;

  const vehicleOptions: { value: TransportVehicleType; label: string }[] = [
    { value: 'two-wheeler', label: '🛵 Two-Wheeler/Scooter' },
    { value: 'auto-rickshaw', label: '🛺 Auto-Rickshaw' },
    { value: 'metro', label: '🚇 Metro Train' },
    { value: 'bus-nonac', label: '🚌 Bus (Non-AC)' },
    { value: 'bus-ac', label: '🚌 Bus (AC)' },
    { value: 'train', label: '🚆 Train' },
    { value: 'petrol', label: '🚗 Petrol Car' },
    { value: 'diesel', label: '🚙 Diesel Car' },
    { value: 'electric', label: '⚡ Electric Car' },
    { value: 'hybrid', label: '🔋 Hybrid Car' },
    { value: 'bicycle', label: '🚲 Bicycle' },
    { value: 'walking', label: '🚶 Walking' },
  ];

  const mealOptions: { value: MealType; label: string }[] = [
    { value: 'vegetarian', label: '🥗 Vegetarian' },
    { value: 'vegetarian-dairy', label: '🧀 Vegetarian (Dairy-heavy)' },
    { value: 'vegan', label: '🥬 Vegan' },
    { value: 'chicken', label: '🍗 Chicken' },
    { value: 'mutton', label: '🍖 Mutton' },
    { value: 'fish', label: '🐟 Fish' },
    { value: 'beef', label: '🥩 Beef' },
  ];

  const utilityOptions: { value: UtilityType; label: string }[] = [
    { value: 'electricity', label: '⚡ Electricity' },
    { value: 'gas', label: '🔥 Gas (LPG/PNG)' },
    { value: 'water', label: '💧 Water' },
  ];

  return (
    <div className="eco-card animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground">
          Log Activity
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="eco-button flex items-center gap-2 text-sm py-2"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>

      {isOpen && (
        <div className="animate-scale-in">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Transport Form */}
          {activeTab === 'transport' && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as TransportVehicleType)}
                  className="eco-input"
                >
                  {vehicleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Distance (km)
                </label>
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="e.g., 20"
                  min="0"
                  className="eco-input"
                />
              </div>
            </div>
          )}

          {/* Diet Form */}
          {activeTab === 'diet' && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Meal Type
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                  className="eco-input"
                >
                  {mealOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Number of Servings
                </label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="1"
                  min="1"
                  className="eco-input"
                />
              </div>
            </div>
          )}

          {/* Utility Form */}
          {activeTab === 'utility' && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Utility Type
                </label>
                <select
                  value={utilityType}
                  onChange={(e) => setUtilityType(e.target.value as UtilityType)}
                  className="eco-input"
                >
                  {utilityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Usage ({utilityType === 'electricity' ? 'kWh' : 'm³'})
                </label>
                <input
                  type="number"
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  placeholder="e.g., 50"
                  min="0"
                  className="eco-input"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="eco-button w-full mt-6 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Log Activity
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLogger;
