import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Play, MapPin, User, Dog } from "lucide-react";
import { motion } from "framer-motion";
import { usePendingInviteCount } from "@/hooks/usePendingInviteCount";

const navItems = [
  { icon: Home, label: "Home", path: "/app" },
  { icon: Play, label: "Record", path: "/app/record" },
  { icon: Dog, label: "Dogs", path: "/app/dogs" },
  { icon: User, label: "Profile", path: "/app/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const pendingInviteCount = usePendingInviteCount();

  // Check if we're on the recording page
  useEffect(() => {
    setIsRecording(location.pathname === "/app/record");
  }, [location]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isRecordButton = item.label === "Record";
          const isDogsButton = item.label === "Dogs";

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center w-16 h-full transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isRecordButton ? (
                <div
                  className={`w-14 h-14 -mt-6 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isRecording
                      ? "bg-destructive animate-pulse"
                      : "bg-gradient-to-r from-amber-500 to-amber-600 hover:scale-105"
                  }`}
                >
                  <item.icon className="w-7 h-7 text-white" />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <item.icon className="w-6 h-6" />
                    {isDogsButton && pendingInviteCount > 0 && (
                      <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {pendingInviteCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-0 w-8 h-1 bg-primary rounded-full"
                    />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
