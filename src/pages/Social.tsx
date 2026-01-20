import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { SocialEventCard } from "@/components/SocialEventCard";
import { PageTransition } from "@/components/PageTransition";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Filter, Loader2 } from "lucide-react";
import { useEventsWithHost, EventWithHost, Event } from "@/hooks/useEvents";
import { format, parseISO } from "date-fns";

const categoryMeta: Record<string, { title: string; description: string }> = {
  fitdates: { title: "FitDates", description: "Meet fitness enthusiasts on fun workout dates" },
  coffee: { title: "Coffee Raves", description: "Energetic morning coffee meetups with music" },
  wellness: { title: "Wellness Retreats", description: "Mini wellness experiences for mind & body" },
  social: { title: "Social Sports", description: "Casual games & sports for fun, not competition" },
};

const formatEventDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
};

const formatEventTime = (timeStr: string) => {
  try {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return timeStr;
  }
};

const formatPrice = (entryFee: number) => {
  if (entryFee === 0) return "Free";
  return `₹${entryFee}`;
};

const formatSpots = (current: number, max: number | null) => {
  if (!max) return `${current} joined`;
  return `${current}/${max}`;
};

const Social = () => {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("fitdates");
  const { data: events, isLoading } = useEventsWithHost(activeTab);

  // Group events by event_type
  const eventCategories = useMemo(() => {
    if (!events || events.length === 0) return [];

    const grouped: Record<string, (EventWithHost | Event)[]> = {};
    
    events.forEach((event) => {
      const category = event.event_type || "other";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(event);
    });

    // Convert to array with metadata
    return Object.entries(grouped).map(([categoryId, categoryEvents]) => ({
      id: categoryId,
      title: categoryMeta[categoryId]?.title || categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
      description: categoryMeta[categoryId]?.description || `Events in ${categoryId} category`,
      events: categoryEvents,
    }));
  }, [events]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const getHostName = (event: EventWithHost | Event): string => {
    if ("profiles" in event && event.profiles) {
      return event.profiles.display_name || event.profiles.username || "Anonymous Host";
    }
    return "FitKits Official";
  };

  return (
    <>
      <PageTransition>
        <div className="min-h-screen bg-background pb-20">
          <AppHeader />
      
          <div className="px-5 py-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <SearchBar placeholder="Search events..." context="social" />
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
                      : "bg-white/80 text-foreground"
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setActiveTab("past")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    activeTab === "past"
                      ? "bg-brand-green text-white"
                      : "bg-white/80 text-foreground"
                  }`}
                >
                  Past Events
                </button>
              </div>
            </div>
            
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
              </div>
            )}

            {/* Empty State */}
            {!isLoading && eventCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-text-secondary">No {activeTab} events found</p>
              </div>
            )}
            
            {/* Event Categories */}
            {!isLoading && eventCategories.length > 0 && (
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
                        <span className="text-xs bg-brand-green text-white px-2 py-1 rounded-full font-medium">
                          {category.events.length} {category.events.length === 1 ? 'event' : 'events'}
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
                          <SocialEventCard
                            key={event.id}
                            id={event.id}
                            title={event.title}
                            date={formatEventDate(event.event_date)}
                            time={formatEventTime(event.start_time)}
                            location={event.location}
                            spots={formatSpots(event.current_participants, event.max_participants)}
                            price={formatPrice(event.entry_fee)}
                            image={event.image_url || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"}
                            host={getHostName(event)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <BottomNav mode="social" />
        </div>
      </PageTransition>
      <BottomNav mode="social" />
    </>
  );
};

export default Social;