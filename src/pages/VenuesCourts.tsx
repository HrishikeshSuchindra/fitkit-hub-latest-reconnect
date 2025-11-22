import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { useState } from "react";
import venueBadminton from "@/assets/venue-badminton.jpg";
import venueTennis from "@/assets/venue-tennis.jpg";
import venueFootball from "@/assets/venue-football.jpg";
import venueBasketball from "@/assets/venue-basketball.jpg";

const VenuesCourts = () => {
  const [activeSport, setActiveSport] = useState("badminton");
  
  const sports = [
    { id: "badminton", label: "Badminton", count: 12 },
    { id: "tennis", label: "Tennis", count: 8 },
    { id: "football", label: "Football", count: 6 },
    { id: "basketball", label: "Basketball", count: 5 },
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
    {
      image: venueBasketball,
      name: "Slam Dunk Courts",
      rating: 4.6,
      distance: "4.2 km",
      amenities: ["AC", "Parking", "Shower"],
      price: "₹400/hr"
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        <SearchBar placeholder="Search courts..." />
        
        {/* Special Offers Row */}
        <div className="bg-chip-green-bg rounded-xl p-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Book 5, Get 1 Free</h3>
            <p className="text-xs text-text-secondary">Valid on all courts</p>
          </div>
          <button className="px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-semibold">
            View
          </button>
        </div>
        
        {/* Sport Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setActiveSport(sport.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeSport === sport.id
                  ? "bg-brand-green text-white"
                  : "bg-muted text-text-secondary"
              }`}
            >
              {sport.label} ({sport.count})
            </button>
          ))}
        </div>
        
        {/* Venues Grid */}
        <div className="grid grid-cols-2 gap-3">
          {venues.map((venue, idx) => (
            <VenueCard key={idx} {...venue} />
          ))}
        </div>
      </div>
      
      <BottomNav mode="venues" />
    </div>
  );
};

export default VenuesCourts;
