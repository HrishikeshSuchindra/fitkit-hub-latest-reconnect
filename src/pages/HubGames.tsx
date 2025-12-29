import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { HubGameCard } from "@/components/HubGameCard";
import { PageTransition } from "@/components/PageTransition";
import { ChevronDown, ChevronUp, Trophy, Gamepad2, Filter } from "lucide-react";
import venueTennis from "@/assets/venue-tennis.jpg";
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

  // Only show user-created public games from the database
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

  const tournaments: Array<{
    id: string;
    image: string;
    sport: string;
    title: string;
    host: string;
    date: string;
    location: string;
    spotsLeft: string;
    type: "tournament";
  }> = [];

  const filteredPublicGames = userCreatedGames.filter(game => 
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
    <>
      <PageTransition>
        <div className="min-h-screen bg-background pb-20">
          <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar 
              placeholder="Search games, tournaments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              context="hub"
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
      </div>
      
      <BottomNav mode="hub" />
        </div>
      </PageTransition>
    </>
  );
};

export default HubGames;