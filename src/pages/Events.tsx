import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { EventCard } from "@/components/EventCard";
import { useState } from "react";
import eventBadminton from "@/assets/event-badminton-championship.jpg";
import eventFootball from "@/assets/event-football-league.jpg";

const Events = () => {
  const [activeTab, setActiveTab] = useState<"ongoing" | "upcoming">("ongoing");
  
  const events = [
    {
      image: eventBadminton,
      title: "City Badminton Championship 2024",
      date: "Dec 25, 2024 • 6:00 PM",
      location: "Phoenix Sports Arena, Mumbai",
      generalPrice: "300",
      vipPrice: "1500",
      participants: "vs"
    },
    {
      image: eventFootball,
      title: "Mumbai Football League Finals",
      date: "Dec 28, 2024 • 7:30 PM",
      location: "Metro Stadium, Mumbai",
      generalPrice: "500",
      vipPrice: "2000",
      participants: "vs"
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        <SearchBar placeholder="Search events..." />
        
        {/* Internal Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("ongoing")}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "ongoing"
                ? "bg-brand-green text-white"
                : "bg-transparent border border-divider text-text-secondary"
            }`}
          >
            Ongoing Events
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "upcoming"
                ? "bg-brand-green text-white"
                : "bg-transparent border border-divider text-text-secondary"
            }`}
          >
            Upcoming Events
          </button>
        </div>
        
        {/* Events List */}
        <div className="space-y-4">
          {events.map((event, idx) => (
            <EventCard key={idx} {...event} />
          ))}
        </div>
      </div>
      
      <BottomNav mode="events" />
    </div>
  );
};

export default Events;
