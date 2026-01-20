import { Calendar, MapPin, Bookmark, MessageCircle, Users, Trophy } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

interface HubGameCardProps {
  id: string;
  image: string;
  sport: string;
  title: string;
  host: string;
  date: string;
  location: string;
  spotsLeft: string;
  type: "public" | "tournament";
}

export const HubGameCard = ({ id, image, sport, title, host, date, location, spotsLeft, type }: HubGameCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-muted rounded-xl overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
          <img src={image} alt={title} className="w-full h-full object-cover" />
          {type === "tournament" && (
            <div className="absolute top-1 left-1 w-6 h-6 bg-chip-purple-bg rounded-full flex items-center justify-center">
              <Trophy className="w-3 h-3 text-chip-purple-text" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-sm text-foreground truncate">{title}</h4>
              <p className="text-xs text-text-secondary">by {host}</p>
            </div>
            <span className="px-2 py-0.5 bg-brand-soft text-brand-green text-xs font-medium rounded-full flex-shrink-0">
              {sport}
            </span>
          </div>
          
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Calendar className="w-3 h-3" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-3 pb-3 flex items-center justify-between">
        <span className="text-xs bg-white text-brand-green px-2 py-1 rounded-full font-medium flex items-center gap-1 border border-brand-green/20">
          <Users className="w-3 h-3" /> {spotsLeft}
        </span>
        <div className="flex gap-2">
          <button className="w-8 h-8 border border-divider rounded-lg flex items-center justify-center hover:bg-card transition-colors">
            <Bookmark className="w-4 h-4 text-text-secondary" />
          </button>
          <Button 
            size="sm" 
            className="bg-brand-green hover:bg-brand-green/90 text-white h-8 px-4 rounded-lg"
            onClick={() => navigate(type === "tournament" ? `/hub/tournament/${id}` : `/hub/game/${id}`)}
          >
            {type === "tournament" ? "Register" : "Join Game"}
          </Button>
        </div>
      </div>
    </div>
  );
};