import { Calendar, MapPin, Bookmark, Users, Trophy } from "lucide-react";
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
  prizePool?: string;
  entryFee?: number;
}

export const HubGameCard = ({ 
  id, 
  image, 
  sport, 
  title, 
  host, 
  date, 
  location, 
  spotsLeft, 
  type,
  prizePool,
  entryFee 
}: HubGameCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-muted rounded-xl overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
          <img src={image} alt={title} className="w-full h-full object-cover" />
          {type === "tournament" && (
            <div className="absolute top-1 left-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <Trophy className="w-2.5 h-2.5 text-primary-foreground" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm text-foreground line-clamp-1">{title}</h4>
              <span className="px-2 py-0.5 bg-brand-soft text-brand-green text-[10px] font-medium rounded-full flex-shrink-0 capitalize">
                {sport}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">by {host}</p>
          </div>
          
          <div className="space-y-0.5 mt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-3 pb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs bg-card text-brand-green px-2 py-1 rounded-full font-medium flex items-center gap-1 border border-brand-green/20 flex-shrink-0">
            <Users className="w-3 h-3" /> {spotsLeft}
          </span>
          {type === "tournament" && prizePool && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium truncate">
              {prizePool}
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="w-8 h-8 border border-divider rounded-lg flex items-center justify-center hover:bg-card transition-colors">
            <Bookmark className="w-4 h-4 text-muted-foreground" />
          </button>
          <Button 
            size="sm" 
            className="bg-brand-green hover:bg-brand-green/90 text-white h-8 px-3 rounded-lg text-xs"
            onClick={() => navigate(type === "tournament" ? `/hub/tournament/${id}` : `/hub/game/${id}`)}
          >
            {type === "tournament" ? "Register" : "Join"}
          </Button>
        </div>
      </div>
    </div>
  );
};