import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BookingReminderPopup />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;