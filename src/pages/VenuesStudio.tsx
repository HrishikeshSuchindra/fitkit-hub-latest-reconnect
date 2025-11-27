import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { useState } from "react";
import studioYoga from "@/assets/studio-yoga.jpg";
import studioGym from "@/assets/studio-gym.jpg";

const VenuesStudio = () => {
  const [activeCategory, setActiveCategory] = useState("yoga");
  
  const categories = [
    { id: "yoga", label: "Yoga", count: 12 },
    { id: "gym", label: "Gym", count: 15 },
    { id: "pilates", label: "Pilates", count: 7 },
    { id: "dance", label: "Dance", count: 9 },
  ];
  
  const venues = {
    yoga: [
      {
        image: studioYoga,
        name: "Zen Yoga Studio",
        rating: 4.9,
        distance: "1.2 km",
        amenities: ["AC", "Mats Provided", "Showers"],
        price: "₹400/class"
      },
      {
        image: studioYoga,
        name: "Peace Flow Yoga",
        rating: 4.8,
        distance: "2.1 km",
        amenities: ["Heated", "Props", "Parking"],
        price: "₹350/class"
      },
      {
        image: studioYoga,
        name: "Mindful Movement Studio",
        rating: 4.7,
        distance: "2.8 km",
        amenities: ["All Levels", "AC", "Café"],
        price: "₹450/class"
      },
    ],
    gym: [
      {
        image: studioGym,
        name: "PowerFit Gym",
        rating: 4.8,
        distance: "1.5 km",
        amenities: ["Cardio", "Weights", "Trainer"],
        price: "₹1500/month"
      },
      {
        image: studioGym,
        name: "Iron Temple Fitness",
        rating: 4.9,
        distance: "2.3 km",
        amenities: ["24/7", "Sauna", "Locker"],
        price: "₹2000/month"
      },
      {
        image: studioGym,
        name: "Elite Fitness Hub",
        rating: 4.7,
        distance: "3.1 km",
        amenities: ["Classes", "Pool", "Café"],
        price: "₹2500/month"
      },
    ],
    pilates: [
      {
        image: studioYoga,
        name: "Core Pilates Studio",
        rating: 4.9,
        distance: "1.8 km",
        amenities: ["Reformer", "AC", "Small Class"],
        price: "₹600/class"
      },
      {
        image: studioYoga,
        name: "Body Balance Pilates",
        rating: 4.8,
        distance: "2.5 km",
        amenities: ["Mat", "Equipment", "Parking"],
        price: "₹550/class"
      },
    ],
    dance: [
      {
        image: studioGym,
        name: "Rhythm Dance Academy",
        rating: 4.8,
        distance: "2.2 km",
        amenities: ["AC", "Mirrors", "Sound System"],
        price: "₹500/class"
      },
      {
        image: studioGym,
        name: "Groove Studio",
        rating: 4.7,
        distance: "2.9 km",
        amenities: ["All Styles", "AC", "Locker"],
        price: "₹450/class"
      },
    ],
  };

  const currentVenues = venues[activeCategory as keyof typeof venues] || [];

  const sections = [
    { title: "Top Rated Studios", venues: currentVenues },
    { title: "Near You", venues: currentVenues },
    { title: "Beginner Friendly", venues: currentVenues.slice(0, 2) },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        <SearchBar placeholder="Search studios..." />
        
        {/* Promotional Banner */}
        <div className="bg-gradient-to-br from-chip-purple-bg via-chip-green-bg to-chip-purple-bg rounded-xl p-5 text-foreground">
          <h3 className="font-semibold text-lg mb-1">New Member Offer</h3>
          <p className="text-sm text-text-secondary mb-3">Join any studio and get 2 free trial classes</p>
          <button className="px-5 py-2 bg-brand-green text-white rounded-lg text-sm font-semibold">
            Explore Studios
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

export default VenuesStudio;
