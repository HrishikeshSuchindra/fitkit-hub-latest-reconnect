import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { useState } from "react";
import recoverySpa from "@/assets/recovery-spa.jpg";
import recoveryPhysio from "@/assets/recovery-physio.jpg";

const VenuesRecovery = () => {
  const [activeCategory, setActiveCategory] = useState("spa");
  
  const categories = [
    { id: "spa", label: "Spa & Massage", count: 8 },
    { id: "physio", label: "Physiotherapy", count: 6 },
    { id: "wellness", label: "Wellness", count: 5 },
  ];
  
  const venues = {
    spa: [
      {
        image: recoverySpa,
        name: "Serenity Spa & Wellness",
        rating: 4.9,
        distance: "1.5 km",
        amenities: ["Deep Tissue", "Hot Stone", "Aromatherapy"],
        price: "₹1200/hr"
      },
      {
        image: recoverySpa,
        name: "Tranquil Touch Spa",
        rating: 4.8,
        distance: "2.3 km",
        amenities: ["Swedish", "Reflexology", "Sauna"],
        price: "₹1000/hr"
      },
      {
        image: recoverySpa,
        name: "Bliss Recovery Center",
        rating: 4.7,
        distance: "3.1 km",
        amenities: ["Sports Massage", "Steam Room", "Jacuzzi"],
        price: "₹1500/hr"
      },
    ],
    physio: [
      {
        image: recoveryPhysio,
        name: "Elite Physiotherapy Clinic",
        rating: 4.9,
        distance: "1.8 km",
        amenities: ["Sports Rehab", "Manual Therapy", "Exercise"],
        price: "₹800/session"
      },
      {
        image: recoveryPhysio,
        name: "Recovery Pro Center",
        rating: 4.8,
        distance: "2.6 km",
        amenities: ["Electrotherapy", "Ultrasound", "Taping"],
        price: "₹700/session"
      },
      {
        image: recoveryPhysio,
        name: "ActiveLife Physio",
        rating: 4.7,
        distance: "3.4 km",
        amenities: ["Injury Rehab", "Dry Needling", "Massage"],
        price: "₹900/session"
      },
    ],
    wellness: [
      {
        image: recoverySpa,
        name: "Holistic Wellness Hub",
        rating: 4.8,
        distance: "2.1 km",
        amenities: ["Yoga", "Meditation", "Nutrition"],
        price: "₹600/session"
      },
      {
        image: recoverySpa,
        name: "Zen Wellness Center",
        rating: 4.7,
        distance: "2.9 km",
        amenities: ["Acupuncture", "Cupping", "Herbal"],
        price: "₹750/session"
      },
    ],
  };

  const currentVenues = venues[activeCategory as keyof typeof venues] || [];

  const sections = [
    { title: "Recommended for Recovery", venues: currentVenues },
    { title: "Popular in Your Area", venues: currentVenues },
    { title: "Highly Rated", venues: currentVenues.slice(0, 2) },
  ];

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
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
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
