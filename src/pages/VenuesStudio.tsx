import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVenues, useVenueCounts, getVenueImageUrl } from "@/hooks/useVenues";
import { Skeleton } from "@/components/ui/skeleton";

const VenuesStudio = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  
  // Fetch venues from database
  const { data: venues, isLoading } = useVenues("studio", activeCategory === "all" ? undefined : activeCategory);
  const { data: counts } = useVenueCounts("studio");
  
  const categories = [
    { id: "all", label: "All" },
    { id: "yoga", label: "Yoga" },
    { id: "gym", label: "Gym" },
  ];

  // Group venues for sections
  const sections = activeCategory === "all"
    ? [{ title: "Recommended for You", venues: venues || [] }]
    : [{ title: "Top Rated", venues: venues || [] }];

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
              {cat.label} ({counts?.[cat.id] || 0})
            </button>
          ))}
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-3 overflow-x-auto">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="min-w-[280px] h-64 rounded-xl" />
              ))}
            </div>
          </div>
        )}
        
        {/* Venue Sections */}
        {!isLoading && sections.map((section, idx) => (
          <section key={idx}>
            <h2 className="text-lg font-bold text-foreground mb-3">{section.title}</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {section.venues.length === 0 && (
                <p className="text-text-secondary text-sm">No venues found</p>
              )}
              {section.venues.map((venue) => (
                <div key={venue.id} className="min-w-[280px]">
                  <VenueCard 
                    image={getVenueImageUrl(venue.image_url)}
                    name={venue.name}
                    rating={venue.rating || 0}
                    distance="1.5 km"
                    amenities={venue.amenities || []}
                    price={venue.sport === "gym" ? `₹${venue.price_per_hour}/month` : `₹${venue.price_per_hour}/class`}
                    onBook={() => navigate(`/venue/${venue.slug}`)}
                  />
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
