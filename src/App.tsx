import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { LocationProvider } from "@/contexts/LocationContext";
import { BookingReminderPopup } from "@/components/booking/BookingReminderPopup";
import { LocationPermissionPrompt } from "@/components/LocationPermissionPrompt";
import SplashScreen from "@/components/SplashScreen";
import { supabase } from "@/integrations/supabase/client";
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
import SocialChat from "./pages/SocialChat";
import SocialChatRoom from "./pages/SocialChatRoom";
import HubCommunity from "./pages/HubCommunity";
import SocialProfile from "./pages/SocialProfile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import HelpCentre from "./pages/HelpCentre";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import EditProfile from "./pages/EditProfile";
import AppSettings from "./pages/AppSettings";
import Friends from "./pages/Friends";
import MyBookings from "./pages/MyBookings";
import MyEvents from "./pages/MyEvents";
import Notifications from "./pages/Notifications";
import BookingCancellation from "./pages/BookingCancellation";
import EventRegistrationPreview from "./pages/EventRegistrationPreview";
import EventRegistrationConfirmation from "./pages/EventRegistrationConfirmation";
import HubTournamentDetail from "./pages/HubTournamentDetail";
import HubTournamentRegister from "./pages/HubTournamentRegister";
import HubTournamentConfirmation from "./pages/HubTournamentConfirmation";

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
        <Route path="/booking/cancel/:bookingId" element={<BookingCancellation />} />
        
        {/* Social Routes (Fun Events) */}
        <Route path="/social" element={<Social />} />
        <Route path="/social/event/:eventId" element={<SocialEventDetail />} />
        <Route path="/social/event/:eventId/register" element={<EventRegistrationPreview />} />
        <Route path="/social/event/:eventId/confirmation" element={<EventRegistrationConfirmation />} />
        <Route path="/social/host" element={<SocialHost />} />
        <Route path="/social/chat" element={<SocialChat />} />
        <Route path="/social/chat/:chatId" element={<SocialChatRoom />} />
        
        {/* Hub Routes (Public Games, Chat, Community, Tournaments) */}
        <Route path="/hub" element={<HubGames />} />
        <Route path="/hub/games" element={<HubGames />} />
        <Route path="/hub/game/:gameId" element={<HubGameDetail />} />
        <Route path="/hub/tournament/:tournamentId" element={<HubTournamentDetail />} />
        <Route path="/hub/tournament/:tournamentId/register" element={<HubTournamentRegister />} />
        <Route path="/hub/tournament/:tournamentId/confirmation" element={<HubTournamentConfirmation />} />
        <Route path="/hub/chat" element={<HubChat />} />
        <Route path="/hub/chat/:chatId" element={<HubChatRoom />} />
        <Route path="/hub/community" element={<HubCommunity />} />
        
        {/* Profile */}
        <Route path="/social/profile" element={<SocialProfile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/settings" element={<AppSettings />} />
        <Route path="/profile/friends" element={<Friends />} />
        <Route path="/profile/bookings" element={<MyBookings />} />
        <Route path="/profile/events" element={<MyEvents />} />
        <Route path="/notifications" element={<Notifications />} />
        
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

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const minDisplayTime = 1500; // Minimum splash display for brand impact
    const startTime = Date.now();

    supabase.auth.getSession().then(() => {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
      setTimeout(() => {
        setIsInitializing(false);
      }, remainingTime);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LocationProvider>
          <SplashScreen isLoading={isInitializing} />
          {!isInitializing && (
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <RouteMemory />
                  <AnimatedRoutes />
                  <BookingReminderPopup />
                  <LocationPermissionPrompt />
                </BrowserRouter>
              </TooltipProvider>
            </AuthProvider>
          )}
        </LocationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;