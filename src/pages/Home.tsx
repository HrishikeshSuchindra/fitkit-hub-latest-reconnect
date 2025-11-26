import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import promoGreen from "@/assets/promo-green-bg.jpg";
import promoPurple from "@/assets/promo-purple-bg.jpg";
import venueBadminton from "@/assets/venue-badminton.jpg";
import venueTennis from "@/assets/venue-tennis.jpg";
import venueFootball from "@/assets/venue-football.jpg";

const Home = () => {
  const [activeCategory, setActiveCategory] = useState("courts");
  const navigate = useNavigate();
  
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
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-muted relative overflow-hidden">
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-sm font-semibold text-white drop-shadow-lg">Event {i}</h3>
                  <p className="text-xs text-white/80">Dec 25, 2024</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Recent Activity */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl shadow-soft p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center">
                  <span className="text-brand-green font-bold">{i}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-foreground">Booking Confirmed</h4>
                  <p className="text-xs text-text-secondary">Phoenix Arena • Court 2</p>
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
