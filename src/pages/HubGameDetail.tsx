import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, Share2, MessageCircle, CheckCircle2, Trophy } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import venueFootball from "@/assets/venue-football.jpg";

const HubGameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [isJoined, setIsJoined] = useState(false);

  // Mock game data
  const game = {
    id: gameId,
    title: "Evening Football Match",
    sport: "Football",
    description: "Casual 5-a-side football match. All skill levels welcome! We'll divide teams fairly based on experience. Bring your own water bottle.",
    date: "Today",
    time: "6:00 PM - 8:00 PM",
    location: "Metro Arena, Andheri",
    spots: { current: 8, total: 10 },
    image: venueFootball,
    host: {
      name: "Rahul Sharma",
      avatar: "RS",
      gamesHosted: 15
    },
    rules: ["Shin guards recommended", "Be on time", "Respect all players", "No aggressive tackling"],
    players: [
      { name: "Rahul", avatar: "R", status: "Host" },
      { name: "Priya", avatar: "P", status: "Joined" },
      { name: "Amit", avatar: "A", status: "Joined" },
      { name: "Sneha", avatar: "S", status: "Joined" },
    ]
  };

  const handleJoin = () => {
    setIsJoined(true);
    toast.success("Successfully joined!", {
      description: "You've been added to the game. Chat is now available."
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      
      {/* Hero Image */}
      <div className="relative aspect-video">
        <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="px-2 py-1 bg-brand-green text-white text-xs font-medium rounded-full mb-2 inline-block">
            {game.sport}
          </span>
          <h1 className="text-xl font-bold text-white mb-1">{game.title}</h1>
          <p className="text-sm text-white/80">Hosted by {game.host.name}</p>
        </div>
      </div>
      
      <div className="px-5 py-4 space-y-5">
        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Date</p>
              <p className="text-sm font-semibold text-foreground">{game.date}</p>
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Time</p>
              <p className="text-sm font-semibold text-foreground">{game.time}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-brand-green" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-text-secondary">Location</p>
            <p className="text-sm font-semibold text-foreground">{game.location}</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            View Map
          </Button>
        </div>
        
        {/* Description */}
        <div>
          <h3 className="font-bold text-foreground mb-2">About this Game</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{game.description}</p>
        </div>
        
        {/* Game Rules */}
        <div>
          <h3 className="font-bold text-foreground mb-2">Game Rules</h3>
          <div className="space-y-2">
            {game.rules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-brand-green flex-shrink-0" />
                {rule}
              </div>
            ))}
          </div>
        </div>
        
        {/* Players */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-foreground">Players</h3>
            <span className="text-xs text-text-secondary">{game.spots.current}/{game.spots.total} joined</span>
          </div>
          <div className="space-y-2">
            {game.players.map((player, idx) => (
              <div key={idx} className="bg-muted rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-soft rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-brand-green">{player.avatar}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{player.name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  player.status === "Host" 
                    ? "bg-chip-purple-bg text-chip-purple-text" 
                    : "bg-brand-soft text-brand-green"
                }`}>
                  {player.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Host */}
        <div className="bg-card rounded-xl shadow-soft p-4">
          <h3 className="font-bold text-foreground mb-3">Game Host</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{game.host.avatar}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{game.host.name}</p>
              <p className="text-xs text-text-secondary">{game.host.gamesHosted} games hosted</p>
            </div>
            <Button variant="outline" size="sm">View Profile</Button>
          </div>
        </div>
      </div>
      
      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-divider p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-green" />
          <span className="text-sm font-semibold text-foreground">{game.spots.total - game.spots.current} spots left</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="w-10 h-10">
            <Share2 className="w-4 h-4" />
          </Button>
          {isJoined ? (
            <Button 
              className="bg-brand-green hover:bg-brand-green/90 text-white px-6"
              onClick={() => navigate(`/hub/chat/${gameId}`)}
            >
              <MessageCircle className="w-4 h-4 mr-2" /> Open Chat
            </Button>
          ) : (
            <Button 
              className="bg-brand-green hover:bg-brand-green/90 text-white px-6"
              onClick={handleJoin}
            >
              Join Game
            </Button>
          )}
        </div>
      </div>
      
      <BottomNav mode="hub" />
    </div>
  );
};

export default HubGameDetail;