import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Navigation, Phone, Heart, Share2, CheckCircle, Globe, Instagram } from "lucide-react";
import SlotSelectionSheet from "@/components/booking/SlotSelectionSheet";
import { generateVenueSlots } from "@/utils/slotGenerator";
import { useVenueById, getVenueImageUrl } from "@/hooks/useVenues";
import { toast } from "sonner";
const VenueDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { venueId } = useParams();
  const [searchParams] = useSearchParams();
  const shouldOpenSlots = searchParams.get("openSlots") === "true";
  
  // Fetch venue from database
  const { data: venue, isLoading } = useVenueById(venueId || "");
  
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

  // Generate slots using venue data from database
  const allSlots = useMemo(() => {
    if (!venue) return [];
    return generateVenueSlots(venue, selectedDate);
  }, [venue, selectedDate]);

  // Helper to format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  // Get selected slot data for pricing and display
  const selectedSlotData = allSlots.filter(slot => 
    selectedSlots.includes(slot.start_time)
  );

  // Action handlers
  const handleOpenDirections = () => {
    if (venue?.latitude && venue?.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`,
        '_blank'
      );
    } else if (venue?.address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address + ', ' + venue.city)}`,
        '_blank'
      );
    }
  };

  const handleCall = () => {
    if (venue?.phone_number) {
      window.location.href = `tel:${venue.phone_number}`;
    } else {
      toast.error("Phone number not available for this venue");
    }
  };

  const handleOpenInstagram = () => {
    if (venue?.instagram_handle) {
      const handle = venue.instagram_handle.replace('@', '');
      window.open(`https://instagram.com/${handle}`, '_blank');
    }
  };

  const handleOpenWebsite = () => {
    if (venue?.website_url) {
      window.open(venue.website_url, '_blank');
    }
  };

  const handleProceed = () => {
    if (selectedSlots.length === 0 || !venue) return;
    
    const totalAmount = selectedSlotData.reduce((sum, slot) => sum + slot.price, 0);
    
    const venueData = {
      id: venue.id,
      name: venue.name,
      image: getVenueImageUrl(venue.image_url),
      rating: venue.rating || 0,
      amenities: venue.amenities || [],
      price: venue.price_per_hour,
      verified: true,
      timing: `Today - ${venue.opening_time} – ${venue.closing_time}`,
      phone: venue.phone_number,
      address: venue.address,
      city: venue.city,
      instagram: venue.instagram_handle,
      website: venue.website_url,
      sport: venue.sport,
    };
    
    const bookingData = {
      venue: venueData,
      selectedSlots,
      selectedSlotData,
      selectedDate: selectedDate.toISOString(),
      playerCount,
      visibility,
      totalAmount,
    };
    
    navigate("/booking/preview", { state: bookingData });
  };

  const totalAmount = selectedSlotData.reduce((sum, slot) => sum + slot.price, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader />
        <div className="px-5 py-4 space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
        <BottomNav mode="venues" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <AppHeader />
        <div className="px-5 py-4 flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-xl font-bold text-foreground mb-2">Venue Not Found</h2>
          <p className="text-text-secondary mb-4">The venue you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
        <BottomNav mode="venues" />
      </div>
    );
  }

  const venueForSheet = {
    id: venue.id,
    name: venue.name,
    price: venue.price_per_hour,
    opening_time: venue.opening_time,
    closing_time: venue.closing_time,
    total_courts: venue.total_courts,
    min_booking_duration: venue.min_booking_duration,
    peak_price: venue.peak_price,
    peak_hours: venue.peak_hours,
    day_schedules: venue.day_schedules,
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-4">
        {/* Venue Image */}
        <div className="relative rounded-2xl overflow-hidden">
          <Badge className="absolute top-3 left-3 bg-brand-green/90 text-white border-0 z-10 capitalize">
            {venue.category}
          </Badge>
          <img 
            src={getVenueImageUrl(venue.image_url)} 
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
                <Badge variant="outline" className="text-brand-green border-brand-green text-xs">
                  Verified
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{venue.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>1.5 km</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {venue.description && (
            <p className="text-sm text-text-secondary">{venue.description}</p>
          )}

          {/* Amenities */}
          <div className="flex flex-wrap gap-2">
            {venue.amenities?.map((amenity) => (
              <Badge key={amenity} variant="secondary" className="bg-muted text-text-secondary">
                {amenity}
              </Badge>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-3 py-3">
            <button 
              onClick={handleOpenDirections}
              className="flex flex-col items-center gap-1 text-text-secondary"
            >
              <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <span className="text-xs">Direction</span>
            </button>
            <button 
              onClick={handleCall}
              className="flex flex-col items-center gap-1 text-text-secondary"
            >
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
        {selectedSlotData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Selected Slots</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {selectedSlotData.map((slot) => (
                <div 
                  key={slot.start_time} 
                  className="flex-shrink-0 bg-primary/10 border-2 border-primary rounded-xl px-4 py-3 text-center"
                >
                  <p className="text-primary font-semibold text-sm whitespace-nowrap">
                    {formatTime(slot.start_time)} | {slot.duration_minutes} mins
                  </p>
                  <p className="text-primary/70 text-xs mt-0.5">
                    1 court booked • ₹{slot.price}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Venue Details */}
        <div className="space-y-3 py-3 border-t border-border">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-brand-green flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Today - {venue.opening_time} – {venue.closing_time}</p>
              <p className="text-sm text-text-secondary capitalize">{venue.sport} • {venue.total_courts || 1} court(s)</p>
            </div>
          </div>
          
          {venue.phone_number && (
            <button 
              onClick={handleCall}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-text-secondary" />
                <span className="text-foreground">{venue.phone_number}</span>
              </div>
              <span className="text-brand-green font-medium">Call</span>
            </button>
          )}
          
          <button 
            onClick={handleOpenDirections}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-text-secondary" />
              <span className="text-foreground truncate max-w-[200px]">{venue.address}</span>
            </div>
            <span className="text-brand-green font-medium">View on map</span>
          </button>
          
          {venue.instagram_handle && (
            <button 
              onClick={handleOpenInstagram}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-text-secondary" />
                <span className="text-foreground">@{venue.instagram_handle.replace('@', '')}</span>
              </div>
              <span className="text-brand-green font-medium">Open</span>
            </button>
          )}

          {venue.website_url && (
            <button 
              onClick={handleOpenWebsite}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-text-secondary" />
                <span className="text-foreground truncate max-w-[200px]">{venue.website_url.replace(/^https?:\/\//, '')}</span>
              </div>
              <span className="text-brand-green font-medium">Visit</span>
            </button>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 text-text-secondary text-center">₹</span>
              <span className="text-foreground">Price per hour</span>
            </div>
            <span className="text-brand-green font-medium">₹{venue.price_per_hour}/hr</span>
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
        venue={venueForSheet}
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
