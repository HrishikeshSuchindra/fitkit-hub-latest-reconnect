import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [activeCategory, setActiveCategory] = useState("all");
  
  const categories = [
    { id: "all", label: "All", count: 7 },
    { id: "swimming", label: "Swimming", count: 1 },
    { id: "icebath", label: "Ice Bath", count: 1 },
    { id: "massage", label: "Massage", count: 1 },
    { id: "sauna", label: "Sauna", count: 1 },
    { id: "yoga", label: "Yoga", count: 1 },
    { id: "physio", label: "Physiotherapy", count: 1 },
    { id: "spa", label: "Spa", count: 1 },
  ];
  
  const offers = {
    all: { image: offerRecovery, title: "First Session Free", subtitle: "New Members Only" },
    swimming: { image: recoverySwimming, title: "Pool Pass", subtitle: "Unlimited Monthly" },
    icebath: { image: recoveryIcebath, title: "Cold Therapy", subtitle: "20% Off First Visit" },
    massage: { image: recoveryMassage, title: "Relaxation Special", subtitle: "Book 3 Get 1 Free" },
    sauna: { image: recoverySauna, title: "Heat Therapy", subtitle: "Couples Discount" },
    yoga: { image: recoveryYoga, title: "Mindfulness Week", subtitle: "7 Days Unlimited" },
    physio: { image: recoveryPhysio, title: "Recovery Plan", subtitle: "Consultation Free" },
    spa: { image: recoverySpa, title: "Wellness Package", subtitle: "25% Off" },
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
    physio: [
      { image: recoveryPhysio, name: "Elite Physiotherapy Clinic", rating: 4.9, distance: "1.8 km", amenities: ["Sports Rehab", "Manual Therapy", "Exercise"], price: "₹800/session" },
    ],
    spa: [
      { image: recoverySpa, name: "Tranquil Spa & Wellness", rating: 4.9, distance: "1.5 km", amenities: ["Full Body", "Facial", "Scrub"], price: "₹1500/session" },
    ],
  };

  const getAllVenues = () => Object.values(allVenues).flat();
  const currentOffer = offers[activeCategory as keyof typeof offers] || offers.all;
  const currentVenues = activeCategory === "all" ? getAllVenues() : allVenues[activeCategory as keyof typeof allVenues] || [];

  const allSections = [
    { title: "Recommended for You", venues: getAllVenues().slice(0, 4) },
    { title: "Trending in Your Area", venues: getAllVenues().slice(4, 7) },
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
