import { cn } from "@/lib/utils";

export interface SlotData {
  start_time: string;
  duration_minutes: number;
  price: number;
  total_courts: number;
  booked_courts: number;
  available_courts: number;
  status: "available" | "limited" | "full";
}

interface SlotCardProps {
  slot: SlotData;
  isSelected: boolean;
  onSelect: () => void;
}

const SlotCard = ({ slot, isSelected, onSelect }: SlotCardProps) => {
  const isFullyBooked = slot.status === "full";

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
            isFullyBooked
              ? "bg-gray-300"
              : isAvailable
              ? "bg-primary"
              : "bg-gray-300"
          )}
        />
      );
    }
    return circles;
  };

  return (
    <button
      onClick={onSelect}
      disabled={isFullyBooked}
      aria-label={`${formatTime(slot.start_time)}, ${slot.duration_minutes} minutes, ${slot.available_courts} of ${slot.total_courts} courts available, ₹${slot.price}, ${slot.status}`}
      className={cn(
        "flex flex-col items-center px-2 py-2.5 rounded-xl border-2 transition-all w-full aspect-[4/3]",
        isFullyBooked
          ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60"
          : isSelected
          ? "bg-[hsl(var(--chip-green-bg))] border-primary shadow-md scale-[1.02]"
          : "bg-[hsl(var(--chip-green-bg))] border-transparent hover:border-primary/50"
      )}
    >
      {/* Time and Duration */}
      <p className={cn(
        "text-[10px] font-semibold leading-tight text-center",
        isFullyBooked ? "text-gray-400" : "text-foreground"
      )}>
        {formatTime(slot.start_time)} | {slot.duration_minutes} mins
      </p>

      {/* Availability Circles */}
      <div className="flex items-center gap-1 my-1.5">
        {renderAvailabilityCircles()}
      </div>

      {/* Availability Fraction */}
      <p className={cn(
        "text-xs font-bold",
        isFullyBooked ? "text-gray-400" : "text-primary"
      )}>
        {slot.available_courts}/{slot.total_courts}
      </p>

      {/* Price */}
      <div className={cn(
        "w-full py-1 rounded-lg text-center mt-auto",
        isFullyBooked
          ? "bg-gray-200"
          : "bg-[hsl(var(--brand-primary-soft)/0.3)]"
      )}>
        <p className={cn(
          "text-xs font-bold",
          isFullyBooked ? "text-gray-400" : "text-foreground"
        )}>
          ₹{slot.price.toFixed(2)}
        </p>
      </div>
    </button>
  );
};

export default SlotCard;
