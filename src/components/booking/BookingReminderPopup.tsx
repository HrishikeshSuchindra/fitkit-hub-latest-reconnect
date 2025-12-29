import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, CalendarClock } from "lucide-react";
import { isToday, isTomorrow, parseISO, differenceInHours, parse, isAfter, isBefore, addHours } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Booking {
  id: string;
  venue_name: string;
  venue_image: string | null;
  sport: string | null;
  slot_date: string;
  slot_time: string;
  status: string;
}

export const BookingReminderPopup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkUpcomingBookings = async () => {
      if (!user) {
        setUpcomingBooking(null);
        return;
      }

      const sessionDismissed = sessionStorage.getItem("reminderDismissedThisSession");
      if (sessionDismissed) {
        setDismissed(true);
        return;
      }

      try {
        const now = new Date();
        const next24Hours = addHours(now, 24);

        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('id, venue_name, venue_image, sport, slot_date, slot_time, status')
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .gte('slot_date', now.toISOString().split('T')[0])
          .lte('slot_date', next24Hours.toISOString().split('T')[0])
          .order('slot_date', { ascending: true })
          .order('slot_time', { ascending: true })
          .limit(1);

        if (error) throw error;

        if (bookings && bookings.length > 0) {
          // Check if the booking is within 24 hours
          const booking = bookings[0];
          const bookingDate = parseISO(booking.slot_date);
          const [hours] = booking.slot_time.split(':').map(Number);
          bookingDate.setHours(hours, 0, 0, 0);

          const hoursUntilBooking = differenceInHours(bookingDate, now);
          
          if (hoursUntilBooking >= 0 && hoursUntilBooking <= 24) {
            setUpcomingBooking(booking);
          } else {
            setUpcomingBooking(null);
          }
        } else {
          setUpcomingBooking(null);
        }
      } catch (error) {
        console.error('Error fetching upcoming bookings:', error);
      }
    };

    checkUpcomingBookings();
    // Check every minute
    const interval = setInterval(checkUpcomingBookings, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleDismiss = () => {
    sessionStorage.setItem("reminderDismissedThisSession", "true");
    setDismissed(true);
  };

  const handleViewBooking = () => {
    navigate('/profile/bookings');
  };

  const getTimeLabel = () => {
    if (!upcomingBooking) return '';
    const bookingDate = parseISO(upcomingBooking.slot_date);
    if (isToday(bookingDate)) return "Today";
    if (isTomorrow(bookingDate)) return "Tomorrow";
    return "Upcoming";
  };

  if (!upcomingBooking || dismissed) return null;

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
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-brand-green/10 flex items-center justify-center flex-shrink-0">
            <CalendarClock className="w-7 h-7 text-brand-green" />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-xs text-brand-green font-medium">{getTimeLabel()}'s Booking</p>
            <p className="font-semibold text-foreground truncate">{upcomingBooking.sport || 'Sports'}</p>
            <p className="text-sm text-text-secondary truncate">{upcomingBooking.venue_name}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {upcomingBooking.slot_time}
            </p>
          </div>
          
          <Button 
            onClick={handleViewBooking}
            className="bg-brand-green hover:bg-brand-green/90 text-white rounded-xl px-4 h-10 flex-shrink-0 self-center"
          >
            View
          </Button>
        </div>
      </div>
    </div>
  );
};
