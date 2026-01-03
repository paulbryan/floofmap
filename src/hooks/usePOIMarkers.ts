import { useCallback, useRef } from 'react';
import maplibregl from 'maplibre-gl';

export interface POI {
  id: string;
  lat: number;
  lon: number;
  type: 'dog_park' | 'water' | 'bin' | 'vet' | 'sniff' | 'barking';
  name?: string;
}

const POI_ICONS: Record<string, { emoji: string; color: string }> = {
  dog_park: { emoji: '🐕', color: 'bg-forest-500' },
  water: { emoji: '💧', color: 'bg-accent' },
  bin: { emoji: '🗑️', color: 'bg-muted' },
  vet: { emoji: '🏥', color: 'bg-red-500' },
  sniff: { emoji: '🐾', color: 'bg-primary' },
  barking: { emoji: '🔊', color: 'bg-amber-500' },
};

export const usePOIMarkers = () => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  const setMap = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
  }, []);

  const addPOI = useCallback((poi: POI) => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing marker with same ID
    if (markersRef.current.has(poi.id)) {
      markersRef.current.get(poi.id)?.remove();
    }

    const iconConfig = POI_ICONS[poi.type] || POI_ICONS.sniff;
    
    const el = document.createElement('div');
    el.className = 'poi-marker cursor-pointer transition-transform hover:scale-110';
    el.innerHTML = `
      <div class="w-8 h-8 rounded-full ${iconConfig.color} border-2 border-white shadow-lg flex items-center justify-center text-sm">
        ${iconConfig.emoji}
      </div>
    `;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([poi.lon, poi.lat]);

    if (poi.name) {
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div class="px-2 py-1">
          <div class="font-semibold text-sm">${poi.name}</div>
          <div class="text-xs text-muted-foreground capitalize">${poi.type.replace('_', ' ')}</div>
        </div>
      `);
      marker.setPopup(popup);
    }

    marker.addTo(map);
    markersRef.current.set(poi.id, marker);
  }, []);

  const addPOIs = useCallback((pois: POI[]) => {
    pois.forEach(addPOI);
  }, [addPOI]);

  const removePOI = useCallback((id: string) => {
    const marker = markersRef.current.get(id);
    if (marker) {
      marker.remove();
      markersRef.current.delete(id);
    }
  }, []);

  const clearPOIs = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
  }, []);

  const filterByType = useCallback((types: string[]) => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      const poiType = id.split('-')[0]; // Assuming ID format: "type-uniqueId"
      el.style.display = types.includes(poiType) || types.includes('all') ? 'block' : 'none';
    });
  }, []);

  return {
    setMap,
    addPOI,
    addPOIs,
    removePOI,
    clearPOIs,
    filterByType,
  };
};

export default usePOIMarkers;
