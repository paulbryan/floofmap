import { useCallback, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface TrackPoint {
  lat: number;
  lon: number;
}

interface UseMapRouteOptions {
  routeColor?: string;
  routeWidth?: number;
  showMarkers?: boolean;
}

export const useMapRoute = (options: UseMapRouteOptions = {}) => {
  const {
    routeColor = '#F97316', // Primary orange
    routeWidth = 4,
    showMarkers = true,
  } = options;

  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const sourceIdRef = useRef(`route-${Date.now()}`);

  const setMap = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
  }, []);

  const clearRoute = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = sourceIdRef.current;
    const layerId = `${sourceId}-layer`;

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Clear markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  }, []);

  const drawRoute = useCallback(
    (points: TrackPoint[], animated = false) => {
      const map = mapRef.current;
      if (!map || points.length < 2) return;

      clearRoute();

      const sourceId = sourceIdRef.current;
      const layerId = `${sourceId}-layer`;

      const coordinates = points.map((p) => [p.lon, p.lat]);

      // Add the route source
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: animated ? [coordinates[0]] : coordinates,
          },
        },
      });

      // Add the route layer
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': routeColor,
          'line-width': routeWidth,
          'line-opacity': 0.9,
        },
      });

      // Add start/end markers
      if (showMarkers && points.length >= 2) {
        const startMarker = createMarker(points[0], 'start');
        const endMarker = createMarker(points[points.length - 1], 'end');
        startMarker.addTo(map);
        endMarker.addTo(map);
        markersRef.current.push(startMarker, endMarker);
      }

      // Fit bounds to show entire route
      const bounds = new maplibregl.LngLatBounds();
      coordinates.forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });
      map.fitBounds(bounds, { padding: 50, maxZoom: 16 });

      // Animation
      if (animated) {
        animateRoute(sourceId, coordinates);
      }
    },
    [routeColor, routeWidth, showMarkers, clearRoute]
  );

  const animateRoute = (sourceId: string, coordinates: number[][]) => {
    const map = mapRef.current;
    if (!map) return;

    let currentIndex = 1;
    const animationSpeed = 50; // ms between points

    const animate = () => {
      if (currentIndex >= coordinates.length) return;

      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates.slice(0, currentIndex + 1),
          },
        });
      }

      currentIndex++;
      setTimeout(animate, animationSpeed);
    };

    animate();
  };

  const routeCoordinatesRef = useRef<number[][]>([]);

  const addPoint = useCallback((point: TrackPoint) => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = sourceIdRef.current;
    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;

    if (source) {
      routeCoordinatesRef.current.push([point.lon, point.lat]);
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinatesRef.current,
        },
      });
    }
  }, []);

  const updateCurrentPosition = useCallback((point: TrackPoint) => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing position marker
    const existingMarker = markersRef.current.find(
      (m) => m.getElement().classList.contains('current-position')
    );
    if (existingMarker) {
      existingMarker.setLngLat([point.lon, point.lat]);
    } else {
      const marker = createMarker(point, 'current');
      marker.addTo(map);
      markersRef.current.push(marker);
    }
  }, []);

  return {
    setMap,
    drawRoute,
    clearRoute,
    addPoint,
    updateCurrentPosition,
  };
};

function createMarker(point: TrackPoint, type: 'start' | 'end' | 'current'): maplibregl.Marker {
  const el = document.createElement('div');
  el.className = `map-marker ${type === 'current' ? 'current-position' : ''}`;

  if (type === 'start') {
    el.innerHTML = `<div class="w-6 h-6 rounded-full bg-forest-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">S</div>`;
  } else if (type === 'end') {
    el.innerHTML = `<div class="w-6 h-6 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">E</div>`;
  } else {
    el.innerHTML = `<div class="w-8 h-8 rounded-full bg-primary border-3 border-white shadow-glow animate-pulse flex items-center justify-center">
      <div class="w-3 h-3 rounded-full bg-white"></div>
    </div>`;
  }

  return new maplibregl.Marker({ element: el }).setLngLat([point.lon, point.lat]);
}

export default useMapRoute;
