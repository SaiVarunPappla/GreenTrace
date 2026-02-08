// Object-Oriented Carbon Calculator with TypeScript classes

// Abstract base class for activities (OOP Inheritance)
export abstract class Activity {
  constructor(
    public id: string,
    public name: string,
    public date: Date,
    public category: 'transport' | 'diet' | 'utility'
  ) {}

  // Abstract method - must be implemented by subclasses (Polymorphism)
  abstract calculateImpact(): number;
  abstract getIcon(): string;
  abstract getDescription(): string;
}

// Transport Activity subclass
export class TransportActivity extends Activity {
  constructor(
    id: string,
    name: string,
    date: Date,
    public distance: number, // in km
    public vehicleType: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'bus' | 'train' | 'bicycle' | 'walking'
  ) {
    super(id, name, date, 'transport');
  }

  // Emission factors in kg CO2 per km
  private emissionFactors: Record<string, number> = {
    petrol: 0.21,
    diesel: 0.27,
    electric: 0.05,
    hybrid: 0.12,
    bus: 0.089,
    train: 0.041,
    bicycle: 0,
    walking: 0,
  };

  calculateImpact(): number {
    return this.distance * (this.emissionFactors[this.vehicleType] || 0);
  }

  getIcon(): string {
    const icons: Record<string, string> = {
      petrol: '🚗',
      diesel: '🚙',
      electric: '⚡',
      hybrid: '🔋',
      bus: '🚌',
      train: '🚆',
      bicycle: '🚲',
      walking: '🚶',
    };
    return icons[this.vehicleType] || '🚗';
  }

  getDescription(): string {
    return `${this.distance}km by ${this.vehicleType}`;
  }
}

// Diet Activity subclass
export class DietActivity extends Activity {
  constructor(
    id: string,
    name: string,
    date: Date,
    public mealType: 'beef' | 'pork' | 'chicken' | 'fish' | 'vegetarian' | 'vegan',
    public servings: number
  ) {
    super(id, name, date, 'diet');
  }

  // Emission factors in kg CO2 per serving
  private emissionFactors: Record<string, number> = {
    beef: 6.61,
    pork: 2.4,
    chicken: 1.82,
    fish: 1.34,
    vegetarian: 0.86,
    vegan: 0.43,
  };

  calculateImpact(): number {
    return this.servings * (this.emissionFactors[this.mealType] || 0);
  }

  getIcon(): string {
    const icons: Record<string, string> = {
      beef: '🥩',
      pork: '🥓',
      chicken: '🍗',
      fish: '🐟',
      vegetarian: '🥗',
      vegan: '🥬',
    };
    return icons[this.mealType] || '🍽️';
  }

  getDescription(): string {
    return `${this.servings} ${this.mealType} meal(s)`;
  }
}

// Utility Activity subclass
export class UtilityActivity extends Activity {
  constructor(
    id: string,
    name: string,
    date: Date,
    public utilityType: 'electricity' | 'gas' | 'water',
    public usage: number // kWh for electricity, m³ for gas/water
  ) {
    super(id, name, date, 'utility');
  }

  // Emission factors
  private emissionFactors: Record<string, number> = {
    electricity: 0.4, // kg CO2 per kWh
    gas: 2.0, // kg CO2 per m³
    water: 0.3, // kg CO2 per m³
  };

  calculateImpact(): number {
    return this.usage * (this.emissionFactors[this.utilityType] || 0);
  }

  getIcon(): string {
    const icons: Record<string, string> = {
      electricity: '⚡',
      gas: '🔥',
      water: '💧',
    };
    return icons[this.utilityType] || '🏠';
  }

  getDescription(): string {
    const units: Record<string, string> = {
      electricity: 'kWh',
      gas: 'm³',
      water: 'm³',
    };
    return `${this.usage} ${units[this.utilityType]} of ${this.utilityType}`;
  }
}

// User class with encapsulation
export class User {
  private _greenGoal: number; // kg CO2 per month target

  constructor(
    public id: string,
    public name: string,
    public email: string,
    greenGoal: number = 100
  ) {
    this._greenGoal = greenGoal;
  }

  get greenGoal(): number {
    return this._greenGoal;
  }

  set greenGoal(value: number) {
    if (value > 0) {
      this._greenGoal = value;
    }
  }

  isGoalMet(currentEmissions: number): boolean {
    return currentEmissions <= this._greenGoal;
  }

  getGoalProgress(currentEmissions: number): number {
    return Math.min((currentEmissions / this._greenGoal) * 100, 100);
  }
}

// Eco Coach - provides tips based on highest emission category
export class EcoCoach {
  private tips: Record<string, string[]> = {
    transport: [
      "Consider carpooling or using public transport to reduce your carbon footprint! 🚌",
      "Walking or cycling for short distances can significantly cut emissions. 🚲",
      "If possible, switch to an electric or hybrid vehicle for your daily commute. ⚡",
      "Plan your trips efficiently to reduce unnecessary driving. 🗺️",
    ],
    diet: [
      "Try incorporating more plant-based meals into your diet! 🥗",
      "Reducing red meat consumption can significantly lower your carbon footprint. 🌱",
      "Consider meatless Mondays as a starting point for dietary changes. 🥬",
      "Locally sourced food has a lower transportation carbon cost. 🏪",
    ],
    utility: [
      "Switch to LED bulbs and energy-efficient appliances! 💡",
      "Consider solar panels or green energy providers for your home. ☀️",
      "Reduce water heating by taking shorter showers. 🚿",
      "Unplug devices when not in use to save energy. 🔌",
    ],
  };

  getTip(highestCategory: 'transport' | 'diet' | 'utility'): string {
    const categoryTips = this.tips[highestCategory];
    return categoryTips[Math.floor(Math.random() * categoryTips.length)];
  }

  getHighestCategory(activities: Activity[]): 'transport' | 'diet' | 'utility' {
    const totals = { transport: 0, diet: 0, utility: 0 };
    
    activities.forEach(activity => {
      totals[activity.category] += activity.calculateImpact();
    });

    return Object.entries(totals).reduce((a, b) => 
      b[1] > a[1] ? b : a
    )[0] as 'transport' | 'diet' | 'utility';
  }
}

// Data Manager class for CRUD operations
export class DataManager {
  private storageKey = 'greentrace_data';

  saveActivities(activities: Activity[]): void {
    const data = activities.map(a => ({
      ...a,
      type: a.constructor.name,
    }));
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  loadActivities(): Activity[] {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];
    
    try {
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => {
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
      }).filter(Boolean);
    } catch {
      return [];
    }
  }

  clearActivities(): void {
    localStorage.removeItem(this.storageKey);
  }
}

// Helper to generate unique IDs
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
