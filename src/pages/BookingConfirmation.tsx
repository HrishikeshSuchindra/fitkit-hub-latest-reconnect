import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Calendar, Clock, MapPin, Plus, ChevronRight, Star, Phone, HelpCircle, Gift, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import recoverySpa from "@/assets/recovery-spa.jpg";
import recoveryPhysio from "@/assets/recovery-physio.jpg";

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state;
  const { user } = useAuth();
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  if (!bookingData) {
    navigate("/venues/courts");
    return null;
  }

  const { venue, selectedSlots, selectedDate, totalAmount, bookingId: passedBookingId } = bookingData;
  const bookingId = passedBookingId || `#BKA-${Math.floor(10000 + Math.random() * 90000)}`;
  const formattedDate = format(new Date(selectedDate), "EEEE, MMM do");
  const timeRange = selectedSlots.length > 0 
    ? `${selectedSlots[0].split("-")[0]} - ${selectedSlots[selectedSlots.length - 1].split("-")[1]}`
    : "";

  const recoveryServices = [
    {
      id: 1,
      name: "Post-Game Ice Bath",
      description: "20-min recovery session right after your game",
      price: 25,
      image: recoverySpa,
    },
    {
      id: 2,
      name: "Sports Massage",
      description: "30-min deep tissue massage with certified therapist",
      price: 60,
      image: recoveryPhysio,
    },
  ];

  const featuredEvents = [
    {
      id: 1,
      name: "Post-Game Ice Bath",
      description: "20-min recovery session right after your game",
      price: 25,
      image: recoverySpa,
    },
    {
      id: 2,
      name: "Sports Massage",
      description: "30-min deep tissue massage with certified therapist",
      price: 60,
      image: recoveryPhysio,
    },
  ];

  const faqs = [
    {
      question: "How do I cancel or reschedule my booking?",
      answer: "You can cancel or reschedule your booking up to 2 hours before your slot time. Go to My Bookings in your profile, select the booking, and choose Cancel or Reschedule. Refunds are processed within 3-5 business days."
    },
    {
      question: "What should I bring to my session?",
      answer: "Please bring appropriate sportswear, indoor shoes (for indoor courts), a water bottle, and a towel. Equipment rental is available at most venues if needed."
    },
    {
      question: "Can I invite friends to join my booking?",
      answer: "Yes! You can share your booking details with friends. If you need additional players, check the 'Find Players' feature in the Social tab to connect with others."
    },
    {
      question: "What if I'm running late?",
      answer: "Please arrive 10-15 minutes before your slot. If you're running late, contact the venue directly. Your booking time won't be extended for late arrivals."
    }
  ];

  const handleViewBooking = () => {
    navigate("/social/profile", { state: { scrollToBookings: true } });
  };

  const handleAddToCalendar = () => {
    const startDate = new Date(selectedDate);
    const startTime = selectedSlots[0]?.split("-")[0] || "09:00";
    const [hours, minutes] = startTime.split(":");
    startDate.setHours(parseInt(hours), parseInt(minutes));
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 60);
    
    const event = {
      title: `${venue.sport || "Sports"} at ${venue.name}`,
      description: `Booking ID: ${bookingId}`,
      location: venue.address,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    };
    
    // Generate Google Calendar URL
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}&dates=${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`;
    
    window.open(googleUrl, '_blank');
    toast.success("Opening calendar...");
  };

  const handleDirections = () => {
    const address = encodeURIComponent(venue.address || venue.name);
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  const handleContactSupport = () => {
    navigate("/contact");
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Please sign in to leave a review");
      return;
    }

    setSubmittingReview(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        venue_id: venue.id || venue.slug,
        rating: rating,
        comment: reviewText,
      });

      if (error) throw error;

      toast.success("Thanks for your review!");
      setShowReviewDialog(false);
      setReviewText("");
      setRating(5);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-background px-5 py-4 flex items-center justify-between border-b border-border">
        <button onClick={() => navigate("/")} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Booking Details</h1>
        <div className="w-9" />
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Success Card */}
        <Card className="p-6 shadow-md border-0 bg-card">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-brand-green flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Booking Confirmed!</h2>
            <p className="text-text-secondary mt-1">Your {venue.sport || "Sports"} session is secured</p>
          </div>
        </Card>

        {/* Booking Details Card */}
        <Card className="p-4 space-y-4 shadow-md border-0 bg-card">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Booking ID</span>
            <span className="font-semibold text-brand-green">{bookingId}</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                <span className="text-brand-green text-lg">🎾</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{venue.sport || "Sports"} Court</p>
                <p className="text-xs text-text-secondary">Premium Indoor Court</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{formattedDate}</p>
                <p className="text-xs text-text-secondary">{timeRange}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{venue.name}</p>
                <p className="text-xs text-text-secondary">{venue.address}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card className="p-4 shadow-md border-0 bg-card">
          <Button 
            variant="outline" 
            className="w-full border-foreground text-foreground"
            onClick={handleViewBooking}
          >
            View Booking
          </Button>

          <div className="flex gap-3 mt-3">
            <button 
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
              onClick={handleAddToCalendar}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add to Calendar</span>
            </button>
            <button 
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
              onClick={handleDirections}
            >
              <Navigation className="w-4 h-4" />
              <span className="text-sm font-medium">Directions</span>
            </button>
          </div>
        </Card>

        {/* Prep & Recovery */}
        <Card className="p-4 space-y-3 shadow-md border-0 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏃</span>
              <h3 className="font-semibold text-foreground">Prep & Recovery</h3>
            </div>
            <button 
              className="text-brand-green text-sm font-medium"
              onClick={() => navigate("/venues/recovery")}
            >
              View All
            </button>
          </div>
          <p className="text-sm text-text-secondary">Pre-book your recovery now.</p>

          <div className="space-y-3">
            {recoveryServices.map((service) => (
              <div key={service.id} className="flex gap-3 bg-muted rounded-xl p-3">
                <img 
                  src={service.image} 
                  alt={service.name} 
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm">{service.name}</h4>
                  <p className="text-xs text-text-secondary mt-1">{service.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-brand-green font-semibold">${service.price}</span>
                    <Button 
                      size="sm" 
                      className="h-7 text-xs bg-primary text-white hover:bg-primary/90"
                      onClick={() => navigate("/venues/recovery")}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Featured Events */}
        <Card className="p-4 space-y-3 shadow-md border-0 bg-card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Featured Events</h3>
            <button 
              className="text-brand-green text-sm font-medium"
              onClick={() => navigate("/social")}
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {featuredEvents.map((event) => (
              <div key={event.id} className="flex gap-3 bg-muted rounded-xl p-3">
                <img 
                  src={event.image} 
                  alt={event.name} 
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm">{event.name}</h4>
                  <p className="text-xs text-text-secondary mt-1">{event.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-brand-green font-semibold">${event.price}</span>
                    <Button 
                      size="sm" 
                      className="h-7 text-xs bg-primary text-white hover:bg-primary/90"
                      onClick={() => navigate("/social")}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Need Help - Functional with FAQs */}
        <Card className="p-4 shadow-md border-0 bg-card">
          <h3 className="font-semibold text-foreground mb-3">Need Help?</h3>
          
          <button 
            className="w-full flex items-center justify-between py-3 border-b border-border"
            onClick={handleContactSupport}
          >
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-text-secondary" />
              <span className="text-foreground">Contact Support</span>
            </div>
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          </button>
          
          <div className="mt-3">
            <div className="flex items-center gap-3 mb-3">
              <HelpCircle className="w-4 h-4 text-text-secondary" />
              <span className="text-foreground font-medium">FAQs</span>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-sm text-left py-3">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-text-secondary">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Card>

        {/* Share the Love */}
        <Card className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 space-y-2 shadow-md border-0">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-foreground">Share the Love!</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Refer a friend and get 20% off your next booking
          </p>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white mt-2">
            Refer Now
          </Button>
        </Card>

        {/* Reviews */}
        <Card className="p-4 space-y-3 shadow-md border-0 bg-card">
          <h3 className="font-semibold text-foreground">What people say about {venue.name}</h3>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-4 h-4 ${star <= 4 ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/50 text-yellow-400/50"}`} 
                />
              ))}
            </div>
            <span className="font-semibold text-foreground">4.8/5</span>
            <span className="text-text-secondary text-sm">(1234 reviews)</span>
          </div>
          <p className="text-sm text-text-secondary italic">
            "Amazing courts and facilities! The staff is super friendly and the equipment is top-notch."
          </p>
          <Button 
            variant="outline" 
            className="w-full border-primary text-primary"
            onClick={() => setShowReviewDialog(true)}
          >
            Leave a Review
          </Button>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Leave a Review for {venue.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Your Rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-3xl transition-transform ${
                      star <= rating ? "text-yellow-500 scale-110" : "text-muted-foreground"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Share your experience with this venue..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="bg-muted border-0 min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview} 
              disabled={submittingReview} 
              className="bg-primary text-white"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingConfirmation;
