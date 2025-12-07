import { SlotData } from "@/components/booking/SlotCard";

interface TurfConfig {
  open_time: string; // "07:00"
  close_time: string; // "19:00"
  slot_duration: number; // minutes
  buffer_between_slots?: number; // minutes
  total_courts: number;
  base_price: number;
  peak_price?: number;
  peak_hours?: { start: number; end: number }[];
}

// Parse time string to minutes from midnight
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Convert minutes from midnight to time string
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

// Check if a time is in peak hours
const isPeakHour = (hour: number, peakHours?: { start: number; end: number }[]): boolean => {
  if (!peakHours) return false;
  return peakHours.some(peak => hour >= peak.start && hour < peak.end);
};

// Generate random availability for demo purposes
const generateRandomAvailability = (totalCourts: number): { booked: number; available: number } => {
  // Add some randomness - sometimes fully booked, sometimes partially
  const random = Math.random();
  let booked: number;
  
  if (random < 0.1) {
    // 10% chance fully booked
    booked = totalCourts;
  } else if (random < 0.3) {
    // 20% chance only 1 available
    booked = totalCourts - 1;
  } else {
    // 70% chance some availability
    booked = Math.floor(Math.random() * (totalCourts - 1));
  }
  
  return {
    booked,
    available: totalCourts - booked
  };
};

// Get status based on availability
const getStatus = (available: number, total: number): "available" | "limited" | "full" => {
  if (available === 0) return "full";
  if (available <= 1) return "limited";
  return "available";
};

export const generateTimeSlots = (config: TurfConfig): SlotData[] => {
  const {
    open_time,
    close_time,
    slot_duration,
    buffer_between_slots = 0,
    total_courts,
    base_price,
    peak_price,
    peak_hours
  } = config;

  const slots: SlotData[] = [];
  const startMinutes = timeToMinutes(open_time);
  const endMinutes = timeToMinutes(close_time);
  const slotStep = slot_duration + buffer_between_slots;

  let currentMinutes = startMinutes;

  while (currentMinutes + slot_duration <= endMinutes) {
    const timeString = minutesToTime(currentMinutes);
    const hour = Math.floor(currentMinutes / 60);
    const { booked, available } = generateRandomAvailability(total_courts);
    
    // Determine price based on peak hours
    const price = isPeakHour(hour, peak_hours) ? (peak_price || base_price) : base_price;

    slots.push({
      start_time: timeString,
      duration_minutes: slot_duration,
      price,
      total_courts,
      booked_courts: booked,
      available_courts: available,
      status: getStatus(available, total_courts)
    });

    currentMinutes += slotStep;
  }

  return slots;
};

// Default turf configuration
export const defaultTurfConfig: TurfConfig = {
  open_time: "07:00",
  close_time: "19:00",
  slot_duration: 30,
  buffer_between_slots: 0,
  total_courts: 3,
  base_price: 750,
  peak_price: 600,
  peak_hours: [
    { start: 12, end: 15 } // Afternoon off-peak with lower price
  ]
};

// Preset configurations for different venues
export const venueConfigs: Record<string, TurfConfig> = {
  football: {
    open_time: "06:00",
    close_time: "22:00",
    slot_duration: 60,
    total_courts: 2,
    base_price: 1500,
    peak_price: 2000,
    peak_hours: [{ start: 18, end: 22 }]
  },
  badminton: {
    open_time: "07:00",
    close_time: "21:00",
    slot_duration: 30,
    total_courts: 4,
    base_price: 400,
    peak_price: 500,
    peak_hours: [{ start: 18, end: 21 }]
  },
  cricket: {
    open_time: "06:00",
    close_time: "18:00",
    slot_duration: 120,
    total_courts: 1,
    base_price: 3000,
  },
  tennis: {
    open_time: "06:00",
    close_time: "20:00",
    slot_duration: 60,
    total_courts: 2,
    base_price: 800,
    peak_price: 1000,
    peak_hours: [{ start: 17, end: 20 }]
  }
};
