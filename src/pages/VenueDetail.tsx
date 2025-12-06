import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Navigation, Phone, Heart, Share2, CheckCircle } from "lucide-react";
import venueTennis from "@/assets/venue-tennis.jpg";
import SlotSelectionSheet from "@/components/booking/SlotSelectionSheet";

const VenueDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { venueId } = useParams();
  const [searchParams] = useSearchParams();
  const venueName = searchParams.get("name") || "Green Valley Tennis Club";
  const shouldOpenSlots = searchParams.get("openSlots") === "true";
  
  const [isLiked, setIsLiked] = useState(false);
  const [showSlotSelection, setShowSlotSelection] = useState(false);
  
  // Initialize state from location.state if returning from preview
  const returnState = location.state;
  const [selectedSlots, setSelectedSlots] = useState<string[]>(
    returnState?.selectedSlots || []
  );
  const [selectedDate, setSelectedDate] = useState<Date>(
    returnState?.selectedDate ? new Date(returnState.selectedDate) : new Date()
  );
  const [playerCount, setPlayerCount] = useState(returnState?.playerCount || 3);
  const [visibility, setVisibility] = useState<"public" | "friends">(
    returnState?.visibility || "public"
  );

  // Open slot selection if returning from preview with openSlots param
  useEffect(() => {
    if (shouldOpenSlots || returnState?.returnFromPreview) {
      setShowSlotSelection(true);
    }
  }, [shouldOpenSlots, returnState?.returnFromPreview]);

  const venue = {
    id: venueId || "1",
    name: venueName,
    image: venueTennis,
    rating: 4.8,
    distance: "1.5 km",
    amenities: ["Lighting", "Parking", "Shower"],
    price: 300,
    verified: true,
    timing: "Today - 9:00 AM – 10:00 PM",
    lastSlot: "Last slot starts at 9:30 PM",
    phone: "+91 9874563125",
    address: "KNK Road, Chennai",
    instagram: "@greenvalley",
  };

  const handleProceed = () => {
    if (selectedSlots.length === 0) return;
    
    const bookingData = {
      venue,
      selectedSlots,
      selectedDate: selectedDate.toISOString(),
      playerCount,
      visibility,
      totalAmount: selectedSlots.length * venue.price,
    };
    
    navigate("/booking/preview", { state: bookingData });
  };

  const totalAmount = selectedSlots.length * venue.price;

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-4">
        {/* Venue Image */}
        <div className="relative rounded-2xl overflow-hidden">
          <Badge className="absolute top-3 left-3 bg-brand-green/90 text-white border-0 z-10">
            Courts
          </Badge>
          <img 
            src={venue.image} 
            alt={venue.name} 
            className="w-full h-48 object-cover"
          />
        </div>

        {/* Venue Info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{venue.name}</h1>
                {venue.verified && (
                  <Badge variant="outline" className="text-brand-green border-brand-green text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{venue.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{venue.distance}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2">
            {venue.amenities.map((amenity) => (
              <Badge key={amenity} variant="secondary" className="bg-muted text-text-secondary">
                {amenity}
              </Badge>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-3 py-3">
            <button className="flex flex-col items-center gap-1 text-text-secondary">
              <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <span className="text-xs">Direction</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-text-secondary">
              <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-xs">Call</span>
            </button>
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className="flex flex-col items-center gap-1 text-text-secondary"
            >
              <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </div>
              <span className="text-xs">Save</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-text-secondary">
              <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-xs">Share</span>
            </button>
          </div>
        </div>

        {/* Selected Slots Display */}
        {selectedSlots.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-secondary">Selected Slot</h3>
            <div className="flex flex-wrap gap-2">
              {selectedSlots.map((slot) => (
                <Badge 
                  key={slot} 
                  className="bg-brand-green text-white border-0 px-3 py-1.5"
                >
                  {slot}
                  <span className="ml-1 text-xs opacity-80">4 left</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Venue Details */}
        <div className="space-y-3 py-3 border-t border-border">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-brand-green flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">{venue.timing}</p>
              <p className="text-sm text-text-secondary">{venue.lastSlot}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-text-secondary" />
              <span className="text-foreground">{venue.phone}</span>
            </div>
            <span className="text-brand-green font-medium">Call</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-text-secondary" />
              <span className="text-foreground">{venue.address}</span>
            </div>
            <span className="text-brand-green font-medium">View on map</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 text-text-secondary text-center">@</span>
              <span className="text-foreground">{venue.instagram}</span>
            </div>
            <span className="text-brand-green font-medium">Open</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 text-text-secondary text-center">₹</span>
              <span className="text-foreground">Amount</span>
            </div>
            <span className="text-brand-green font-medium">{venue.price}/hr</span>
          </div>
        </div>

        {/* Total Amount & Preview Button */}
        {selectedSlots.length > 0 && (
          <div className="flex items-center justify-between py-3 border-t border-border">
            <div>
              <p className="text-sm text-text-secondary">Total Amount:</p>
              <p className="text-xl font-bold text-foreground">₹{totalAmount}</p>
              <p className="text-xs text-text-tertiary">Free cancellation up to 2 hours before</p>
            </div>
            <Button 
              onClick={handleProceed}
              className="bg-brand-green hover:bg-brand-green/90 text-white px-8"
            >
              Preview
            </Button>
          </div>
        )}

        {/* Select Slot Button */}
        {selectedSlots.length === 0 && (
          <Button 
            onClick={() => setShowSlotSelection(true)}
            className="w-full bg-brand-green hover:bg-brand-green/90 text-white h-12"
          >
            Select Slot
          </Button>
        )}
      </div>

      <SlotSelectionSheet
        open={showSlotSelection}
        onOpenChange={setShowSlotSelection}
        venue={venue}
        selectedSlots={selectedSlots}
        setSelectedSlots={setSelectedSlots}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        playerCount={playerCount}
        setPlayerCount={setPlayerCount}
        visibility={visibility}
        setVisibility={setVisibility}
        onProceed={() => setShowSlotSelection(false)}
      />

      <BottomNav mode="venues" />
    </div>
  );
};

export default VenueDetail;
