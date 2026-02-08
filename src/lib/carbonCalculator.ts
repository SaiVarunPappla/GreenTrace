// Object-Oriented Carbon Calculator with TypeScript classes
// Localized for India with industry-standard design patterns

// ============= Types =============
export type TransportVehicleType = 
  | 'petrol' | 'diesel' | 'electric' | 'hybrid' 
  | 'bus-ac' | 'bus-nonac' | 'train' | 'metro' 
  | 'two-wheeler' | 'auto-rickshaw' | 'bicycle' | 'walking';

export type MealType = 
  | 'beef' | 'mutton' | 'chicken' | 'fish' 
  | 'vegetarian' | 'vegetarian-dairy' | 'vegan';

export type UtilityType = 'electricity' | 'gas' | 'water';

export type ActivityCategory = 'transport' | 'diet' | 'utility';

// ============= Error Handling =============
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const validatePositiveNumber = (value: number, fieldName: string): number => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }
  if (value < 0) {
    throw new ValidationError(`${fieldName} cannot be negative`);
  }
  return value;
};

// Validate number within a reasonable range to prevent overflow/DoS
const validateRange = (value: number, fieldName: string, min: number, max: number): number => {
  validatePositiveNumber(value, fieldName);
  if (value > max) {
    throw new ValidationError(`${fieldName} cannot exceed ${max}`);
  }
  if (value < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`);
  }
  return value;
};

// Reasonable limits for different input types
const INPUT_LIMITS = {
  distance: { min: 0, max: 10000 },      // km - max 10,000 km per trip
  usage: { min: 0, max: 10000 },          // kWh or m³ - max 10,000 units
  servings: { min: 1, max: 100 },         // servings - max 100 per entry
} as const;

// ============= Abstract Base Class =============
export abstract class Activity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly date: Date,
    public readonly category: ActivityCategory
  ) {}

  abstract calculateImpact(): number;
  abstract getIcon(): string;
  abstract getDescription(): string;
}

// ============= Transport Activity =============
export class TransportActivity extends Activity {
  private static readonly emissionFactors: Record<TransportVehicleType, number> = {
    petrol: 0.21,
    diesel: 0.27,
    electric: 0.05,
    hybrid: 0.12,
    'bus-ac': 0.12,
    'bus-nonac': 0.089,
    train: 0.041,
    metro: 0.03,
    'two-wheeler': 0.08,
    'auto-rickshaw': 0.10,
    bicycle: 0,
    walking: 0,
  };

  private static readonly icons: Record<TransportVehicleType, string> = {
    petrol: '🚗',
    diesel: '🚙',
    electric: '⚡',
    hybrid: '🔋',
    'bus-ac': '🚌',
    'bus-nonac': '🚌',
    train: '🚆',
    metro: '🚇',
    'two-wheeler': '🛵',
    'auto-rickshaw': '🛺',
    bicycle: '🚲',
    walking: '🚶',
  };

  public readonly distance: number;
  public readonly vehicleType: TransportVehicleType;

  constructor(
    id: string,
    name: string,
    date: Date,
    distance: number,
    vehicleType: TransportVehicleType
  ) {
    super(id, name, date, 'transport');
    this.distance = validateRange(distance, 'Distance', INPUT_LIMITS.distance.min, INPUT_LIMITS.distance.max);
    this.vehicleType = vehicleType;
  }

  calculateImpact(): number {
    return this.distance * (TransportActivity.emissionFactors[this.vehicleType] ?? 0);
  }

  getIcon(): string {
    return TransportActivity.icons[this.vehicleType] ?? '🚗';
  }

  getDescription(): string {
    const labels: Record<TransportVehicleType, string> = {
      petrol: 'Petrol Car',
      diesel: 'Diesel Car',
      electric: 'Electric Car',
      hybrid: 'Hybrid Car',
      'bus-ac': 'AC Bus',
      'bus-nonac': 'Non-AC Bus',
      train: 'Train',
      metro: 'Metro',
      'two-wheeler': 'Two-Wheeler',
      'auto-rickshaw': 'Auto-Rickshaw',
      bicycle: 'Bicycle',
      walking: 'Walking',
    };
    return `${this.distance}km by ${labels[this.vehicleType]}`;
  }
}

// ============= Diet Activity =============
export class DietActivity extends Activity {
  // Emission factors in kg CO2 per serving
  private static readonly emissionFactors: Record<MealType, number> = {
    beef: 6.61,
    mutton: 5.5,
    chicken: 1.82,
    fish: 1.34,
    vegetarian: 0.86,
    'vegetarian-dairy': 1.2,
    vegan: 0.43,
  };

  private static readonly icons: Record<MealType, string> = {
    beef: '🥩',
    mutton: '🍖',
    chicken: '🍗',
    fish: '🐟',
    vegetarian: '🥗',
    'vegetarian-dairy': '🧀',
    vegan: '🥬',
  };

  public readonly mealType: MealType;
  public readonly servings: number;

  constructor(
    id: string,
    name: string,
    date: Date,
    mealType: MealType,
    servings: number
  ) {
    super(id, name, date, 'diet');
    this.mealType = mealType;
    this.servings = validateRange(servings, 'Servings', INPUT_LIMITS.servings.min, INPUT_LIMITS.servings.max);
  }

  calculateImpact(): number {
    return this.servings * (DietActivity.emissionFactors[this.mealType] ?? 0);
  }

  getIcon(): string {
    return DietActivity.icons[this.mealType] ?? '🍽️';
  }

  getDescription(): string {
    const labels: Record<MealType, string> = {
      beef: 'Beef',
      mutton: 'Mutton',
      chicken: 'Chicken',
      fish: 'Fish',
      vegetarian: 'Vegetarian',
      'vegetarian-dairy': 'Vegetarian (Dairy)',
      vegan: 'Vegan',
    };
    return `${this.servings} ${labels[this.mealType]} meal(s)`;
  }
}

// ============= Utility Activity =============
export class UtilityActivity extends Activity {
  // India-specific emission factors
  private static readonly emissionFactors: Record<UtilityType, number> = {
    electricity: 0.82, // India's carbon-heavy grid (kg CO2 per kWh)
    gas: 2.0,          // kg CO2 per m³
    water: 0.3,        // kg CO2 per m³
  };

  private static readonly icons: Record<UtilityType, string> = {
    electricity: '⚡',
    gas: '🔥',
    water: '💧',
  };

  private static readonly units: Record<UtilityType, string> = {
    electricity: 'kWh',
    gas: 'm³',
    water: 'm³',
  };

  public readonly utilityType: UtilityType;
  public readonly usage: number;

  constructor(
    id: string,
    name: string,
    date: Date,
    utilityType: UtilityType,
    usage: number
  ) {
    super(id, name, date, 'utility');
    this.utilityType = utilityType;
    this.usage = validateRange(usage, 'Usage', INPUT_LIMITS.usage.min, INPUT_LIMITS.usage.max);
  }

  calculateImpact(): number {
    return this.usage * (UtilityActivity.emissionFactors[this.utilityType] ?? 0);
  }

  getIcon(): string {
    return UtilityActivity.icons[this.utilityType] ?? '🏠';
  }

  getDescription(): string {
    return `${this.usage} ${UtilityActivity.units[this.utilityType]} of ${this.utilityType}`;
  }
}

// ============= User Class (Encapsulation) =============
export class User {
  private _greenGoal: number;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    greenGoal: number = 100
  ) {
    this._greenGoal = validatePositiveNumber(greenGoal, 'Green Goal');
  }

  get greenGoal(): number {
    return this._greenGoal;
  }

  set greenGoal(value: number) {
    this._greenGoal = validatePositiveNumber(value, 'Green Goal');
  }

  isGoalMet(currentEmissions: number): boolean {
    return currentEmissions <= this._greenGoal;
  }

  getGoalProgress(currentEmissions: number): number {
    return Math.min((currentEmissions / this._greenGoal) * 100, 100);
  }
}

// ============= Eco Coach =============
export class EcoCoach {
  private readonly tips: Record<ActivityCategory, string[]> = {
    transport: [
      "Consider carpooling or using public transport to reduce your carbon footprint! 🚌",
      "Walking or cycling for short distances can significantly cut emissions. 🚲",
      "Try using the Metro for daily commute - it's one of the greenest options! 🚇",
      "Two-wheelers are more fuel-efficient than cars for solo travel. 🛵",
      "Plan your trips efficiently to reduce unnecessary driving. 🗺️",
    ],
    diet: [
      "Try incorporating more plant-based meals into your diet! 🥗",
      "Reducing red meat consumption can significantly lower your carbon footprint. 🌱",
      "Consider meatless Mondays as a starting point for dietary changes. 🥬",
      "Locally sourced seasonal vegetables have a lower transportation carbon cost. 🏪",
      "Traditional Indian vegetarian thalis are already quite eco-friendly! 🍛",
    ],
    utility: [
      "Switch to LED bulbs and energy-efficient appliances! 💡",
      "Consider solar panels - India has excellent solar potential. ☀️",
      "Use a ceiling fan instead of AC when possible. 🌬️",
      "Reduce water heating by using solar water heaters. 🚿",
      "Unplug devices when not in use to save energy. 🔌",
    ],
  };

  getTip(highestCategory: ActivityCategory): string {
    const categoryTips = this.tips[highestCategory];
    return categoryTips[Math.floor(Math.random() * categoryTips.length)];
  }

  getHighestCategory(activities: Activity[]): ActivityCategory {
    const totals: Record<ActivityCategory, number> = { transport: 0, diet: 0, utility: 0 };
    
    activities.forEach(activity => {
      totals[activity.category] += activity.calculateImpact();
    });

    return (Object.entries(totals) as [ActivityCategory, number][])
      .reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  }
}

// ============= Activity Factory (Factory Pattern) =============
export interface TransportActivityInput {
  type: 'transport';
  distance: number;
  vehicleType: TransportVehicleType;
}

export interface DietActivityInput {
  type: 'diet';
  mealType: MealType;
  servings: number;
}

export interface UtilityActivityInput {
  type: 'utility';
  utilityType: UtilityType;
  usage: number;
}

export type ActivityInput = TransportActivityInput | DietActivityInput | UtilityActivityInput;

export class ActivityFactory {
  static create(input: ActivityInput): Activity {
    const id = generateId();
    const date = new Date();

    switch (input.type) {
      case 'transport':
        return new TransportActivity(
          id,
          `${input.vehicleType} trip`,
          date,
          input.distance,
          input.vehicleType
        );
      case 'diet':
        return new DietActivity(
          id,
          `${input.mealType} meal`,
          date,
          input.mealType,
          input.servings
        );
      case 'utility':
        return new UtilityActivity(
          id,
          `${input.utilityType} usage`,
          date,
          input.utilityType,
          input.usage
        );
      default:
        throw new ValidationError('Invalid activity type');
    }
  }
}

// ============= Data Manager (Singleton Pattern) =============
export class DataManager {
  private static instance: DataManager | null = null;
  private readonly storageKey = 'greentrace_data';

  private constructor() {}

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  private readonly MAX_ACTIVITIES = 1000;
  private readonly MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit

  saveActivities(activities: Activity[]): void {
    try {
      // Limit number of stored activities to prevent unbounded growth
      const limitedActivities = activities.slice(-this.MAX_ACTIVITIES);
      
      const data = limitedActivities.map(a => ({
        ...a,
        type: a.constructor.name,
      }));
      
      const dataStr = JSON.stringify(data);
      
      // Check size before saving
      if (dataStr.length > this.MAX_STORAGE_SIZE) {
        throw new ValidationError('Storage limit reached. Older activities will be archived.');
      }
      
      localStorage.setItem(this.storageKey, dataStr);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      // Handle QuotaExceededError specifically
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new ValidationError('Storage quota exceeded. Please clear some old activities.');
      }
      // Generic error - don't expose details in production
      if (import.meta.env.DEV) {
        console.error('Failed to save activities:', error);
      }
      throw new ValidationError('Failed to save activities. Please try again.');
    }
  }

  loadActivities(): Activity[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => {
        try {
          switch (item.type) {
            case 'TransportActivity':
              return new TransportActivity(
                item.id,
                item.name,
                new Date(item.date),
                item.distance,
                item.vehicleType
              );
            case 'DietActivity':
              return new DietActivity(
                item.id,
                item.name,
                new Date(item.date),
                item.mealType,
                item.servings
              );
            case 'UtilityActivity':
              return new UtilityActivity(
                item.id,
                item.name,
                new Date(item.date),
                item.utilityType,
                item.usage
              );
            default:
              return null;
          }
        } catch {
          // Skip invalid entries silently
          return null;
        }
      }).filter(Boolean) as Activity[];
    } catch (error) {
      // Don't expose internal details in production
      if (import.meta.env.DEV) {
        console.error('Failed to load activities:', error);
      }
      return [];
    }
  }

  clearActivities(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      // Don't expose internal details in production
      if (import.meta.env.DEV) {
        console.error('Failed to clear activities:', error);
      }
    }
  }
}

// ============= Utility Functions =============
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Currency formatter for INR
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
