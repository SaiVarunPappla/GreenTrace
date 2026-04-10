import { useState, useCallback, useRef } from 'react';

interface GeoResult {
  street: string;
  area: string;
  city: string;
  display: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const THROTTLE_MS = 2000; // Nominatim usage policy: max 1 req/s

export function useReverseGeocode() {
  const [location, setLocation] = useState<GeoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const lastCallRef = useRef(0);
  const cacheRef = useRef<Map<string, GeoResult>>(new Map());

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    // Check cache
    if (cacheRef.current.has(key)) {
      setLocation(cacheRef.current.get(key)!);
      return cacheRef.current.get(key)!;
    }

    // Throttle
    const now = Date.now();
    if (now - lastCallRef.current < THROTTLE_MS) return location;
    lastCallRef.current = now;

    setLoading(true);
    try {
      const res = await fetch(
        `${NOMINATIM_URL}?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
        {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'GreenTrace-India/1.0' },
        }
      );

      if (!res.ok) return null;

      const data = await res.json();
      const addr = data.address || {};

      const street = addr.road || addr.pedestrian || addr.residential || addr.suburb || '';
      const area = addr.suburb || addr.neighbourhood || addr.city_district || '';
      const city = addr.city || addr.town || addr.state_district || addr.state || '';

      const parts = [street, area, city].filter(Boolean);
      const display = parts.length > 0 ? parts.slice(0, 2).join(', ') : `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;

      const result: GeoResult = { street, area, city, display };
      cacheRef.current.set(key, result);
      setLocation(result);
      return result;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [location]);

  return { location, loading, reverseGeocode };
}
