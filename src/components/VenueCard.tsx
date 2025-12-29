import { Heart, Star, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

interface VenueCardProps {
  image: string;
  name: string;
  rating: number;
  distance: string;
  amenities: string[];
  price: string;
  onBook?: () => void;
}

export const VenueCard = ({ image, name, rating, distance, amenities, price, onBook }: VenueCardProps) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="bg-card rounded-xl shadow-soft overflow-hidden flex flex-col h-full min-h-[340px]">
      {/* Image */}
      <div className="relative h-[140px] flex-shrink-0">
        <img src={image} alt={name} className="w-full h-full object-cover" />
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-3 right-3 w-8 h-8 bg-card rounded-full flex items-center justify-center shadow-soft transition-colors"
        >
          <Heart className={`w-4 h-4 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-text-secondary'}`} />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <h3 className="font-semibold text-foreground text-base line-clamp-1">{name}</h3>
        
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-text-secondary">{rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-text-tertiary" />
            <span className="text-text-secondary">{distance}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5 min-h-[24px]">
          {amenities.slice(0, 3).map((amenity) => (
            <span key={amenity} className="px-2 py-0.5 bg-chip-green-bg text-chip-green-text text-xs rounded-full line-clamp-1">
              {amenity}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-1 mt-auto">
          <span className="text-brand-green font-semibold text-base">{price}</span>
        </div>
      </div>
      
      {/* Cylindrical Button */}
      <div className="px-3 pb-3 mt-auto">
        <Button 
          onClick={onBook}
          className="w-full bg-brand-green hover:bg-brand-green/90 text-white h-10 rounded-full font-semibold"
        >
          Book Now
        </Button>
      </div>
    </div>
  );
};
