import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Users, Target, Edit2, HelpCircle, Globe, Lock, Rocket, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

const BookingPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state;

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  if (!bookingData) {
    navigate("/venues/courts");
    return null;
  }

  const { venue, selectedSlots, selectedSlotData, selectedDate, playerCount, visibility, totalAmount } = bookingData;
  const formattedDate = format(new Date(selectedDate), "EEEE, MMM do");
  
  // Helper to format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  // Build time range from slot data
  const timeRange = selectedSlotData && selectedSlotData.length > 0 
    ? `${formatTime(selectedSlotData[0].start_time)} - ${formatTime(selectedSlotData[selectedSlotData.length - 1].start_time)}`
    : selectedSlots.length > 0 
    ? `${selectedSlots[0]} - ${selectedSlots[selectedSlots.length - 1]}`
    : "";

  const isPublicGame = visibility === "public";

  const handleEditSlot = () => {
    navigate(`/venue/${venue.id}?name=${encodeURIComponent(venue.name)}&openSlots=true`, {
      state: {
        returnFromPreview: true,
        selectedSlots,
        selectedDate,
        playerCount,
        visibility
      }
    });
  };

  const handleProceedToCheckout = () => {
    // Save to userBookings for profile page
    const userBookings = JSON.parse(localStorage.getItem("userBookings") || "[]");
    const bookingId = `booking-${Date.now()}`;
    const newBooking = {
      id: bookingId,
      venue: venue.name,
      venueImage: venue.image,
      sport: venue.name.includes("Tennis") ? "Tennis" : venue.name.includes("Football") ? "Football" : "Sports",
      date: formattedDate,
      time: timeRange,
      rawDate: selectedDate,
      location: venue.address,
      playerCount: playerCount,
      visibility: visibility,
      slots: selectedSlots,
      totalAmount: totalAmount,
      createdAt: new Date().toISOString()
    };
    userBookings.push(newBooking);
    localStorage.setItem("userBookings", JSON.stringify(userBookings));

    // If public game, also save to publicGames for Social Games display
    if (isPublicGame) {
      const publicGames = JSON.parse(localStorage.getItem("publicGames") || "[]");
      const newGame = {
        id: `game-${Date.now()}`,
        venue: venue.name,
        sport: newBooking.sport,
        title: `${venue.name.split(" ")[0]} Game`,
        host: "You",
        date: formattedDate,
        time: timeRange,
        location: venue.address,
        spotsLeft: `1/${playerCount + 1}`,
        playerCount: playerCount + 1,
        createdAt: new Date().toISOString()
      };
      publicGames.push(newGame);
      localStorage.setItem("publicGames", JSON.stringify(publicGames));
    }
    
    navigate("/booking/confirmation", { state: { ...bookingData, bookingId: bookingId } });
  };

  const canProceed = isPublicGame ? agreedToTerms : true;

  return (
    <div className="min-h-screen bg-muted pb-32">
      {/* Header */}
      <div className="bg-background px-5 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">
          {isPublicGame ? "Host a Game" : "Book a Court"}
        </h1>
        <button className="p-2 -mr-2">
          <HelpCircle className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Almost There */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Almost there!</h2>
          <p className="text-text-secondary mt-1">
            {isPublicGame 
              ? "Review your game details before publishing to the community."
              : "Review your booking details before confirming."
            }
          </p>
        </div>

        {/* Selected Slots Display - Side by side highlighted boxes */}
        <div>
          <h3 className="font-bold text-foreground mb-3">Selected Slots</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {selectedSlotData && selectedSlotData.length > 0 ? (
              selectedSlotData.map((slot: any, index: number) => (
                <div 
                  key={index}
                  className="flex-shrink-0 bg-primary/10 border-2 border-primary rounded-xl px-4 py-3 text-center"
                >
                  <p className="text-primary font-semibold text-sm whitespace-nowrap">
                    {formatTime(slot.start_time)} | {slot.duration_minutes} mins
                  </p>
                  <p className="text-primary/70 text-xs mt-0.5">
                    {slot.available_courts}/{slot.total_courts} • ₹{slot.price}
                  </p>
                </div>
              ))
            ) : (
              selectedSlots.map((slot: string, index: number) => (
                <div 
                  key={index}
                  className="flex-shrink-0 bg-primary/10 border-2 border-primary rounded-xl px-4 py-3 text-center"
                >
                  <p className="text-primary font-semibold text-sm whitespace-nowrap">{slot}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Game Details Card */}
        <div className="bg-background rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-brand-green" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Game Details</p>
                <p className="text-xs text-text-secondary">Type & preferences</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-brand-green border-brand-green bg-brand-green/5"
              onClick={handleEditSlot}
            >
              <Edit2 className="w-3 h-3 mr-1" /> Edit
            </Button>
          </div>

          <div className="space-y-3 pl-2">
            <div className="flex items-start gap-3">
              <span className="text-xs text-text-tertiary w-24">Game Type</span>
              <span className="text-sm font-medium text-foreground">{venue.name}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-text-tertiary w-24">Visibility</span>
              <div className="flex items-center gap-1">
                {isPublicGame ? (
                  <>
                    <Globe className="w-3 h-3 text-brand-green" />
                    <span className="text-sm font-medium text-foreground">Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-brand-green" />
                    <span className="text-sm font-medium text-foreground">Friends Only</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-text-tertiary w-24">Players</span>
              <span className="text-sm font-medium text-foreground">
                {isPublicGame 
                  ? `Current: 1/${playerCount + 1} (You + ${playerCount} players)`
                  : `${playerCount} players`
                }
              </span>
            </div>
            {isPublicGame && (
              <div className="flex items-start gap-3">
                <span className="text-xs text-text-tertiary w-24">Connection Goal</span>
                <span className="text-sm font-medium text-foreground">Seeking New Connections</span>
              </div>
            )}
          </div>
        </div>

        {/* Time & Location Card */}
        <div className="bg-background rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Time & Location</p>
                <p className="text-xs text-text-secondary">When & where</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-brand-green border-brand-green bg-brand-green/5"
              onClick={handleEditSlot}
            >
              <Edit2 className="w-3 h-3 mr-1" /> Edit
            </Button>
          </div>

          <div className="space-y-3 pl-2">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-text-tertiary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{formattedDate}</p>
                <p className="text-xs text-text-secondary">{timeRange}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-text-tertiary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{venue.name}</p>
                <p className="text-xs text-text-secondary">{venue.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-background rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Total Amount</span>
            <span className="text-xl font-bold text-brand-green">₹{totalAmount}</span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            {selectedSlots.length} slot(s) × ₹{venue.price}/slot
          </p>
        </div>

        {/* Terms Checkbox - Only for Public Games */}
        {isPublicGame && (
          <div className="bg-background rounded-2xl p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-0.5 border-text-tertiary data-[state=checked]:bg-brand-green data-[state=checked]:border-brand-green"
              />
              <label htmlFor="terms" className="text-sm text-text-secondary cursor-pointer leading-relaxed">
                I agree to the{" "}
                <span className="text-brand-green font-medium">Host Guidelines</span>
                <br />
                and confirm all information is accurate
              </label>
            </div>

            {/* Info Box for Public Games */}
            <div className="bg-brand-green/10 rounded-xl p-4 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
                <Info className="w-3 h-3 text-white" />
              </div>
              <p className="text-sm text-text-secondary">
                Once published, your game will be visible to the community. You'll receive notifications when players join.
              </p>
            </div>
          </div>
        )}

        {/* Info Box for Friends Only */}
        {!isPublicGame && (
          <div className="bg-brand-green/10 rounded-xl p-4 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-green/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-3 h-3 text-brand-green" />
            </div>
            <p className="text-sm text-text-secondary">
              Your booking will be confirmed immediately. Only invited friends will be able to see this game.
            </p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background border-t border-border">
        <Button
          onClick={handleProceedToCheckout}
          disabled={!canProceed}
          className="w-full bg-brand-green hover:bg-brand-green/90 text-white h-12 rounded-xl disabled:opacity-50"
        >
          <Rocket className="w-4 h-4 mr-2" />
          Proceed to Checkout
        </Button>
        <p className="text-xs text-text-tertiary text-center mt-2">
          {isPublicGame ? "Your game will go live immediately" : "Your booking will be confirmed"}
        </p>
      </div>
    </div>
  );
};

export default BookingPreview;
