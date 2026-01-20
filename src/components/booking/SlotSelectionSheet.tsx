import { useState, useMemo } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Users, Globe, Lock, Minus, Plus, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";
import SlotCard, { SlotData } from "./SlotCard";
import { generateTimeSlots, defaultTurfConfig } from "@/utils/slotGenerator";
import { useSlotAvailability } from "@/hooks/useBookings";

interface SlotSelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venue: {
    id: string;
    name: string;
    price: number;
  };
  selectedSlots: string[];
  setSelectedSlots: (slots: string[]) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  playerCount: number;
  setPlayerCount: (count: number) => void;
  visibility: "public" | "friends";
  setVisibility: (visibility: "public" | "friends") => void;
  onProceed: () => void;
}

const SlotSelectionSheet = ({
  open,
  onOpenChange,
  venue,
  selectedSlots,
  setSelectedSlots,
  selectedDate,
  setSelectedDate,
  playerCount,
  setPlayerCount,
  visibility,
  setVisibility,
  onProceed,
}: SlotSelectionSheetProps) => {
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Fetch real availability data from database (includes blocked slots)
  const { data: bookedCounts, blockedSlots } = useSlotAvailability(venue.id, selectedDate);

  // Generate slots using the slot generator with real availability
  const allSlots = useMemo(() => {
    const slots = generateTimeSlots(defaultTurfConfig, bookedCounts);
    
    // Mark blocked slots as unavailable
    return slots.map(slot => {
      if (blockedSlots && blockedSlots[slot.start_time]) {
        return {
          ...slot,
          status: "blocked" as const,
          available_courts: 0,
          blockReason: blockedSlots[slot.start_time]
        };
      }
      return slot;
    });
  }, [selectedDate, bookedCounts, blockedSlots]);

  // Filter slots based on toggle
  const displayedSlots = useMemo(() => {
    if (showAvailableOnly) {
      return allSlots.filter(slot => slot.status !== "full" && slot.status !== "blocked");
    }
    return allSlots;
  }, [allSlots, showAvailableOnly]);

  const toggleSlot = (slotTime: string) => {
    if (selectedSlots.includes(slotTime)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slotTime));
    } else {
      setSelectedSlots([...selectedSlots, slotTime]);
    }
  };

  // Get selected slot data for display
  const selectedSlotData = allSlots.filter(slot => 
    selectedSlots.includes(slot.start_time)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        <div className="p-5 space-y-5 overflow-y-auto h-full pb-28">
          {/* Venue Name */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">{venue.name}</h2>
            <Badge variant="outline" className="text-primary border-primary text-xs mt-1">
              Verified
            </Badge>
          </div>

          {/* Visibility Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setVisibility("public")}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                visibility === "public"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <Globe className={`w-6 h-6 ${visibility === "public" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-center">
                <p className={`font-medium ${visibility === "public" ? "text-primary" : "text-foreground"}`}>
                  Public
                </p>
                <p className="text-xs text-muted-foreground">Anyone can find and join</p>
              </div>
            </button>
            <button
              onClick={() => setVisibility("friends")}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                visibility === "friends"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <Lock className={`w-6 h-6 ${visibility === "friends" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-center">
                <p className={`font-medium ${visibility === "friends" ? "text-primary" : "text-foreground"}`}>
                  Friends Only
                </p>
                <p className="text-xs text-muted-foreground">Only your friends can see</p>
              </div>
            </button>
          </div>

          {/* Show Available Only Toggle */}
          <div className="flex items-center justify-between py-3 px-4 bg-card rounded-xl border border-border">
            <span className="text-sm font-medium text-foreground">View available slots only</span>
            <Switch
              checked={showAvailableOnly}
              onCheckedChange={setShowAvailableOnly}
            />
          </div>

          {/* Date Selection with Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Available time</h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">{format(selectedDate, "yyyy-MM-dd")}</span>
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {dates.map((date) => (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center px-4 py-2 rounded-xl min-w-[60px] transition-all ${
                    format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="text-lg font-bold">{format(date, "d")}</span>
                  <span className="text-xs">{format(date, "MMM")}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Courts Availability Legend */}
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-foreground">Courts Availability</span>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-muted-foreground">Unavailable</span>
            </div>
          </div>

          {/* Time Slots Grid */}
          <div className="grid grid-cols-3 gap-2">
            {displayedSlots.map((slot) => (
              <SlotCard
                key={slot.start_time}
                slot={slot}
                isSelected={selectedSlots.includes(slot.start_time)}
                onSelect={() => slot.status !== "full" && slot.status !== "blocked" && toggleSlot(slot.start_time)}
              />
            ))}
          </div>

          {/* Player Count */}
          <div className="space-y-3 pt-2">
            <h3 className="font-medium text-foreground">
              {visibility === "public" ? "Maximum Players Required" : "Number of Players"}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPlayerCount(Math.max(1, playerCount - 1))}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-bold text-foreground w-8 text-center">{playerCount}</span>
                <button
                  onClick={() => setPlayerCount(Math.min(10, playerCount + 1))}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                {visibility === "public" ? (
                  <span className="text-sm">Current: 1/{playerCount + 1}</span>
                ) : (
                  <span className="text-sm">{playerCount} players</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Proceed Button */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-background border-t border-border">
          <Button
            onClick={onProceed}
            disabled={selectedSlots.length === 0}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 disabled:opacity-50"
          >
            Proceed
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SlotSelectionSheet;
