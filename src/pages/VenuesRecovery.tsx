import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Droplets, Snowflake, Sparkles, Flame, Heart } from "lucide-react";
import offerRecovery from "@/assets/offer-recovery.jpg";
import recoverySpa from "@/assets/recovery-spa.jpg";
import recoveryPhysio from "@/assets/recovery-physio.jpg";
import recoverySwimming from "@/assets/recovery-swimming.jpg";
import recoveryIcebath from "@/assets/recovery-icebath.jpg";
import recoveryMassage from "@/assets/recovery-massage.jpg";
import recoverySauna from "@/assets/recovery-sauna.jpg";
import recoveryYoga from "@/assets/recovery-yoga.jpg";

const VenuesRecovery = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const activities = [
    { id: "swimming", label: "Swimming", icon: Droplets, color: "bg-blue-500" },
    { id: "icebath", label: "Ice Bath", icon: Snowflake, color: "bg-cyan-500" },
    { id: "massage", label: "Massage", icon: Sparkles, color: "bg-amber-500" },
    { id: "sauna", label: "Sauna", icon: Flame, color: "bg-orange-500" },
    { id: "yoga", label: "Yoga", icon: Heart, color: "bg-rose-400" },
  ];
  
  const offers = {
    all: { image: offerRecovery, title: "First Session Free", subtitle: "New Members Only" },
    swimming: { image: recoverySwimming, title: "Pool Pass", subtitle: "Unlimited Monthly" },
    icebath: { image: recoveryIcebath, title: "Cold Therapy", subtitle: "20% Off First Visit" },
    massage: { image: recoveryMassage, title: "Relaxation Special", subtitle: "Book 3 Get 1 Free" },
    sauna: { image: recoverySauna, title: "Heat Therapy", subtitle: "Couples Discount" },
    yoga: { image: recoveryYoga, title: "Mindfulness Week", subtitle: "7 Days Unlimited" },
  };
  
  const allVenues = {
    swimming: [
      { image: recoverySwimming, name: "Aqua Wellness Pool", rating: 4.8, distance: "2.0 km", amenities: ["Heated Pool", "Lap Lanes", "Aqua Therapy"], price: "₹500/session" },
    ],
    icebath: [
      { image: recoveryIcebath, name: "Arctic Recovery Center", rating: 4.9, distance: "1.5 km", amenities: ["Cold Plunge", "Contrast Therapy", "Guided"], price: "₹800/session" },
    ],
    massage: [
      { image: recoveryMassage, name: "Serenity Massage Studio", rating: 4.9, distance: "1.8 km", amenities: ["Deep Tissue", "Hot Stone", "Aromatherapy"], price: "₹1200/hr" },
    ],
    sauna: [
      { image: recoverySauna, name: "Nordic Sauna House", rating: 4.7, distance: "2.2 km", amenities: ["Finnish Sauna", "Steam Room", "Ice Shower"], price: "₹600/session" },
    ],
    yoga: [
      { image: recoveryYoga, name: "Zen Yoga Studio", rating: 4.8, distance: "1.3 km", amenities: ["Hatha", "Vinyasa", "Meditation"], price: "₹400/session" },
    ],
  };

  const getAllVenues = () => Object.values(allVenues).flat();
  const currentOffer = activeCategory ? offers[activeCategory as keyof typeof offers] : offers.all;
  const currentVenues = activeCategory ? allVenues[activeCategory as keyof typeof allVenues] || [] : getAllVenues();

  const allSections = [
    { title: "Recommended for You", venues: getAllVenues().slice(0, 3) },
    { title: "Trending in Your Area", venues: getAllVenues().slice(2, 5) },
  ];

  const categorySections = [
    { title: "Top Rated", venues: currentVenues },
  ];

  const sections = activeCategory ? categorySections : allSections;

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
        
        {/* Venue Sections */}
        {sections.map((section, idx) => (
          <section key={idx}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
              <button className="text-sm text-brand-green font-medium">View All</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {section.venues.map((venue, venueIdx) => (
                <div key={venueIdx} className="min-w-[280px]">
                  <VenueCard 
                    {...venue} 
                    onBook={() => navigate(`/venue/${venueIdx}?name=${encodeURIComponent(venue.name)}`)}
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
