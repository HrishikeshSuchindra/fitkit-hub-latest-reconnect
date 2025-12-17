import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { HubGameCard } from "@/components/HubGameCard";
import { Button } from "@/components/ui/button";
import { UserPlus, ChevronDown, ChevronUp, Trophy, Gamepad2, Filter } from "lucide-react";
import venueFootball from "@/assets/venue-football.jpg";
import venueBadminton from "@/assets/venue-badminton.jpg";
import venueBasketball from "@/assets/venue-basketball.jpg";
import venueTennis from "@/assets/venue-tennis.jpg";
import venueCricket from "@/assets/venue-cricket.jpg";
import { usePublicGames } from "@/hooks/useBookings";
import { format } from "date-fns";
import { useState } from "react";

const HubGames = () => {
  const { data: publicGames = [], isLoading } = usePublicGames();
  const [expandedSection, setExpandedSection] = useState<string | null>("public");
  const [searchQuery, setSearchQuery] = useState("");

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const defaultGames = [
    {
      id: "g1",
      image: venueFootball,
      sport: "Football",
      title: "Evening Football Match",
      host: "Rahul Sharma",
      date: "Today 6:00 PM",
      location: "Metro Arena, Andheri",
      spotsLeft: "2/4",
      type: "public" as const
    },
    {
      id: "g2",
      image: venueBadminton,
      sport: "Badminton",
      title: "Doubles Badminton Game",
      host: "Priya Patel",
      date: "Today 7:30 PM",
      location: "Phoenix Arena, Bandra",
      spotsLeft: "1/4",
      type: "public" as const
    },
    {
      id: "g3",
      image: venueBasketball,
      sport: "Basketball",
      title: "3v3 Basketball Pickup",
      host: "Arjun Kumar",
      date: "Tomorrow 5:00 PM",
      location: "Slam Dunk Courts, Powai",
      spotsLeft: "3/6",
      type: "public" as const
    },
  ];

  const tournaments = [
    {
      id: "t1",
      image: venueCricket,
      sport: "Cricket",
      title: "Mumbai Cricket League 2024",
      host: "FitKits Official",
      date: "Dec 28-30, 2024",
      location: "Wankhede Stadium",
      spotsLeft: "8/16 teams",
      type: "tournament" as const
    },
    {
      id: "t2",
      image: venueTennis,
      sport: "Tennis",
      title: "Winter Tennis Championship",
      host: "Tennis Club Mumbai",
      date: "Jan 5-7, 2025",
      location: "Royal Tennis Club",
      spotsLeft: "12/32",
      type: "tournament" as const
    },
  ];

  const userCreatedGames = publicGames.map(game => {
    const hostName = game.profiles?.display_name || game.profiles?.username || "Unknown Host";
    return {
      id: game.id,
      image: game.venue_image || venueTennis,
      sport: game.sport || "Sports",
      title: `${game.venue_name.split(" ")[0]} Game`,
      host: hostName,
      date: `${format(new Date(game.slot_date), "MMM do")} ${formatTime(game.slot_time)}`,
      location: game.venue_address || game.venue_name,
      spotsLeft: `1/${game.player_count + 1}`,
      type: "public" as const
    };
  });

  const allPublicGames = [...userCreatedGames, ...defaultGames];
  
  const filteredPublicGames = allPublicGames.filter(game => 
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTournaments = tournaments.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar 
              placeholder="Search games, tournaments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
            <Filter className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        
        {/* Public Games Section */}
        <div className="bg-card rounded-xl shadow-soft overflow-hidden">
          <button
            onClick={() => toggleSection("public")}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-brand-green" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-foreground">Public Games</h3>
                <p className="text-xs text-text-secondary">Join open matches near you</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-brand-soft text-brand-green px-2 py-1 rounded-full font-medium">
                {filteredPublicGames.length} games
              </span>
              {expandedSection === "public" ? (
                <ChevronUp className="w-5 h-5 text-text-secondary" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-secondary" />
              )}
            </div>
          </button>
          
          {expandedSection === "public" && (
            <div className="px-4 pb-4 space-y-3">
              {filteredPublicGames.map((game) => (
                <HubGameCard key={game.id} {...game} />
              ))}
            </div>
          )}
        </div>
        
        {/* Tournaments Section */}
        <div className="bg-card rounded-xl shadow-soft overflow-hidden">
          <button
            onClick={() => toggleSection("tournaments")}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-chip-purple-bg rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-chip-purple-text" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-foreground">Tournaments</h3>
                <p className="text-xs text-text-secondary">Compete in organized events</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-chip-purple-bg text-chip-purple-text px-2 py-1 rounded-full font-medium">
                {filteredTournaments.length} events
              </span>
              {expandedSection === "tournaments" ? (
                <ChevronUp className="w-5 h-5 text-text-secondary" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-secondary" />
              )}
            </div>
          </button>
          
          {expandedSection === "tournaments" && (
            <div className="px-4 pb-4 space-y-3">
              {filteredTournaments.map((tournament) => (
                <HubGameCard key={tournament.id} {...tournament} />
              ))}
            </div>
          )}
        </div>
        
        {/* Suggested Teammates */}
        <section>
          <h3 className="font-bold text-lg text-foreground mb-3">Suggested Teammates</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { name: "Amit Desai", status: "Free for football?" },
              { name: "Sneha Reddy", status: "Looking for badminton" },
              { name: "Karan Singh", status: "Available tonight" },
            ].map((mate, idx) => (
              <div key={idx} className="min-w-[160px] bg-card rounded-xl shadow-soft p-3 space-y-2">
                <div className="w-12 h-12 bg-brand-soft rounded-full mx-auto"></div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">{mate.name}</p>
                  <p className="text-xs text-text-secondary">{mate.status}</p>
                </div>
                <Button className="w-full bg-brand-green hover:bg-brand-green/90 text-white h-8 text-xs rounded-lg">
                  <UserPlus className="w-3 h-3 mr-1" /> Invite
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
      
      <BottomNav mode="hub" />
    </div>
  );
};

export default HubGames;