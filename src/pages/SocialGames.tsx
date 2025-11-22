import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { GameCard } from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import venueFootball from "@/assets/venue-football.jpg";
import venueBadminton from "@/assets/venue-badminton.jpg";
import venueBasketball from "@/assets/venue-basketball.jpg";

const SocialGames = () => {
  const games = [
    {
      image: venueFootball,
      sport: "Football",
      title: "Evening Football Match",
      host: "Rahul Sharma",
      date: "Today 6:00 PM",
      location: "Metro Arena, Andheri",
      spotsLeft: "2/4"
    },
    {
      image: venueBadminton,
      sport: "Badminton",
      title: "Doubles Badminton Game",
      host: "Priya Patel",
      date: "Today 7:30 PM",
      location: "Phoenix Arena, Bandra",
      spotsLeft: "1/4"
    },
    {
      image: venueBasketball,
      sport: "Basketball",
      title: "3v3 Basketball Pickup",
      host: "Arjun Kumar",
      date: "Tomorrow 5:00 PM",
      location: "Slam Dunk Courts, Powai",
      spotsLeft: "3/6"
    },
  ];
  
  const teammates = [
    { name: "Amit Desai", status: "Free for football?" },
    { name: "Sneha Reddy", status: "Looking for badminton" },
    { name: "Karan Singh", status: "Available tonight" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        <SearchBar placeholder="Search games..." />
        
        {/* Games List */}
        <section className="space-y-3">
          {games.map((game, idx) => (
            <GameCard key={idx} {...game} />
          ))}
        </section>
        
        {/* Hosted/Joined Toggle Card */}
        <section className="bg-card rounded-xl shadow-soft p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-4">
              <button className="text-sm font-semibold text-brand-green border-b-2 border-brand-green pb-1">
                Hosted (2)
              </button>
              <button className="text-sm font-medium text-text-secondary pb-1">
                Joined (5)
              </button>
            </div>
            <button className="text-sm text-brand-green font-medium">Edit</button>
          </div>
          
          <div className="space-y-2">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground">Evening Cricket Match</p>
              <p className="text-xs text-text-secondary">Tomorrow • 4 joined</p>
            </div>
          </div>
        </section>
        
        {/* Suggested Teammates */}
        <section>
          <h3 className="font-bold text-lg text-foreground mb-3">Suggested Teammates</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {teammates.map((mate, idx) => (
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
      
      <BottomNav mode="social" />
    </div>
  );
};

export default SocialGames;
