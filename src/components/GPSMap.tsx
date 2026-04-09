import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GPSMapProps {
  points: { lat: number; lng: number }[];
  currentCoords: { lat: number; lng: number } | null;
}

const GPSMap = ({ points, currentCoords }: GPSMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center = currentCoords || { lat: 17.385, lng: 78.4867 }; // Hyderabad default
    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Update polyline
    if (points.length > 1) {
      const latlngs: L.LatLngExpression[] = points.map((p) => [p.lat, p.lng]);
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(latlngs);
      } else {
        polylineRef.current = L.polyline(latlngs, {
          color: '#22c55e',
          weight: 3,
          opacity: 0.8,
        }).addTo(map);
      }
    }

    // Update current position marker
    if (currentCoords) {
      if (markerRef.current) {
        markerRef.current.setLatLng([currentCoords.lat, currentCoords.lng]);
      } else {
        markerRef.current = L.circleMarker([currentCoords.lat, currentCoords.lng], {
          radius: 8,
          color: '#22c55e',
          fillColor: '#22c55e',
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(map);
      }
      map.panTo([currentCoords.lat, currentCoords.lng]);
    }
  }, [points, currentCoords]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[300px] rounded-2xl overflow-hidden border border-border"
    />
  );
};

export default GPSMap;
