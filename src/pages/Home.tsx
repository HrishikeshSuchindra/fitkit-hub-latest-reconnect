import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { PageTransition } from "@/components/PageTransition";
import { OffersCarousel } from "@/components/OffersCarousel";
import { ChevronRight, Dumbbell, Trophy, Users, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { useVenues, getVenueImageUrl } from "@/hooks/useVenues";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

type Booking = {
  id: string;
  venue_name: string;
  venue_address: string | null;
  slot_date: string;
  slot_time: string;
  sport: string | null;
  status: string;
  created_at: string;
};

type SocialEvent = {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  location: string;
  image_url: string | null;
  event_type: string;
  current_participants: number | null;
  max_participants: number | null;
  entry_fee: number | null;
};

type Tournament = {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  location: string;
  image_url: string | null;
  sport: string;
  current_participants: number | null;
  max_participants: number | null;
  entry_fee: number | null;
  prize_pool: string | null;
};

const Home = () => {
  const [activeCategory, setActiveCategory] = useState("courts");
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch social events (non-tournament types)
  const { data: socialEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["home-social-events"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("events")
        .select("id, title, event_date, start_time, location, image_url, event_type, current_participants, max_participants, entry_fee")
        .neq("event_type", "tournament")
        .neq("status", "cancelled")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(4);
      
      if (error) throw error;
      return data as SocialEvent[];
    },
  });

  // Fetch tournaments for Hub section
  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ["home-tournaments"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("events")
        .select("id, title, event_date, start_time, location, image_url, sport, current_participants, max_participants, entry_fee, prize_pool")
        .eq("event_type", "tournament")
        .neq("status", "cancelled")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(4);
      
      if (error) throw error;
      return data as Tournament[];
    },
  });
  
  // Fetch user's recent bookings
  useEffect(() => {
    const fetchRecentBookings = async () => {
      if (!user) {
        setRecentBookings([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, venue_name, venue_address, slot_date, slot_time, sport, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecentBookings(data || []);
      } catch (error) {
        console.error('Error fetching recent bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentBookings();
  }, [user]);
  
  // Nearby venues (from database)
  const venueCategory = activeCategory === "studios" ? "studio" : activeCategory;
  const { data: venues, isLoading: venuesLoading } = useVenues(venueCategory);

  const currentVenues = venues || [];

  const formatVenuePrice = (venue: any) => {
    if (venueCategory === "studio") {
      return venue.sport === "gym"
        ? `₹${venue.price_per_hour}/month`
        : `₹${venue.price_per_hour}/class`;
    }
    if (venueCategory === "recovery") {
      return `₹${venue.price_per_hour}/session`;
    }
    return `₹${venue.price_per_hour}/hr`;
  };

  // Navigate to appropriate venues page based on category
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  const handleSeeAllVenues = () => {
    switch (activeCategory) {
      case "courts":
        navigate('/venues/courts');
        break;
      case "studios":
        navigate('/venues/studio');
        break;
      case "recovery":
        navigate('/venues/recovery');
        break;
      default:
        navigate('/venues/courts');
    }
  };

  // Get activity title based on booking status
  const getActivityTitle = (booking: Booking) => {
    if (booking.status === 'completed') return "Match Completed";
    if (booking.status === 'confirmed') return "Upcoming Booking";
    if (booking.status === 'cancelled') return "Booking Cancelled";
    return "Turf Booked";
  };

  // Check if booking time has passed
  const isBookingCompleted = (booking: Booking) => {
    const now = new Date();
    const bookingDate = new Date(booking.slot_date);
    const [hours, minutes] = booking.slot_time.split(':').map(Number);
    bookingDate.setHours(hours + 1, minutes || 0, 0, 0);
    return now > bookingDate;
  };

  // Get display status
  const getDisplayStatus = (booking: Booking) => {
    if (booking.status === 'cancelled') return 'cancelled';
    if (isBookingCompleted(booking)) return 'completed';
    return booking.status;
  };

  // Format event date
  const formatEventDate = (dateStr: string) => {
    return format(new Date(dateStr), "MMM d");
  };

  // Limit to 3 recent bookings
  const displayedBookings = recentBookings.slice(0, 3);

  return (
    <>
      <PageTransition>
        <div className="min-h-screen bg-background pb-20">
          <AppHeader />
      
      <div className="px-5 py-4 space-y-6">
        {/* Search */}
        <SearchBar context="master" />
        
        {/* Special Offers - Auto-scrolling Carousel */}
        <OffersCarousel />
        
        {/* Nearby Venues */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Nearby Venues</h2>
            <button 
              onClick={handleSeeAllVenues}
              className="text-sm text-brand-green font-medium flex items-center gap-1"
            >
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Category Chips */}
          <div className="flex gap-2 mb-4">
            {["courts", "studios", "recovery"].map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  activeCategory === cat
                    ? "bg-brand-green text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {/* Venues Horizontal Scroll - Max 4 */}
          {venuesLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="min-w-[280px] h-64 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {currentVenues.length === 0 ? (
                <p className="text-text-secondary text-sm">No venues found</p>
              ) : (
                currentVenues.slice(0, 4).map((venue) => (
                  <div key={venue.id} className="min-w-[280px]">
                    <VenueCard
                      image={getVenueImageUrl(venue.image_url)}
                      name={venue.name}
                      rating={venue.rating || 0}
                      latitude={venue.latitude}
                      longitude={venue.longitude}
                      amenities={venue.amenities || []}
                      price={formatVenuePrice(venue)}
                      onBook={() => navigate(`/venue/${venue.slug}?openSlots=true`)}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </section>
        
        {/* Featured Events (Social Events) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Featured Events</h2>
            <button 
              onClick={() => navigate('/social')}
              className="text-sm text-brand-green font-medium flex items-center gap-1"
            >
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {eventsLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="min-w-[160px] aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {(socialEvents || []).slice(0, 4).map((event) => (
                <div 
                  key={event.id} 
                  className="min-w-[160px] aspect-[3/4] rounded-xl relative overflow-hidden cursor-pointer group"
                  onClick={() => navigate(`/social/event/${event.id}`)}
                >
                  <img 
                    src={event.image_url || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"} 
                    alt={event.title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-xs bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-full capitalize mb-2 inline-block">
                      {event.event_type.replace(/_/g, " ")}
                    </span>
                    <h3 className="text-sm font-semibold text-white drop-shadow-lg line-clamp-2">{event.title}</h3>
                    <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatEventDate(event.event_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Hub - Tournaments */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Hub</h2>
            </div>
            <button 
              onClick={() => navigate('/hub/games')}
              className="text-sm text-brand-green font-medium flex items-center gap-1"
            >
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {tournamentsLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="min-w-[260px] h-40 rounded-xl" />
              ))}
            </div>
          ) : (tournaments || []).length === 0 ? (
            <div className="bg-muted rounded-xl p-6 text-center">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming tournaments</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {(tournaments || []).slice(0, 4).map((tournament) => (
                <div 
                  key={tournament.id} 
                  className="min-w-[260px] bg-card rounded-xl overflow-hidden shadow-soft cursor-pointer group"
                  onClick={() => navigate(`/hub/games`)}
                >
                  <div className="h-24 relative overflow-hidden">
                    <img 
                      src={tournament.image_url || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400"} 
                      alt={tournament.title} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <h4 className="text-sm font-semibold text-white drop-shadow-lg line-clamp-1">{tournament.title}</h4>
                    </div>
                    {tournament.prize_pool && (
                      <span className="absolute top-2 right-2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">
                        {tournament.prize_pool}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatEventDate(tournament.event_date)}
                      </span>
                      <span className="capitalize bg-muted px-2 py-0.5 rounded">{tournament.sport}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs flex items-center gap-1 text-text-secondary">
                        <Users className="w-3 h-3" />
                        {tournament.current_participants || 0}/{tournament.max_participants || "∞"}
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {tournament.entry_fee ? `₹${tournament.entry_fee}` : "Free"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
            {recentBookings.length > 3 && (
              <button 
                onClick={() => navigate('/profile/bookings')}
                className="text-sm text-brand-green font-medium flex items-center gap-1"
              >
                See all <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-3">
            {!user ? (
              <div 
                className="bg-card rounded-xl shadow-soft p-4 text-center cursor-pointer"
                onClick={() => navigate('/auth')}
              >
                <p className="text-text-secondary text-sm">Sign in to see your activity</p>
              </div>
            ) : loading ? (
              <div className="bg-card rounded-xl shadow-soft p-4 text-center">
                <p className="text-text-secondary text-sm">Loading...</p>
              </div>
            ) : recentBookings.length === 0 ? (
              <div 
                className="bg-card rounded-xl shadow-soft p-4 text-center cursor-pointer"
                onClick={() => navigate('/venues/courts')}
              >
                <p className="text-text-secondary text-sm mb-2">No activity yet</p>
                <p className="text-brand-green text-sm font-medium">Book your first venue →</p>
              </div>
            ) : (
              displayedBookings.map((booking) => {
                const displayStatus = getDisplayStatus(booking);
                return (
                  <div 
                    key={booking.id} 
                    className="bg-card rounded-xl shadow-soft p-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate('/profile/bookings')}
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-foreground">{getActivityTitle({ ...booking, status: displayStatus })}</h4>
                      <p className="text-xs text-text-secondary truncate">
                        {booking.venue_name} • {format(new Date(booking.slot_date), 'MMM d')}
                      </p>
                      {booking.sport && (
                        <p className="text-xs text-primary">{booking.sport}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        displayStatus === 'confirmed' 
                          ? 'bg-primary/10 text-primary' 
                          : displayStatus === 'cancelled'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {displayStatus}
                      </span>
                      <span className="text-xs text-text-tertiary mt-1">{booking.slot_time}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
        </div>
      </PageTransition>
      <BottomNav mode="home" />
    </>
  );
};

export default Home;
