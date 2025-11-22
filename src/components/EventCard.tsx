import { Calendar, MapPin, Users } from "lucide-react";
import { Button } from "./ui/button";

interface EventCardProps {
  image: string;
  title: string;
  date: string;
  location: string;
  generalPrice: string;
  vipPrice: string;
  participants?: string;
}

export const EventCard = ({ image, title, date, location, generalPrice, vipPrice, participants }: EventCardProps) => {
  return (
    <div className="bg-card rounded-2xl shadow-strong overflow-hidden">
      {/* Image with VS overlay */}
      <div className="relative aspect-video">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        {participants && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Users className="w-8 h-8 text-brand-green" />
              </div>
              <span className="text-2xl font-bold text-white drop-shadow-lg">VS</span>
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Users className="w-8 h-8 text-brand-green" />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-lg text-foreground">{title}</h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Calendar className="w-4 h-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <span className="px-3 py-1.5 bg-chip-green-bg text-chip-green-text text-sm font-medium rounded-full">
            General ₹{generalPrice}
          </span>
          <span className="px-3 py-1.5 bg-chip-purple-bg text-chip-purple-text text-sm font-medium rounded-full">
            VIP ₹{vipPrice}
          </span>
        </div>
        
        <Button className="w-full bg-brand-danger hover:bg-brand-danger/90 text-white h-12 text-base font-semibold rounded-xl">
          Buy Tickets
        </Button>
      </div>
    </div>
  );
};
