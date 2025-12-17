import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { Users, MapPin, Calendar, ChevronRight, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const HubCommunity = () => {
  const communities = [
    {
      id: "1",
      name: "Mumbai Football League",
      members: 2340,
      description: "Official community for football enthusiasts in Mumbai",
      image: "⚽",
      category: "Football"
    },
    {
      id: "2",
      name: "Badminton Club India",
      members: 1856,
      description: "Connect with badminton players across the city",
      image: "🏸",
      category: "Badminton"
    },
    {
      id: "3",
      name: "Cricket Fanatics",
      members: 5420,
      description: "For passionate cricket players and fans",
      image: "🏏",
      category: "Cricket"
    },
    {
      id: "4",
      name: "Tennis Pros Mumbai",
      members: 980,
      description: "Tennis community for all skill levels",
      image: "🎾",
      category: "Tennis"
    },
  ];

  const leaderboard = [
    { rank: 1, name: "Rahul Sharma", points: 2450, games: 48 },
    { rank: 2, name: "Priya Patel", points: 2280, games: 42 },
    { rank: 3, name: "Amit Desai", points: 2150, games: 39 },
  ];

  const upcomingEvents = [
    { title: "Mumbai Football Championship", date: "Dec 28, 2024", participants: 128 },
    { title: "Badminton Doubles League", date: "Jan 5, 2025", participants: 64 },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        <SearchBar placeholder="Search communities..." />
        
        {/* Featured Communities */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg text-foreground">Featured Communities</h2>
            <button className="text-sm text-brand-green font-medium">See all</button>
          </div>
          
          <div className="space-y-3">
            {communities.map((community) => (
              <div key={community.id} className="bg-card rounded-xl shadow-soft p-4 flex items-center gap-3">
                <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center text-2xl">
                  {community.image}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{community.name}</h3>
                  <p className="text-xs text-text-secondary truncate">{community.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-text-tertiary flex items-center gap-1">
                      <Users className="w-3 h-3" /> {community.members.toLocaleString()}
                    </span>
                    <span className="text-xs bg-brand-soft text-brand-green px-2 py-0.5 rounded-full">
                      {community.category}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-8">
                  Join
                </Button>
              </div>
            ))}
          </div>
        </section>
        
        {/* Leaderboard */}
        <section className="bg-card rounded-xl shadow-soft p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="font-bold text-foreground">Weekly Leaderboard</h2>
            </div>
            <button className="text-sm text-brand-green font-medium">View all</button>
          </div>
          
          <div className="space-y-2">
            {leaderboard.map((player) => (
              <div key={player.rank} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  player.rank === 1 ? "bg-yellow-100 text-yellow-600" :
                  player.rank === 2 ? "bg-gray-100 text-gray-600" :
                  "bg-orange-100 text-orange-600"
                }`}>
                  {player.rank}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{player.name}</p>
                  <p className="text-xs text-text-secondary">{player.games} games played</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-green">{player.points}</p>
                  <p className="text-xs text-text-tertiary">points</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Upcoming Community Events */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg text-foreground">Community Events</h2>
            <button className="text-sm text-brand-green font-medium">See all</button>
          </div>
          
          <div className="space-y-3">
            {upcomingEvents.map((event, idx) => (
              <div key={idx} className="bg-card rounded-xl shadow-soft p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-chip-purple-bg rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-chip-purple-text" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-foreground">{event.title}</h3>
                  <p className="text-xs text-text-secondary">{event.date} • {event.participants} participants</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              </div>
            ))}
          </div>
        </section>
      </div>
      
      <BottomNav mode="hub" />
    </div>
  );
};

export default HubCommunity;