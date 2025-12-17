import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { useState } from "react";
import studioYoga from "@/assets/studio-yoga.jpg";
import studioGym from "@/assets/studio-gym.jpg";

const VenuesStudio = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  
  const categories = [
    { id: "all", label: "All", count: 2 },
    { id: "yoga", label: "Yoga", count: 1 },
    { id: "gym", label: "Gym", count: 1 },
  ];
  
  const venues = {
    yoga: [
      { image: studioYoga, name: "Zen Yoga Studio", rating: 4.9, distance: "1.2 km", amenities: ["AC", "Mats Provided", "Showers"], price: "₹400/class" },
    ],
    gym: [
      { image: studioGym, name: "PowerFit Gym", rating: 4.8, distance: "1.5 km", amenities: ["Cardio", "Weights", "Trainer"], price: "₹1500/month" },
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
        <SearchBar placeholder="Search studios..." context="studio" />
        
        {/* Promotional Banner */}
        <div className="bg-gradient-to-br from-chip-purple-bg via-chip-green-bg to-chip-purple-bg rounded-xl p-5 text-foreground">
          <h3 className="font-semibold text-lg mb-1">New Member Offer</h3>
          <p className="text-sm text-text-secondary mb-3">Join any studio and get 2 free trial classes</p>
          <button className="px-5 py-2 bg-brand-green text-white rounded-lg text-sm font-semibold">
            Explore Studios
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

export default VenuesStudio;