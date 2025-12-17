import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { SocialEventCard } from "@/components/SocialEventCard";
import { PageTransition } from "@/components/PageTransition";
import { useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";

const Social = () => {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("fitdates");

  const eventCategories = [
    {
      id: "fitdates",
      title: "FitDates",
      description: "Meet fitness enthusiasts on fun workout dates",
      events: [
        {
          id: "1",
          title: "Sunset Yoga & Coffee",
          date: "Dec 20, 2024",
          time: "5:00 PM",
          location: "Bandstand Promenade, Bandra",
          spots: "8/12",
          price: "₹299",
          image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
          host: "FitKits Official"
        },
        {
          id: "2",
          title: "Beach Run & Brunch",
          date: "Dec 22, 2024",
          time: "6:30 AM",
          location: "Juhu Beach, Mumbai",
          spots: "15/20",
          price: "₹499",
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          host: "FitKits Official"
        }
      ]
    },
    {
      id: "coffee",
      title: "Coffee Raves",
      description: "Energetic morning coffee meetups with music",
      events: [
        {
          id: "3",
          title: "Morning Brew & Beats",
          date: "Dec 21, 2024",
          time: "7:00 AM",
          location: "Third Wave Coffee, Koramangala",
          spots: "20/30",
          price: "₹199",
          image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
          host: "Brew Collective"
        },
        {
          id: "4",
          title: "Espresso Exploration",
          date: "Dec 23, 2024",
          time: "8:00 AM",
          location: "Blue Tokai, Lower Parel",
          spots: "10/15",
          price: "₹349",
          image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
          host: "Coffee Enthusiasts Club"
        }
      ]
    },
    {
      id: "wellness",
      title: "Wellness Retreats",
      description: "Mini wellness experiences for mind & body",
      events: [
        {
          id: "5",
          title: "Sound Bath Meditation",
          date: "Dec 24, 2024",
          time: "6:00 PM",
          location: "Yogasala Studio, Andheri",
          spots: "5/10",
          price: "₹599",
          image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400",
          host: "Zen Wellness"
        }
      ]
    },
    {
      id: "social",
      title: "Social Sports",
      description: "Casual games & sports for fun, not competition",
      events: [
        {
          id: "6",
          title: "Frisbee in the Park",
          date: "Dec 25, 2024",
          time: "4:00 PM",
          location: "Oval Maidan, Mumbai",
          spots: "18/24",
          price: "Free",
          image: "https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?w=400",
          host: "Mumbai Frisbee Club"
        }
      ]
    }
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <>
      <PageTransition>
        <div className="min-h-screen bg-background pb-20">
          <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar placeholder="Search events..." />
          </div>
          <button className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
            <Filter className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-brand-green/20 to-brand-green/5 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-foreground mb-1">Fun Events & Experiences</h2>
          <p className="text-sm text-text-secondary mb-3">Join relaxed social activities curated for you</p>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === "upcoming"
                  ? "bg-brand-green text-white"
                  : "bg-white/80 text-text-secondary"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === "past"
                  ? "bg-brand-green text-white"
                  : "bg-white/80 text-text-secondary"
              }`}
            >
              Past Events
            </button>
          </div>
        </div>
        
        {/* Event Categories */}
        <div className="space-y-3">
          {eventCategories.map((category) => (
            <div key={category.id} className="bg-card rounded-xl shadow-soft overflow-hidden">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="text-left">
                  <h3 className="font-bold text-foreground">{category.title}</h3>
                  <p className="text-xs text-text-secondary">{category.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-brand-soft text-brand-green px-2 py-1 rounded-full font-medium">
                    {category.events.length} events
                  </span>
                  {expandedCategory === category.id ? (
                    <ChevronUp className="w-5 h-5 text-text-secondary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-secondary" />
                  )}
                </div>
              </button>
              
              {expandedCategory === category.id && (
                <div className="px-4 pb-4 space-y-3">
                  {category.events.map((event) => (
                    <SocialEventCard key={event.id} {...event} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <BottomNav mode="social" />
        </div>
      </PageTransition>
      <BottomNav mode="social" />
    </>
  );
};

export default Social;