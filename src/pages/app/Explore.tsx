import { useState } from "react";
import { motion } from "framer-motion";
import { Map, MapPin, Droplets, Trash, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock data for walks
const mockWalks = [
  {
    id: "1",
    date: "Jan 3, 2026",
    distance: 2.4,
    duration: 32,
    sniffs: 12,
    route: [[51.505, -0.09], [51.51, -0.1], [51.51, -0.12]],
  },
  {
    id: "2",
    date: "Jan 2, 2026",
    distance: 1.8,
    duration: 25,
    sniffs: 8,
    route: [[51.505, -0.09], [51.508, -0.095]],
  },
  {
    id: "3",
    date: "Jan 1, 2026",
    distance: 3.1,
    duration: 45,
    sniffs: 15,
    route: [[51.505, -0.09], [51.515, -0.08], [51.52, -0.1]],
  },
];

// Mock POI data
const mockPOIs = [
  { id: "1", type: "water", name: "Dog Water Fountain", lat: 51.508, lon: -0.095 },
  { id: "2", type: "bin", name: "Waste Bin", lat: 51.51, lon: -0.1 },
  { id: "3", type: "dispenser", name: "Bag Dispenser", lat: 51.512, lon: -0.098 },
];

type POIFilter = "all" | "water" | "bin" | "dispenser" | "barking";

const Explore = () => {
  const [activeFilter, setActiveFilter] = useState<POIFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWalk, setSelectedWalk] = useState<string | null>(null);

  const filters: { key: POIFilter; icon: React.ReactNode; label: string; color: string }[] = [
    { key: "all", icon: <Map className="w-4 h-4" />, label: "All", color: "bg-muted" },
    { key: "water", icon: <Droplets className="w-4 h-4" />, label: "Water", color: "bg-accent/20" },
    { key: "bin", icon: <Trash className="w-4 h-4" />, label: "Bins", color: "bg-forest-100" },
    { key: "dispenser", icon: <span className="text-sm">🛍️</span>, label: "Bags", color: "bg-amber-100" },
    { key: "barking", icon: <span className="text-sm">🔊</span>, label: "Barking", color: "bg-destructive/10" },
  ];

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
      <div className="h-[40vh] bg-forest-50 relative">
        {/* Simplified map visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Grid lines for map effect */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Walk paths */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <path
                d="M20,80 Q35,60 40,45 T55,30 Q70,20 80,25"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity={selectedWalk === "1" ? 1 : 0.3}
              />
              <path
                d="M25,75 Q40,65 45,55"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity={selectedWalk === "2" ? 1 : 0.3}
              />
            </svg>

            {/* POI markers */}
            <motion.div
              className="absolute top-[35%] left-[40%] w-8 h-8 rounded-full bg-accent shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
              whileHover={{ scale: 1.15 }}
            >
              <Droplets className="w-4 h-4 text-accent-foreground" />
            </motion.div>
            
            <motion.div
              className="absolute top-[50%] left-[55%] w-8 h-8 rounded-full bg-forest-500 shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
              whileHover={{ scale: 1.15 }}
            >
              <Trash className="w-4 h-4 text-white" />
            </motion.div>

            {/* Sniff hotspot markers */}
            <motion.div
              className="absolute top-[45%] left-[35%] w-6 h-6 rounded-full bg-primary shadow-glow flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-xs">🐾</span>
            </motion.div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur rounded-xl shadow-card p-3">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span>Water</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-forest-500" />
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
              onClick={() => setSelectedWalk(walk.id === selectedWalk ? null : walk.id)}
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
