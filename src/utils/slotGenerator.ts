import { SlotData } from "@/components/booking/SlotCard";
import { format } from "date-fns";

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

interface VenueData {
  opening_time?: string | null;
  closing_time?: string | null;
  total_courts?: number | null;
  price_per_hour?: number | null;
  price?: number | null;
  min_booking_duration?: number | null;
  peak_price?: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  peak_hours?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  day_schedules?: any;
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
const isPeakHour = (hour: number, peakHours?: { start: number; end: number }[] | null): boolean => {
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

export const generateTimeSlots = (
  config: TurfConfig, 
  bookedCounts?: Record<string, number>
): SlotData[] => {
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
    
    // Use real booked counts if available, otherwise generate random for demo
    const bookedFromDb = bookedCounts?.[timeString] || 0;
    const booked = bookedCounts ? bookedFromDb : generateRandomAvailability(total_courts).booked;
    const available = Math.max(0, total_courts - booked);
    
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

// Generate slots using venue data from database
export const generateVenueSlots = (
  venue: VenueData,
  selectedDate: Date,
  bookedCounts?: Record<string, number>
): SlotData[] => {
  // Check if venue is open on this day using day_schedules
  const dayKey = format(selectedDate, 'EEE').toLowerCase();
  const daySchedules = venue.day_schedules as Record<string, { enabled: boolean; open: string; close: string }> | null | undefined;
  const daySchedule = daySchedules?.[dayKey];
  
  // If day_schedules exists and this day is disabled, return empty
  if (daySchedule && !daySchedule.enabled) {
    return [];
  }
  
  // Parse peak_hours if it's a valid array
  const peakHours = Array.isArray(venue.peak_hours) ? venue.peak_hours as { start: number; end: number }[] : undefined;
  
  // Build config from venue data
  const config: TurfConfig = {
    open_time: daySchedule?.open || venue.opening_time || "06:00",
    close_time: daySchedule?.close || venue.closing_time || "22:00",
    slot_duration: venue.min_booking_duration || 30,
    total_courts: venue.total_courts || 1,
    base_price: venue.price_per_hour || venue.price || 500,
    peak_price: venue.peak_price || undefined,
    peak_hours: peakHours,
  };
  
  return generateTimeSlots(config, bookedCounts);
};

// Default turf configuration (kept for backwards compatibility)
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

// Preset configurations for different venues (kept for backwards compatibility)
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
