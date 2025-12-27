import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

interface SocialEventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  spots: string;
  price: string;
  image: string;
  host: string;
}

export const SocialEventCard = ({ id, title, date, time, location, spots, price, image, host }: SocialEventCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-muted rounded-xl overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate">{title}</h4>
          <p className="text-xs text-text-secondary mb-2">by {host}</p>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Calendar className="w-3 h-3" />
              <span>{date}</span>
              <Clock className="w-3 h-3 ml-2" />
              <span>{time}</span>
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
        <div className="flex items-center gap-3">
          <span className="text-xs bg-brand-green text-white px-2 py-1 rounded-full font-medium flex items-center gap-1">
            <Users className="w-3 h-3" /> {spots}
          </span>
          <span className="text-sm font-bold text-brand-green">{price}</span>
        </div>
        <Button 
          size="sm" 
          className="bg-brand-green hover:bg-brand-green/90 text-white h-8 px-4 rounded-lg"
          onClick={() => navigate(`/social/event/${id}`)}
        >
          Register
        </Button>
      </div>
    </div>
  );
};