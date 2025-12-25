import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Droplets, Snowflake, Sparkles, Flame, Heart } from "lucide-react";
import { useVenues, getVenueImageUrl } from "@/hooks/useVenues";
import { Skeleton } from "@/components/ui/skeleton";
import offerRecovery from "@/assets/offer-recovery.jpg";
import recoverySwimming from "@/assets/recovery-swimming.jpg";
import recoveryIcebath from "@/assets/recovery-icebath.jpg";
import recoveryMassage from "@/assets/recovery-massage.jpg";
import recoverySauna from "@/assets/recovery-sauna.jpg";
import recoveryYoga from "@/assets/recovery-yoga.jpg";

const VenuesRecovery = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Fetch venues from database
  const { data: venues, isLoading } = useVenues("recovery", activeCategory || undefined);
  
  const activities = [
    { id: "swimming", label: "Swimming", icon: Droplets, color: "bg-blue-500" },
    { id: "icebath", label: "Ice Bath", icon: Snowflake, color: "bg-cyan-500" },
    { id: "massage", label: "Massage", icon: Sparkles, color: "bg-amber-500" },
    { id: "sauna", label: "Sauna", icon: Flame, color: "bg-orange-500" },
    { id: "yoga", label: "Yoga", icon: Heart, color: "bg-rose-400" },
  ];
  
  const offers: Record<string, { image: string; title: string; subtitle: string }> = {
    all: { image: offerRecovery, title: "First Session Free", subtitle: "New Members Only" },
    swimming: { image: recoverySwimming, title: "Pool Pass", subtitle: "Unlimited Monthly" },
    icebath: { image: recoveryIcebath, title: "Cold Therapy", subtitle: "20% Off First Visit" },
    massage: { image: recoveryMassage, title: "Relaxation Special", subtitle: "Book 3 Get 1 Free" },
    sauna: { image: recoverySauna, title: "Heat Therapy", subtitle: "Couples Discount" },
    yoga: { image: recoveryYoga, title: "Mindfulness Week", subtitle: "7 Days Unlimited" },
  };

  const currentOffer = activeCategory ? offers[activeCategory] : offers.all;

  // Group venues for sections
  const recommendedVenues = venues?.slice(0, 3) || [];
  const trendingVenues = venues?.slice(2, 5) || [];

  const sections = activeCategory 
    ? [{ title: "Top Rated", venues: venues || [] }]
    : [
        { title: "Recommended for You", venues: recommendedVenues },
        { title: "Trending in Your Area", venues: trendingVenues },
      ];

  const recoverySuggestions = [
    "Swimming pools near me",
    "Ice bath therapy",
    "Massage centers",
    "Sauna & steam rooms",
    "Yoga studios",
    "Physiotherapy clinics",
    "Spa & wellness",
    "Aqua therapy",
    "Cold plunge",
    "Hot stone massage",
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        <SearchBar 
          placeholder="Search recovery centers & activities..." 
          suggestions={recoverySuggestions}
          context="recovery"
        />
        
        {/* Special Offer Banner */}
        {currentOffer && (
          <div 
            className="rounded-2xl h-56 p-5 flex flex-col justify-between text-white relative overflow-hidden"
            style={{ backgroundImage: `url(${currentOffer.image})`, backgroundSize: 'cover' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-1">{currentOffer.title}</h3>
              <p className="text-base opacity-90">{currentOffer.subtitle}</p>
            </div>
            <button className="relative z-10 self-start px-6 py-2.5 bg-white text-brand-green rounded-lg font-semibold text-sm">
              Claim Offer
            </button>
          </div>
        )}
        
        {/* Activity Icons */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Activities</h2>
          <div className="flex justify-between px-2">
            {activities.map((activity) => {
              const IconComponent = activity.icon;
              const isActive = activeCategory === activity.id;
              return (
                <button
                  key={activity.id}
                  onClick={() => setActiveCategory(isActive ? null : activity.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    isActive 
                      ? `${activity.color} shadow-lg scale-105` 
                      : 'bg-muted group-hover:bg-muted/80'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${isActive ? 'text-white' : 'text-foreground'}`} />
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'text-brand-green' : 'text-text-secondary'}`}>
                    {activity.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
        
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
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
              <button className="text-sm text-brand-green font-medium">View All</button>
            </div>
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
                    price={`₹${venue.price_per_hour}/session`}
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

export default VenuesRecovery;
