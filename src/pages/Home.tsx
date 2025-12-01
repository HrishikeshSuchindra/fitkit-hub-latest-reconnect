import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { ChevronRight, MapPin, Calendar, Trophy } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import promoGreen from "@/assets/promo-green-bg.jpg";
import promoPurple from "@/assets/promo-purple-bg.jpg";
import venueBadminton from "@/assets/venue-badminton.jpg";
import venueTennis from "@/assets/venue-tennis.jpg";
import venueFootball from "@/assets/venue-football.jpg";
import eventBadminton from "@/assets/event-badminton-championship.jpg";
import eventFootball from "@/assets/event-football-league.jpg";

const Home = () => {
  const [activeCategory, setActiveCategory] = useState("courts");
  const navigate = useNavigate();
  
  const featuredEvents = [
    { id: 1, image: eventBadminton, title: "Badminton Championship", date: "Dec 28, 2024" },
    { id: 2, image: eventFootball, title: "Football League Finals", date: "Dec 30, 2024" },
    { id: 3, image: eventBadminton, title: "Winter Sports Fest", date: "Jan 5, 2025" },
    { id: 4, image: eventFootball, title: "Corporate Cup 2025", date: "Jan 10, 2025" },
  ];

  const recentActivities = [
    { id: 1, icon: <MapPin className="w-5 h-5 text-brand-green" />, title: "Turf Booked", subtitle: "Phoenix Arena • Court 2" },
    { id: 2, icon: <Calendar className="w-5 h-5 text-brand-green" />, title: "Event Registered", subtitle: "Badminton Championship" },
    { id: 3, icon: <Trophy className="w-5 h-5 text-brand-green" />, title: "Match Completed", subtitle: "Metro Football Arena" },
  ];
  
  const venues = [
    {
      image: venueBadminton,
      name: "Phoenix Sports Arena",
      rating: 4.8,
      distance: "2.3 km",
      amenities: ["Lighting", "Parking", "Shower"],
      price: "₹300/hr"
    },
    {
      image: venueTennis,
      name: "Royal Tennis Club",
      rating: 4.9,
      distance: "3.1 km",
      amenities: ["Coaching", "Parking", "Café"],
      price: "₹500/hr"
    },
    {
      image: venueFootball,
      name: "Metro Football Arena",
      rating: 4.7,
      distance: "1.8 km",
      amenities: ["Lighting", "Parking", "Locker"],
      price: "₹800/hr"
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-6">
        {/* Search */}
        <SearchBar />
        
        {/* Special Offers */}
        <section>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {/* Green Promo */}
            <div 
              className="min-w-[85%] h-56 rounded-2xl p-5 flex flex-col justify-between text-white relative overflow-hidden"
              style={{ backgroundImage: `url(${promoGreen})`, backgroundSize: 'cover' }}
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
              className="min-w-[85%] h-56 rounded-2xl p-5 flex flex-col justify-between text-white relative overflow-hidden"
              style={{ backgroundImage: `url(${promoPurple})`, backgroundSize: 'cover' }}
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
              onClick={() => navigate('/venues/courts')}
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
                onClick={() => setActiveCategory(cat)}
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
            {venues.map((venue, idx) => (
              <div key={idx} className="min-w-[280px]">
                <VenueCard {...venue} />
              </div>
            ))}
          </div>
        </section>
        
        {/* Featured Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Featured Events</h2>
            <button 
              onClick={() => navigate('/events')}
              className="text-sm text-brand-green font-medium flex items-center gap-1"
            >
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {featuredEvents.map((event) => (
              <div key={event.id} className="aspect-[3/4] rounded-xl relative overflow-hidden">
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
            {recentActivities.map((activity) => (
              <div key={activity.id} className="bg-card rounded-xl shadow-soft p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-foreground">{activity.title}</h4>
                  <p className="text-xs text-text-secondary">{activity.subtitle}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              </div>
            ))}
          </div>
        </section>
      </div>
      
      <BottomNav mode="home" />
    </div>
  );
};

export default Home;
