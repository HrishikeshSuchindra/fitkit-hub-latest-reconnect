import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVenues, useVenueCounts, getVenueImageUrl } from "@/hooks/useVenues";
import { Skeleton } from "@/components/ui/skeleton";
import offerFootball from "@/assets/offer-football.jpg";
import offerBadminton from "@/assets/offer-badminton.jpg";
import offerCricket from "@/assets/offer-cricket.jpg";
import venuePickleball from "@/assets/venue-pickleball.jpg";
import venueBasketball from "@/assets/venue-basketball.jpg";
import venueTableTennis from "@/assets/venue-tabletennis.jpg";
import venueSquash from "@/assets/venue-squash.jpg";
import venueTennis from "@/assets/venue-tennis.jpg";

const VenuesCourts = () => {
  const navigate = useNavigate();
  const [activeSport, setActiveSport] = useState("all");
  
  // Fetch venues from database
  const { data: venues, isLoading } = useVenues("courts", activeSport === "all" ? undefined : activeSport);
  const { data: counts } = useVenueCounts("courts");
  
  const sports = [
    { id: "all", label: "All" },
    { id: "football", label: "Football" },
    { id: "badminton", label: "Badminton" },
    { id: "cricket", label: "Cricket" },
    { id: "pickleball", label: "Pickleball" },
    { id: "basketball", label: "Basketball" },
    { id: "tabletennis", label: "Table Tennis" },
    { id: "squash", label: "Squash" },
    { id: "tennis", label: "Tennis" },
  ];
  
  const offers: Record<string, { image: string; title: string; subtitle: string }> = {
    all: { image: offerFootball, title: "Multi-Sport Pass", subtitle: "Unlimited Access" },
    football: { image: offerFootball, title: "Book 3 Hours", subtitle: "Get 1 Free" },
    badminton: { image: offerBadminton, title: "Weekend Special", subtitle: "20% Off" },
    cricket: { image: offerCricket, title: "Early Bird", subtitle: "30% Discount" },
    pickleball: { image: venuePickleball, title: "Pickleball Starter", subtitle: "First Game Free" },
    basketball: { image: venueBasketball, title: "Slam Dunk Deal", subtitle: "25% Off Weekdays" },
    tabletennis: { image: venueTableTennis, title: "TT Marathon", subtitle: "2 Hours for 1" },
    squash: { image: venueSquash, title: "Squash Starter", subtitle: "Free Equipment" },
    tennis: { image: venueTennis, title: "Grand Slam Offer", subtitle: "15% Off Coaching" },
  };

  const currentOffer = offers[activeSport] || offers.all;

  // Group venues for sections
  const recommendedVenues = venues?.slice(0, 4) || [];
  const trendingVenues = venues?.slice(4, 8) || [];

  const sections = activeSport === "all" 
    ? [
        { title: "Recommended for You", venues: recommendedVenues },
        { title: "Trending in Your Area", venues: trendingVenues },
      ]
    : [
        { title: "Top Rated", venues: venues || [] },
      ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        <SearchBar placeholder="Search courts..." context="courts" />
        
        {/* Special Offer Banner */}
        {currentOffer && (
          <div 
            className="rounded-2xl h-56 p-5 flex flex-col justify-between text-white relative overflow-hidden"
            style={{ backgroundImage: `url(${currentOffer.image})`, backgroundSize: 'cover' }}
          >
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-1">{currentOffer.title}</h3>
              <p className="text-base opacity-90">{currentOffer.subtitle}</p>
            </div>
            <button className="relative z-10 self-start px-6 py-2.5 bg-white text-brand-green rounded-lg font-semibold text-sm">
              Claim Offer
            </button>
          </div>
        )}
        
        {/* Sport Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-2">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setActiveSport(sport.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeSport === sport.id
                  ? "bg-brand-green text-white"
                  : "bg-muted text-text-secondary"
              }`}
            >
              {sport.label} ({counts?.[sport.id] || 0})
            </button>
          ))}
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-3 overflow-x-auto">
              {[1, 2, 3].map((i) => (
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
                    distance="2.0 km"
                    amenities={venue.amenities || []}
                    price={`₹${venue.price_per_hour}/hr`}
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

export default VenuesCourts;
