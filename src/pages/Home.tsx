import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { PageTransition } from "@/components/PageTransition";
import { ChevronRight, MapPin, Calendar, Trophy, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import promoGreen from "@/assets/promo-green-bg.jpg";
import promoPurple from "@/assets/promo-purple-bg.jpg";
import venueBadminton from "@/assets/venue-badminton.jpg";
import venueTennis from "@/assets/venue-tennis.jpg";
import venueFootball from "@/assets/venue-football.jpg";
import venuePickleball from "@/assets/venue-pickleball.jpg";
import venueBasketball from "@/assets/venue-basketball.jpg";
import venueTableTennis from "@/assets/venue-tabletennis.jpg";
import venueSquash from "@/assets/venue-squash.jpg";
import venueCricket from "@/assets/venue-cricket.jpg";
import studioYoga from "@/assets/studio-yoga.jpg";
import studioGym from "@/assets/studio-gym.jpg";
import recoverySpa from "@/assets/recovery-spa.jpg";
import recoveryMassage from "@/assets/recovery-massage.jpg";
import recoverySwimming from "@/assets/recovery-swimming.jpg";
import eventBadminton from "@/assets/event-badminton-championship.jpg";
import eventFootball from "@/assets/event-football-league.jpg";

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

const Home = () => {
  const [activeCategory, setActiveCategory] = useState("courts");
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  
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

  const featuredEvents = [
    { id: 1, image: eventBadminton, title: "Badminton Championship", date: "Dec 28, 2024" },
    { id: 2, image: eventFootball, title: "Football League Finals", date: "Dec 30, 2024" },
  ];
  
  // Venue data organized by category
  const venuesByCategory = {
    courts: [
      { image: venueBadminton, name: "Phoenix Sports Arena", rating: 4.8, distance: "2.3 km", amenities: ["Lighting", "Parking", "Shower"], price: "₹300/hr", id: "badminton-1" },
      { image: venueTennis, name: "Royal Tennis Club", rating: 4.9, distance: "3.1 km", amenities: ["Coaching", "Parking", "Café"], price: "₹500/hr", id: "tennis-1" },
      { image: venueFootball, name: "Metro Football Arena", rating: 4.7, distance: "1.8 km", amenities: ["Lighting", "Parking", "Locker"], price: "₹800/hr", id: "football-1" },
      { image: venuePickleball, name: "Pickleball Pro Arena", rating: 4.9, distance: "1.9 km", amenities: ["Indoor", "AC", "Equipment"], price: "₹400/hr", id: "pickleball-1" },
      { image: venueBasketball, name: "Slam Dunk Courts", rating: 4.6, distance: "4.2 km", amenities: ["AC", "Parking", "Shower"], price: "₹400/hr", id: "basketball-1" },
      { image: venueTableTennis, name: "Spin Masters TT Club", rating: 4.8, distance: "1.7 km", amenities: ["Indoor", "AC", "Equipment"], price: "₹200/hr", id: "tabletennis-1" },
      { image: venueSquash, name: "Elite Squash Center", rating: 4.9, distance: "2.4 km", amenities: ["AC", "Shower", "Equipment"], price: "₹500/hr", id: "squash-1" },
      { image: venueCricket, name: "Stadium Cricket Nets", rating: 4.8, distance: "2.1 km", amenities: ["Nets", "Lighting", "Parking"], price: "₹600/hr", id: "cricket-1" },
    ],
    studios: [
      { image: studioYoga, name: "Zen Yoga Studio", rating: 4.9, distance: "1.2 km", amenities: ["AC", "Mats Provided", "Showers"], price: "₹400/class", id: "yoga-1" },
      { image: studioGym, name: "PowerFit Gym", rating: 4.8, distance: "1.5 km", amenities: ["Cardio", "Weights", "Trainer"], price: "₹1500/month", id: "gym-1" },
    ],
    recovery: [
      { image: recoverySpa, name: "Serenity Spa & Wellness", rating: 4.9, distance: "1.8 km", amenities: ["Spa", "Massage", "Steam"], price: "₹1200/session", id: "spa-1" },
      { image: recoveryMassage, name: "Serenity Massage Studio", rating: 4.9, distance: "1.8 km", amenities: ["Deep Tissue", "Hot Stone", "Aromatherapy"], price: "₹1200/hr", id: "massage-1" },
      { image: recoverySwimming, name: "Aqua Wellness Pool", rating: 4.8, distance: "2.0 km", amenities: ["Heated Pool", "Lap Lanes", "Aqua Therapy"], price: "₹500/session", id: "swimming-1" },
    ],
  };

  const currentVenues = venuesByCategory[activeCategory as keyof typeof venuesByCategory] || venuesByCategory.courts;

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

  // Get activity icon based on booking status/type
  const getActivityIcon = (booking: Booking) => {
    if (booking.status === 'completed') {
      return <Trophy className="w-5 h-5 text-brand-green" />;
    }
    if (booking.status === 'confirmed') {
      return <Calendar className="w-5 h-5 text-brand-green" />;
    }
    return <MapPin className="w-5 h-5 text-brand-green" />;
  };

  // Get activity title based on booking status
  const getActivityTitle = (booking: Booking) => {
    if (booking.status === 'completed') return "Match Completed";
    if (booking.status === 'confirmed') return "Upcoming Booking";
    if (booking.status === 'cancelled') return "Booking Cancelled";
    return "Turf Booked";
  };

  return (
    <>
      <PageTransition>
        <div className="min-h-screen bg-background pb-20">
          <AppHeader />
      
      <div className="px-5 py-4 space-y-6">
        {/* Search */}
        <SearchBar context="master" />
        
        {/* Special Offers */}
        <section>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {/* Green Promo */}
            <div 
              className="min-w-[85%] h-56 rounded-2xl p-5 flex flex-col justify-between text-white relative overflow-hidden cursor-pointer"
              style={{ backgroundImage: `url(${promoGreen})`, backgroundSize: 'cover' }}
              onClick={() => navigate('/venues/courts')}
            >
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-1">20% OFF</h3>
                <p className="text-sm opacity-90">First booking discount</p>
              </div>
              <button className="relative z-10 self-start px-5 py-2 bg-white text-brand-green rounded-lg font-semibold text-sm">
                Claim Now
              </button>
            </div>
            
            {/* Purple Promo */}
            <div 
              className="min-w-[85%] h-56 rounded-2xl p-5 flex flex-col justify-between text-white relative overflow-hidden cursor-pointer"
              style={{ backgroundImage: `url(${promoPurple})`, backgroundSize: 'cover' }}
              onClick={() => navigate('/venues/recovery')}
            >
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-1">Premium Access</h3>
                <p className="text-sm opacity-90">Unlock all venues</p>
              </div>
              <button className="relative z-10 self-start px-5 py-2 bg-white text-chip-purple-text rounded-lg font-semibold text-sm">
                Book Now
              </button>
            </div>
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            <div className="w-2 h-2 rounded-full bg-brand-green"></div>
            <div className="w-2 h-2 rounded-full bg-divider"></div>
          </div>
        </section>
        
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
                    : "bg-muted text-text-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {/* Venues Horizontal Scroll */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {currentVenues.map((venue, idx) => (
              <div key={venue.id} className="min-w-[280px]">
                <VenueCard 
                  {...venue} 
                  onBook={() => navigate(`/venue/${venue.id}?name=${encodeURIComponent(venue.name)}&openSlots=true`)}
                />
              </div>
            ))}
          </div>
        </section>
        
        {/* Featured Events */}
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
          
          <div className="grid grid-cols-2 gap-3">
            {featuredEvents.map((event) => (
              <div 
                key={event.id} 
                className="aspect-[3/4] rounded-xl relative overflow-hidden cursor-pointer"
                onClick={() => navigate('/social')}
              >
                <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-sm font-semibold text-white drop-shadow-lg">{event.title}</h3>
                  <p className="text-xs text-white/80">{event.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Recent Activity */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Recent Activity</h2>
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
              recentBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="bg-card rounded-xl shadow-soft p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate('/social/profile')}
                >
                  <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center">
                    {getActivityIcon(booking)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground">{getActivityTitle(booking)}</h4>
                    <p className="text-xs text-text-secondary truncate">
                      {booking.venue_name} • {format(new Date(booking.slot_date), 'MMM d')}
                    </p>
                    {booking.sport && (
                      <p className="text-xs text-brand-green">{booking.sport}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.status}
                    </span>
                    <span className="text-xs text-text-tertiary mt-1">{booking.slot_time}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                </div>
              ))
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