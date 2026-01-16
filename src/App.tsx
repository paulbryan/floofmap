import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Demo from "./pages/Demo";
import Pricing from "./pages/Pricing";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Health from "./pages/Health";
import NotFound from "./pages/NotFound";

// App pages
import AppLayout from "./components/app/AppLayout";
import AppHome from "./pages/app/AppHome";
import RecordWalk from "./pages/app/RecordWalk";
import Explore from "./pages/app/Explore";
import Profile from "./pages/app/Profile";
import WalkDetail from "./pages/app/WalkDetail";
import MyDogs from "./pages/app/MyDogs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/health" element={<Health />} />
          {/* Protected app routes */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<AppHome />} />
            <Route path="record" element={<RecordWalk />} />
            <Route path="explore" element={<Explore />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Profile />} />
            <Route path="walk/:walkId" element={<WalkDetail />} />
            <Route path="dogs" element={<MyDogs />} />
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
