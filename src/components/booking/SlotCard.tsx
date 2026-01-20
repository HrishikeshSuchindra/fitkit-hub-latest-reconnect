import { cn } from "@/lib/utils";

export interface SlotData {
  start_time: string;
  duration_minutes: number;
  price: number;
  total_courts: number;
  booked_courts: number;
  available_courts: number;
  status: "available" | "limited" | "full" | "blocked";
  blockReason?: string | null;
}

interface SlotCardProps {
  slot: SlotData;
  isSelected: boolean;
  onSelect: () => void;
}

const SlotCard = ({ slot, isSelected, onSelect }: SlotCardProps) => {
  const isFullyBooked = slot.status === "full";
  const isBlocked = slot.status === "blocked";
  const isUnavailable = isFullyBooked || isBlocked;

  // Format time to display format (e.g., "07:30 AM")
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  // Generate availability circles
  const renderAvailabilityCircles = () => {
    const circles = [];
    for (let i = 0; i < slot.total_courts; i++) {
      const isAvailable = i < slot.available_courts;
      circles.push(
        <div
          key={i}
          className={cn(
            "w-2.5 h-2.5 rounded-full",
            isUnavailable
              ? "bg-muted-foreground/30"
              : isAvailable
              ? "bg-primary"
              : "bg-muted-foreground/30"
          )}
        />
      );
    }
    return circles;
  };

  return (
    <button
      onClick={onSelect}
      disabled={isUnavailable}
      aria-label={`${formatTime(slot.start_time)}, ${slot.duration_minutes} minutes, ${slot.available_courts} of ${slot.total_courts} courts available, ₹${slot.price}, ${slot.status}${isBlocked && slot.blockReason ? ` - ${slot.blockReason}` : ''}`}
      className={cn(
        "flex flex-col items-center px-2 py-2.5 rounded-xl border-2 transition-all w-full aspect-[4/3]",
        isUnavailable
          ? "bg-muted border-muted cursor-not-allowed opacity-60"
          : isSelected
          ? "bg-[hsl(var(--chip-green-bg))] border-primary shadow-md scale-[1.02]"
          : "bg-[hsl(var(--chip-green-bg))] border-transparent hover:border-primary/50"
      )}
    >
      {/* Time and Duration - single line */}
      <p className={cn(
        "text-[10px] font-semibold leading-tight text-center whitespace-nowrap",
        isUnavailable ? "text-muted-foreground" : "text-foreground"
      )}>
        {formatTime(slot.start_time)} • {slot.duration_minutes}m
      </p>

      {/* Availability Circles */}
      <div className="flex items-center gap-1 my-1.5">
        {renderAvailabilityCircles()}
      </div>

      {/* Availability Fraction or Blocked indicator */}
      <p className={cn(
        "text-xs font-bold",
        isUnavailable ? "text-muted-foreground" : "text-primary"
      )}>
        {isBlocked ? "Blocked" : `${slot.available_courts}/${slot.total_courts}`}
      </p>

      {/* Price */}
      <div className={cn(
        "w-full py-1 rounded-lg text-center mt-auto",
        isUnavailable
          ? "bg-muted"
          : "bg-[hsl(var(--brand-primary-soft)/0.3)]"
      )}>
        <p className={cn(
          "text-xs font-bold",
          isUnavailable ? "text-muted-foreground" : "text-foreground"
        )}>
          ₹{slot.price.toFixed(2)}
        </p>
      </div>
    </button>
  );
};

export default SlotCard;
