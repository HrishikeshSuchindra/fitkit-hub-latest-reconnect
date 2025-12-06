import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "./pages/Home";
import VenuesCourts from "./pages/VenuesCourts";
import VenuesRecovery from "./pages/VenuesRecovery";
import VenuesStudio from "./pages/VenuesStudio";
import VenueDetail from "./pages/VenueDetail";
import BookingPreview from "./pages/BookingPreview";
import BookingConfirmation from "./pages/BookingConfirmation";
import Events from "./pages/Events";
import EventsWorkshop from "./pages/EventsWorkshop";
import SocialGames from "./pages/SocialGames";
import SocialChat from "./pages/SocialChat";
import SocialProfile from "./pages/SocialProfile";
import SocialCommunity from "./pages/SocialCommunity";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
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
            
            {/* Events Routes */}
            <Route path="/events" element={<Events />} />
            <Route path="/events/workshop" element={<EventsWorkshop />} />
            
            {/* Social Routes */}
            <Route path="/social" element={<SocialGames />} />
            <Route path="/social/games" element={<SocialGames />} />
            <Route path="/social/chat" element={<SocialChat />} />
            <Route path="/social/profile" element={<SocialProfile />} />
            <Route path="/social/community" element={<SocialCommunity />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
