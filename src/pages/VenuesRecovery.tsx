import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { useState } from "react";
import recoverySpa from "@/assets/recovery-spa.jpg";
import recoveryPhysio from "@/assets/recovery-physio.jpg";
import recoverySwimming from "@/assets/recovery-swimming.jpg";
import { Droplets, Snowflake, Sparkles, Flame, Heart } from "lucide-react";

const VenuesRecovery = () => {
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  
  const specialOffers = [
    {
      id: 1,
      badge: "30% OFF",
      title: "First Visit Special",
      description: "Get 30% off your first recovery session at any participating center",
      gradient: "from-emerald-500 to-teal-600",
      icon: "🎁",
    },
    {
      id: 2,
      badge: "BUY 3 GET 1",
      title: "Package Deal",
      description: "Purchase 3 sessions and get your 4th session free",
      gradient: "from-violet-500 to-purple-600",
      icon: "✨",
    },
    {
      id: 3,
      badge: "NEW",
      title: "Couples Retreat",
      description: "Book a couples spa session and save 20%",
      gradient: "from-rose-400 to-pink-500",
      icon: "💆",
    },
  ];

  const activities = [
    { id: "swimming", label: "Swimming", icon: Droplets, color: "bg-blue-500" },
    { id: "ice-bath", label: "Ice Bath", icon: Snowflake, color: "bg-cyan-500" },
    { id: "massage", label: "Massage", icon: Sparkles, color: "bg-amber-500" },
    { id: "sauna", label: "Sauna", icon: Flame, color: "bg-orange-500" },
    { id: "yoga", label: "Yoga", icon: Heart, color: "bg-rose-400" },
  ];

  const nearbyCenters = [
    { 
      image: recoverySpa, 
      name: "Zenith Recovery Spa", 
      rating: 4.8, 
      distance: "0.8 km", 
      amenities: ["Swimming", "Massage"], 
      price: "₹45/session" 
    },
    { 
      image: recoverySwimming, 
      name: "Arctic Wellness", 
      rating: 4.9, 
      distance: "1.2 km", 
      amenities: ["Ice Bath", "Sauna"], 
      price: "₹55/session" 
    },
    { 
      image: recoveryPhysio, 
      name: "Restore Physio Hub", 
      rating: 4.7, 
      distance: "1.5 km", 
      amenities: ["Sports Rehab", "Massage"], 
      price: "₹60/session" 
    },
  ];

  const topPicks = [
    { 
      image: recoverySpa, 
      name: "Serenity Massage Studio", 
      rating: 5.0, 
      distance: "2.1 km", 
      amenities: ["Massage", "Aromatherapy"], 
      price: "₹65/session",
      badge: "Top Rated"
    },
    { 
      image: recoveryPhysio, 
      name: "CryoFit Recovery", 
      rating: 4.9, 
      distance: "2.5 km", 
      amenities: ["Cryotherapy", "Ice Bath"], 
      price: "₹75/session",
      badge: "Top Rated"
    },
  ];

  const filteredNearbyCenters = activeActivity 
    ? nearbyCenters.filter(v => v.amenities.some(a => a.toLowerCase().includes(activeActivity.split('-')[0])))
    : nearbyCenters;

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-6">
        <SearchBar placeholder="Search recovery centers & activities..." />
        
        {/* Special Offers Section */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-foreground">Special Offers</h2>
            <button className="text-sm text-brand-green font-medium">View All</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
            {specialOffers.map((offer) => (
              <div 
                key={offer.id}
                className={`min-w-[200px] bg-gradient-to-br ${offer.gradient} rounded-2xl p-4 text-white flex-shrink-0`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-white/20 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded-full">
                    {offer.badge}
                  </span>
                  <span className="text-2xl">{offer.icon}</span>
                </div>
                <h3 className="font-semibold text-base mb-1">{offer.title}</h3>
                <p className="text-xs text-white/80 mb-3 line-clamp-2">{offer.description}</p>
                <button className="w-full bg-white text-gray-800 text-sm font-medium py-2 rounded-lg">
                  Claim Offer
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Activities Section */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Activities</h2>
          <div className="flex justify-between px-2">
            {activities.map((activity) => {
              const IconComponent = activity.icon;
              const isActive = activeActivity === activity.id;
              return (
                <button
                  key={activity.id}
                  onClick={() => setActiveActivity(isActive ? null : activity.id)}
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

        {/* Nearby Centers Section */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-foreground">Nearby Centers</h2>
            <button className="text-sm text-brand-green font-medium">View All</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
            {filteredNearbyCenters.map((venue, idx) => (
              <div key={idx} className="min-w-[260px] flex-shrink-0">
                <VenueCard {...venue} />
              </div>
            ))}
          </div>
        </section>

        {/* Top Picks Section */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-foreground">Top Picks For You</h2>
            <button className="text-sm text-brand-green font-medium">View All</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
            {topPicks.map((venue, idx) => (
              <div key={idx} className="min-w-[260px] flex-shrink-0">
                <VenueCard {...venue} />
              </div>
            ))}
          </div>
        </section>
      </div>
      
      <BottomNav mode="venues" />
    </div>
  );
};

export default VenuesRecovery;
