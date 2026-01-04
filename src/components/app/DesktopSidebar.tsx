import { Link, useLocation } from "react-router-dom";
import { Home, Play, MapPin, User, Dog } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Home", path: "/app" },
  { icon: Play, label: "Record Walk", path: "/app/record" },
  { icon: MapPin, label: "Explore", path: "/app/explore" },
  { icon: Dog, label: "My Dogs", path: "/app/dogs" },
  { icon: User, label: "Profile", path: "/app/profile" },
];

const DesktopSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/app" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow duration-300">
            <MapPin className="w-6 h-6 text-primary-foreground" />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-secondary"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <span className="text-xl font-bold">FloofMap</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isRecordButton = item.label === "Record Walk";

          if (isRecordButton) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 my-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium shadow-lg hover:shadow-xl transition-shadow"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSidebarTab"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
                />
              )}
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default DesktopSidebar;
