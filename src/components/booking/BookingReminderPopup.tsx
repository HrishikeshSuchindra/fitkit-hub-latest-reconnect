import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { isToday, parseISO } from "date-fns";

interface Booking {
  id: string;
  venue: string;
  venueImage?: string;
  sport: string;
  date: string;
  time: string;
  rawDate: string;
  visibility?: "public" | "friends";
  playerCount?: number;
  totalAmount?: number;
}

export const BookingReminderPopup = () => {
  const navigate = useNavigate();
  const [todayBooking, setTodayBooking] = useState<Booking | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkTodayBookings = () => {
      const bookings = JSON.parse(localStorage.getItem("userBookings") || "[]");
      const sessionDismissed = sessionStorage.getItem("reminderDismissedThisSession");
      
      if (sessionDismissed) {
        setDismissed(true);
        return;
      }
      
      const todayBookingFound = bookings.find((booking: Booking) => {
        try {
          const bookingDate = parseISO(booking.rawDate);
          return isToday(bookingDate);
        } catch {
          return false;
        }
      });
      
      setTodayBooking(todayBookingFound || null);
    };

    checkTodayBookings();
    // Check every minute
    const interval = setInterval(checkTodayBookings, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("reminderDismissedThisSession", "true");
    setDismissed(true);
  };

  const handleViewBooking = () => {
    if (todayBooking) {
      navigate("/booking/confirmation", { 
        state: { 
          bookingId: todayBooking.id,
          venue: {
            name: todayBooking.venue,
            image: todayBooking.venueImage,
          },
          selectedSlots: [todayBooking.time],
          selectedDate: todayBooking.rawDate,
          visibility: todayBooking.visibility || "public",
          playerCount: todayBooking.playerCount || 4,
          totalAmount: todayBooking.totalAmount || 0,
        } 
      });
    }
  };

  if (!todayBooking || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-background rounded-2xl shadow-strong border border-border overflow-hidden">
        {/* Close button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
        
        <div className="flex gap-3 p-3">
          {/* Venue Image */}
          {todayBooking.venueImage && (
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <img 
                src={todayBooking.venueImage} 
                alt={todayBooking.venue}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <p className="text-xs text-brand-green font-medium">Today's Booking</p>
              <p className="font-semibold text-foreground truncate">{todayBooking.sport}</p>
              <p className="text-sm text-text-secondary truncate">{todayBooking.venue}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {todayBooking.time}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleViewBooking}
            className="bg-brand-green hover:bg-brand-green/90 text-white rounded-xl px-4 h-10 flex-shrink-0 self-center"
          >
            View Booking
          </Button>
        </div>
      </div>
    </div>
  );
};
