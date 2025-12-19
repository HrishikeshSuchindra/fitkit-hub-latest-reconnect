import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import offerFootball from "@/assets/offer-football.jpg";
import offerBadminton from "@/assets/offer-badminton.jpg";
import offerCricket from "@/assets/offer-cricket.jpg";
import venueFootball from "@/assets/venue-football.jpg";
import venueBadminton from "@/assets/venue-badminton.jpg";
import venueCricket from "@/assets/venue-cricket.jpg";
import venuePickleball from "@/assets/venue-pickleball.jpg";
import venueBasketball from "@/assets/venue-basketball.jpg";
import venueTableTennis from "@/assets/venue-tabletennis.jpg";
import venueSquash from "@/assets/venue-squash.jpg";
import venueTennis from "@/assets/venue-tennis.jpg";

const VenuesCourts = () => {
  const navigate = useNavigate();
  const [activeSport, setActiveSport] = useState("all");
  
  const sports = [
    { id: "all", label: "All", count: 8 },
    { id: "football", label: "Football", count: 1 },
    { id: "badminton", label: "Badminton", count: 1 },
    { id: "cricket", label: "Cricket", count: 1 },
    { id: "pickleball", label: "Pickleball", count: 1 },
    { id: "basketball", label: "Basketball", count: 1 },
    { id: "tabletennis", label: "Table Tennis", count: 1 },
    { id: "squash", label: "Squash", count: 1 },
    { id: "tennis", label: "Tennis", count: 1 },
  ];
  
  const offers = {
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
  
  const allVenues = {
    football: [
      { image: venueFootball, name: "Metro Football Arena", rating: 4.7, distance: "1.8 km", amenities: ["Lighting", "Parking", "Locker"], price: "₹800/hr" },
    ],
    badminton: [
      { image: venueBadminton, name: "Phoenix Sports Arena", rating: 4.8, distance: "2.3 km", amenities: ["Lighting", "Parking", "Shower"], price: "₹300/hr" },
    ],
    cricket: [
      { image: venueCricket, name: "Stadium Cricket Nets", rating: 4.8, distance: "2.1 km", amenities: ["Nets", "Lighting", "Parking"], price: "₹600/hr" },
    ],
    pickleball: [
      { image: venuePickleball, name: "Pickleball Pro Arena", rating: 4.9, distance: "1.9 km", amenities: ["Indoor", "AC", "Equipment"], price: "₹400/hr" },
    ],
    basketball: [
      { image: venueBasketball, name: "Slam Dunk Courts", rating: 4.6, distance: "4.2 km", amenities: ["AC", "Parking", "Shower"], price: "₹400/hr" },
    ],
    tabletennis: [
      { image: venueTableTennis, name: "Spin Masters TT Club", rating: 4.8, distance: "1.7 km", amenities: ["Indoor", "AC", "Equipment"], price: "₹200/hr" },
    ],
    squash: [
      { image: venueSquash, name: "Elite Squash Center", rating: 4.9, distance: "2.4 km", amenities: ["AC", "Shower", "Equipment"], price: "₹500/hr" },
    ],
    tennis: [
      { image: venueTennis, name: "Royal Tennis Club", rating: 4.9, distance: "3.1 km", amenities: ["Coaching", "Parking", "Café"], price: "₹500/hr" },
    ],
  };

  const getAllVenues = () => Object.values(allVenues).flat();
  const currentOffer = offers[activeSport as keyof typeof offers] || offers.all;
  const currentVenues = activeSport === "all" ? getAllVenues() : allVenues[activeSport as keyof typeof allVenues] || [];

  const allSections = [
    { title: "Recommended for You", venues: getAllVenues().slice(0, 4) },
    { title: "Trending in Your Area", venues: getAllVenues().slice(4, 8) },
  ];

  const sportSections = [
    { title: "Top Rated", venues: currentVenues },
  ];

  const sections = activeSport === "all" ? allSections : sportSections;

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
              {sport.label} ({sport.count})
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

export default VenuesCourts;