import { Calendar, MapPin, Bookmark, MessageCircle, Users } from "lucide-react";
import { Button } from "./ui/button";

interface GameCardProps {
  image: string;
  sport: string;
  title: string;
  host: string;
  date: string;
  location: string;
  spotsLeft: string;
}

export const GameCard = ({ image, sport, title, host, date, location, spotsLeft }: GameCardProps) => {
  return (
    <div className="bg-card rounded-xl shadow-soft overflow-hidden">
      {/* Image with availability badge */}
      <div className="relative aspect-video">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/95 rounded-full text-xs font-semibold text-brand-green">
          {spotsLeft} left
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Host */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-soft rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-brand-green" />
          </div>
          <span className="text-sm font-medium text-text-secondary">{host}</span>
        </div>
        
        <h3 className="font-bold text-base text-foreground">{title}</h3>
        
        {/* Details */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-2.5 py-1 bg-chip-green-bg text-chip-green-text text-xs font-medium rounded-full flex items-center gap-1">
            {sport}
          </span>
          <span className="text-xs text-text-secondary">{date}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white h-10 rounded-lg font-semibold">
            Join Game
          </Button>
          <button className="w-10 h-10 border border-divider rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <Bookmark className="w-4 h-4 text-text-secondary" />
          </button>
          <button className="w-10 h-10 border border-divider rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <MessageCircle className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>
    </div>
  );
};
