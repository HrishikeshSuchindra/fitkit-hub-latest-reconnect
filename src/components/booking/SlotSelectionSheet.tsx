import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, Lock, Minus, Plus } from "lucide-react";
import { format, addDays } from "date-fns";

interface SlotSelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venue: {
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
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const timeSlots = [
    { time: "9:00AM-9:30AM", available: 4 },
    { time: "9:30AM-10:00AM", available: 4 },
    { time: "10:00AM-10:30AM", available: 3 },
    { time: "10:30AM-11:00AM", available: 2 },
    { time: "11:00AM-11:30AM", available: 5 },
    { time: "11:30AM-12:00PM", available: 4 },
    { time: "12:00PM-12:30PM", available: 4 },
    { time: "12:30PM-1:00PM", available: 0 },
    { time: "1:00PM-1:30PM", available: 4 },
    { time: "1:30PM-2:00PM", available: 1 },
    { time: "2:00PM-2:30PM", available: 2 },
    { time: "2:30PM-3:00PM", available: 4 },
    { time: "3:00PM-3:30PM", available: 0 },
    { time: "3:30PM-4:00PM", available: 4 },
    { time: "4:00PM-4:30PM", available: 4 },
  ];

  const toggleSlot = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <div className="p-5 space-y-5 overflow-y-auto h-full pb-24">
          {/* Venue Name */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">{venue.name}</h2>
            <Badge variant="outline" className="text-brand-green border-brand-green text-xs mt-1">
              Verified
            </Badge>
          </div>

          {/* Visibility Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setVisibility("public")}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${
                visibility === "public"
                  ? "border-brand-green bg-brand-green/5"
                  : "border-border"
              }`}
            >
              <Globe className={`w-6 h-6 ${visibility === "public" ? "text-brand-green" : "text-text-secondary"}`} />
              <div className="text-center">
                <p className={`font-medium ${visibility === "public" ? "text-brand-green" : "text-foreground"}`}>
                  Public
                </p>
                <p className="text-xs text-text-secondary">Anyone can find and join</p>
              </div>
            </button>
            <button
              onClick={() => setVisibility("friends")}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${
                visibility === "friends"
                  ? "border-brand-green bg-brand-green/5"
                  : "border-border"
              }`}
            >
              <Lock className={`w-6 h-6 ${visibility === "friends" ? "text-brand-green" : "text-text-secondary"}`} />
              <div className="text-center">
                <p className={`font-medium ${visibility === "friends" ? "text-brand-green" : "text-foreground"}`}>
                  Friends Only
                </p>
                <p className="text-xs text-text-secondary">Only your friends can see</p>
              </div>
            </button>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Select Date</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {dates.map((date) => (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center px-4 py-2 rounded-xl min-w-[60px] transition-colors ${
                    format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
                      ? "bg-brand-green text-white"
                      : "bg-muted text-text-secondary"
                  }`}
                >
                  <span className="text-lg font-bold">{format(date, "d")}</span>
                  <span className="text-xs">{format(date, "MMM")}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Select Slot</h3>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => {
                const isBooked = slot.available === 0;
                const isSelected = selectedSlots.includes(slot.time);
                
                return (
                  <button
                    key={slot.time}
                    onClick={() => !isBooked && toggleSlot(slot.time)}
                    disabled={isBooked}
                    className={`p-2 rounded-lg text-center transition-colors ${
                      isBooked
                        ? "bg-red-100 text-red-500 cursor-not-allowed"
                        : isSelected
                        ? "bg-brand-green text-white"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <p className="text-xs font-medium">{slot.time}</p>
                    <p className="text-[10px] mt-0.5">
                      {isBooked ? "Booked" : `${slot.available} left`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player Count */}
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Maximum Players Required</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPlayerCount(Math.max(1, playerCount - 1))}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-bold text-foreground w-8 text-center">{playerCount}</span>
                <button
                  onClick={() => setPlayerCount(Math.min(10, playerCount + 1))}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Users className="w-4 h-4" />
                <span className="text-sm">Current: 1/4</span>
                <span className="text-xs">(You + {playerCount} players)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proceed Button */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-background border-t border-border">
          <Button
            onClick={onProceed}
            disabled={selectedSlots.length === 0}
            className="w-full bg-brand-green hover:bg-brand-green/90 text-white h-12 disabled:opacity-50"
          >
            Proceed
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SlotSelectionSheet;
