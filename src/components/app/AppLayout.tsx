import { Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/app/BottomNav";
import DesktopSidebar from "@/components/app/DesktopSidebar";
import { Loader2 } from "lucide-react";

const AppLayout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session?.user);
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar - hidden on mobile */}
      <DesktopSidebar />
      
      {/* Main content area */}
      <div className="flex-1 pb-20 lg:pb-0">
        <Outlet />
      </div>
      
      {/* Mobile bottom nav - hidden on desktop */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default AppLayout;
