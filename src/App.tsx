import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { BookingReminderPopup } from "@/components/booking/BookingReminderPopup";
import Home from "./pages/Home";
import VenuesCourts from "./pages/VenuesCourts";
import VenuesRecovery from "./pages/VenuesRecovery";
import VenuesStudio from "./pages/VenuesStudio";
import VenueDetail from "./pages/VenueDetail";
import BookingPreview from "./pages/BookingPreview";
import BookingConfirmation from "./pages/BookingConfirmation";
import Social from "./pages/Social";
import SocialEventDetail from "./pages/SocialEventDetail";
import SocialHost from "./pages/SocialHost";
import HubGames from "./pages/HubGames";
import HubGameDetail from "./pages/HubGameDetail";
import HubChat from "./pages/HubChat";
import HubChatRoom from "./pages/HubChatRoom";
import HubCommunity from "./pages/HubCommunity";
import SocialProfile from "./pages/SocialProfile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import HelpCentre from "./pages/HelpCentre";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const RouteMemory = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/auth") return;
    sessionStorage.setItem(
      "last_non_auth_path",
      `${location.pathname}${location.search}${location.hash}`
    );
  }, [location.pathname, location.search, location.hash]);

  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Venues Routes */}
        <Route path="/venues" element={<VenuesCourts />} />
        <Route path="/venues/courts" element={<VenuesCourts />} />
        <Route path="/venues/recovery" element={<VenuesRecovery />} />
        <Route path="/venues/studio" element={<VenuesStudio />} />
        <Route path="/venue/:venueId" element={<VenueDetail />} />
        
        {/* Booking Routes */}
        <Route path="/booking/preview" element={<BookingPreview />} />
        <Route path="/booking/confirmation" element={<BookingConfirmation />} />
        
        {/* Social Routes (Fun Events) */}
        <Route path="/social" element={<Social />} />
        <Route path="/social/event/:eventId" element={<SocialEventDetail />} />
        <Route path="/social/host" element={<SocialHost />} />
        
        {/* Hub Routes (Public Games, Chat, Community) */}
        <Route path="/hub" element={<HubGames />} />
        <Route path="/hub/games" element={<HubGames />} />
        <Route path="/hub/game/:gameId" element={<HubGameDetail />} />
        <Route path="/hub/chat" element={<HubChat />} />
        <Route path="/hub/chat/:chatId" element={<HubChatRoom />} />
        <Route path="/hub/community" element={<HubCommunity />} />
        
        {/* Profile */}
        <Route path="/social/profile" element={<SocialProfile />} />
        
        {/* Support & Legal */}
        <Route path="/help" element={<HelpCentre />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        
        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteMemory />
            <AnimatedRoutes />
            <BookingReminderPopup />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;