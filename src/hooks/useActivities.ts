import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Activity,
  TransportActivity,
  DietActivity,
  UtilityActivity,
  TransportVehicleType,
  MealType,
  UtilityType,
} from '@/lib/carbonCalculator';
import { toast } from 'sonner';

function dbRowToActivity(row: any): Activity | null {
  try {
    switch (row.category) {
      case 'transport':
        return new TransportActivity(
          row.id,
          row.name,
          new Date(row.activity_date),
          Number(row.distance),
          row.vehicle_type as TransportVehicleType
        );
      case 'diet':
        return new DietActivity(
          row.id,
          row.name,
          new Date(row.activity_date),
          row.meal_type as MealType,
          Number(row.servings)
        );
      case 'utility':
        return new UtilityActivity(
          row.id,
          row.name,
          new Date(row.activity_date),
          row.utility_type as UtilityType,
          Number(row.usage_amount)
        );
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function useActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!user) { setActivities([]); setLoading(false); return; }
    
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('activity_date', { ascending: false });

    if (error) {
      toast.error('Failed to load activities');
      console.error(error);
    } else {
      const mapped = (data || []).map(dbRowToActivity).filter(Boolean) as Activity[];
      setActivities(mapped);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const addActivity = async (activity: Activity) => {
    if (!user) return;

    const row: any = {
      user_id: user.id,
      category: activity.category,
      name: activity.name,
      activity_date: activity.date.toISOString(),
      impact: activity.calculateImpact(),
    };

    if (activity instanceof TransportActivity) {
      row.vehicle_type = activity.vehicleType;
      row.distance = activity.distance;
    } else if (activity instanceof DietActivity) {
      row.meal_type = activity.mealType;
      row.servings = activity.servings;
    } else if (activity instanceof UtilityActivity) {
      row.utility_type = activity.utilityType;
      row.usage_amount = activity.usage;
    }

    const { error } = await supabase.from('activities').insert(row);
    if (error) {
      toast.error('Failed to save activity');
      console.error(error);
    } else {
      await fetchActivities();
    }
  };

  const deleteActivity = async (id: string) => {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete activity');
    } else {
      setActivities(prev => prev.filter(a => a.id !== id));
    }
  };

  return { activities, loading, addActivity, deleteActivity };
}
