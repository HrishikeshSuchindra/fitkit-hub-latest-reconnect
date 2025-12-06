import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format, isToday, parseISO } from "date-fns";

interface Booking {
  id: string;
  venue: string;
  sport: string;
  date: string;
  time: string;
  rawDate: string;
}

export const BookingReminderPopup = () => {
  const navigate = useNavigate();
  const [todayBooking, setTodayBooking] = useState<Booking | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkTodayBookings = () => {
      const bookings = JSON.parse(localStorage.getItem("userBookings") || "[]");
      const dismissedBookings = JSON.parse(localStorage.getItem("dismissedReminders") || "[]");
      
      const todayBookingFound = bookings.find((booking: Booking) => {
        if (dismissedBookings.includes(booking.id)) return false;
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
    if (todayBooking) {
      const dismissedBookings = JSON.parse(localStorage.getItem("dismissedReminders") || "[]");
      dismissedBookings.push(todayBooking.id);
      localStorage.setItem("dismissedReminders", JSON.stringify(dismissedBookings));
    }
    setDismissed(true);
  };

  const handleViewBooking = () => {
    navigate("/social/profile", { state: { scrollToBookings: true } });
  };

  if (!todayBooking || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-background rounded-2xl shadow-strong border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-secondary font-medium">Upcoming Booking:</p>
            <p className="font-semibold text-foreground truncate">{todayBooking.sport}</p>
            <p className="text-sm text-text-secondary">
              {todayBooking.date} {todayBooking.time}
            </p>
          </div>
          <Button 
            onClick={handleViewBooking}
            className="bg-brand-green hover:bg-brand-green/90 text-white rounded-xl px-4 h-10 flex-shrink-0"
          >
            View Booking
          </Button>
        </div>
      </div>
    </div>
  );
};
