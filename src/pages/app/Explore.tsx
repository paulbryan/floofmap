import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Droplets, Trash, Search, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MapContainer from "@/components/map/MapContainer";
import { useMapRoute } from "@/hooks/useMapRoute";
import { usePOIMarkers, POI } from "@/hooks/usePOIMarkers";
import maplibregl from "maplibre-gl";

// Mock data for walks
const mockWalks = [
  {
    id: "1",
    date: "Jan 3, 2026",
    distance: 2.4,
    duration: 32,
    sniffs: 12,
    route: [
      { lat: 51.505, lon: -0.09 },
      { lat: 51.507, lon: -0.092 },
      { lat: 51.51, lon: -0.1 },
      { lat: 51.512, lon: -0.098 },
      { lat: 51.51, lon: -0.12 },
    ],
  },
  {
    id: "2",
    date: "Jan 2, 2026",
    distance: 1.8,
    duration: 25,
    sniffs: 8,
    route: [
      { lat: 51.503, lon: -0.085 },
      { lat: 51.506, lon: -0.09 },
      { lat: 51.508, lon: -0.095 },
    ],
  },
  {
    id: "3",
    date: "Jan 1, 2026",
    distance: 3.1,
    duration: 45,
    sniffs: 15,
    route: [
      { lat: 51.505, lon: -0.09 },
      { lat: 51.51, lon: -0.085 },
      { lat: 51.515, lon: -0.08 },
      { lat: 51.518, lon: -0.09 },
      { lat: 51.52, lon: -0.1 },
    ],
  },
];

// Mock POI data
const mockPOIs: POI[] = [
  { id: "water-1", type: "water", name: "Dog Water Fountain", lat: 51.508, lon: -0.095 },
  { id: "bin-1", type: "bin", name: "Waste Bin", lat: 51.51, lon: -0.1 },
  { id: "dog_park-1", type: "dog_park", name: "Hyde Park Dog Area", lat: 51.512, lon: -0.098 },
  { id: "sniff-1", type: "sniff", name: "Popular Sniff Spot", lat: 51.507, lon: -0.092 },
];

type POIFilter = "all" | "water" | "bin" | "dog_park" | "barking";

const Explore = () => {
  const [activeFilter, setActiveFilter] = useState<POIFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWalk, setSelectedWalk] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-0.09, 51.505]);

  const mapRef = useRef<maplibregl.Map | null>(null);
  const { setMap: setRouteMap, drawRoute, clearRoute } = useMapRoute();
  const { setMap: setPOIMap, addPOIs, clearPOIs } = usePOIMarkers();

  const filters: { key: POIFilter; icon: React.ReactNode; label: string; color: string }[] = [
    { key: "all", icon: <MapPin className="w-4 h-4" />, label: "All", color: "bg-muted" },
    { key: "water", icon: <Droplets className="w-4 h-4" />, label: "Water", color: "bg-accent/20" },
    { key: "bin", icon: <Trash className="w-4 h-4" />, label: "Bins", color: "bg-forest-100" },
    { key: "dog_park", icon: <span className="text-sm">🐕</span>, label: "Parks", color: "bg-amber-100" },
    { key: "barking", icon: <span className="text-sm">🔊</span>, label: "Barking", color: "bg-destructive/10" },
  ];

  const handleMapLoad = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
    setRouteMap(map);
    setPOIMap(map);
    
    // Add POIs after map loads
    setTimeout(() => {
      addPOIs(mockPOIs);
    }, 100);
  }, [setRouteMap, setPOIMap, addPOIs]);

  const handleWalkSelect = (walkId: string) => {
    if (selectedWalk === walkId) {
      setSelectedWalk(null);
      clearRoute();
    } else {
      setSelectedWalk(walkId);
      const walk = mockWalks.find(w => w.id === walkId);
      if (walk && mapRef.current) {
        drawRoute(walk.route, true);
      }
    }
  };

  const handleCenterOnLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const center: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setMapCenter(center);
          mapRef.current?.flyTo({ center, zoom: 15 });
        },
        () => {}
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 pt-12">
        <h1 className="text-2xl font-bold mb-4">Explore</h1>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search locations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                activeFilter === filter.key
                  ? "bg-primary text-primary-foreground shadow-md"
                  : `${filter.color} text-foreground hover:shadow-sm`
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map area */}
      <div className="h-[40vh] relative">
        <MapContainer
          className="h-full w-full"
          center={mapCenter}
          zoom={14}
          onMapLoad={handleMapLoad}
        />

        {/* Center on location button */}
        <Button
          onClick={handleCenterOnLocation}
          size="icon"
          variant="secondary"
          className="absolute bottom-4 right-4 z-10 shadow-lg"
        >
          <Navigation className="w-5 h-5" />
        </Button>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur rounded-xl shadow-card p-3 z-10">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span>Water</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span>Bin</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Sniff</span>
            </div>
          </div>
        </div>
      </div>

      {/* Walk history */}
      <div className="p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Walk History
        </h2>

        <div className="space-y-3">
          {mockWalks.map((walk) => (
            <motion.button
              key={walk.id}
              onClick={() => handleWalkSelect(walk.id)}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                selectedWalk === walk.id
                  ? "bg-primary/5 border-primary shadow-md"
                  : "bg-card border-border hover:shadow-card"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{walk.date}</span>
                <span className="text-primary font-semibold">{walk.sniffs} sniffs</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{walk.distance} km</span>
                <span>{walk.duration} min</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;
