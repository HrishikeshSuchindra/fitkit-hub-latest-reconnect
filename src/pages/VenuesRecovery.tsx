import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { useState } from "react";
import recoverySpa from "@/assets/recovery-spa.jpg";
import recoveryPhysio from "@/assets/recovery-physio.jpg";
import recoverySwimming from "@/assets/recovery-swimming.jpg";

const VenuesRecovery = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  
  const categories = [
    { id: "all", label: "All", count: 3 },
    { id: "spa", label: "Spa & Massage", count: 1 },
    { id: "physio", label: "Physiotherapy", count: 1 },
    { id: "swimming", label: "Swimming", count: 1 },
  ];
  
  const venues = {
    spa: [
      { image: recoverySpa, name: "Serenity Spa & Wellness", rating: 4.9, distance: "1.5 km", amenities: ["Deep Tissue", "Hot Stone", "Aromatherapy"], price: "₹1200/hr" },
    ],
    physio: [
      { image: recoveryPhysio, name: "Elite Physiotherapy Clinic", rating: 4.9, distance: "1.8 km", amenities: ["Sports Rehab", "Manual Therapy", "Exercise"], price: "₹800/session" },
    ],
    swimming: [
      { image: recoverySwimming, name: "Aqua Wellness Pool", rating: 4.8, distance: "2.0 km", amenities: ["Heated Pool", "Lap Lanes", "Aqua Therapy"], price: "₹500/session" },
    ],
  };

  const getAllVenues = () => Object.values(venues).flat();
  const currentVenues = activeCategory === "all" ? getAllVenues() : venues[activeCategory as keyof typeof venues] || [];

  const allSections = [
    { title: "Recommended for You", venues: getAllVenues() },
  ];

  const categorySections = [
    { title: "Top Rated", venues: currentVenues },
  ];

  const sections = activeCategory === "all" ? allSections : categorySections;

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        <SearchBar placeholder="Search recovery centers..." />
        
        {/* Promotional Banner */}
        <div className="bg-gradient-to-r from-chip-purple-bg to-chip-green-bg rounded-xl p-5 text-foreground">
          <h3 className="font-semibold text-lg mb-1">First Session Special</h3>
          <p className="text-sm text-text-secondary mb-3">Get 25% off your first recovery session</p>
          <button className="px-5 py-2 bg-brand-green text-white rounded-lg text-sm font-semibold">
            Book Now
          </button>
        </div>
        
        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? "bg-brand-green text-white"
                  : "bg-muted text-text-secondary"
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
        
        {/* Venue Sections */}
        {sections.map((section, idx) => (
          <section key={idx}>
            <h2 className="text-lg font-bold text-foreground mb-3">{section.title}</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {section.venues.map((venue, venueIdx) => (
                <div key={venueIdx} className="min-w-[280px]">
                  <VenueCard {...venue} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      
      <BottomNav mode="venues" />
    </div>
  );
};

export default VenuesRecovery;