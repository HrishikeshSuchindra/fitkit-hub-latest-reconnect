import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, Share2, Heart, CheckCircle2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const SocialEventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Mock event data - in real app, fetch by eventId
  const event = {
    id: eventId,
    title: "Sunset Yoga & Coffee",
    description: "Join us for a relaxing sunset yoga session followed by artisanal coffee and meaningful conversations. Perfect for fitness enthusiasts looking to connect with like-minded people in a peaceful setting.",
    date: "Dec 20, 2024",
    time: "5:00 PM - 7:00 PM",
    location: "Bandstand Promenade, Bandra",
    spots: { current: 8, total: 12 },
    price: "₹299",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
    host: {
      name: "FitKits Official",
      avatar: "FK",
      events: 24
    },
    includes: ["Yoga mat provided", "Artisanal coffee", "Light snacks", "Photo session"],
    attendees: [
      { name: "Priya", avatar: "P" },
      { name: "Rahul", avatar: "R" },
      { name: "Sneha", avatar: "S" },
      { name: "Amit", avatar: "A" },
    ]
  };

  const handleRegister = () => {
    setIsRegistered(true);
    toast.success("Successfully registered!", {
      description: "You've been added to the event. Check your email for details."
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      
      {/* Hero Image */}
      <div className="relative aspect-video">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-xl font-bold text-white mb-1">{event.title}</h1>
          <p className="text-sm text-white/80">by {event.host.name}</p>
        </div>
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`} />
        </button>
      </div>
      
      <div className="px-5 py-4 space-y-5">
        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Date</p>
              <p className="text-sm font-semibold text-foreground">{event.date}</p>
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Time</p>
              <p className="text-sm font-semibold text-foreground">{event.time}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-brand-green" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-text-secondary">Location</p>
            <p className="text-sm font-semibold text-foreground">{event.location}</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            View Map
          </Button>
        </div>
        
        {/* Description */}
        <div>
          <h3 className="font-bold text-foreground mb-2">About this Event</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{event.description}</p>
        </div>
        
        {/* What's Included */}
        <div>
          <h3 className="font-bold text-foreground mb-2">What's Included</h3>
          <div className="grid grid-cols-2 gap-2">
            {event.includes.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-brand-green" />
                {item}
              </div>
            ))}
          </div>
        </div>
        
        {/* Attendees */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-foreground">Attendees</h3>
            <span className="text-xs text-text-secondary">{event.spots.current}/{event.spots.total} spots filled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {event.attendees.map((attendee, idx) => (
                <div key={idx} className="w-8 h-8 bg-brand-soft rounded-full flex items-center justify-center border-2 border-background">
                  <span className="text-xs font-semibold text-brand-green">{attendee.avatar}</span>
                </div>
              ))}
            </div>
            <span className="text-xs text-text-secondary">+{event.spots.current - event.attendees.length} more</span>
          </div>
        </div>
        
        {/* Host */}
        <div className="bg-card rounded-xl shadow-soft p-4">
          <h3 className="font-bold text-foreground mb-3">Event Host</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{event.host.avatar}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{event.host.name}</p>
              <p className="text-xs text-text-secondary">{event.host.events} events hosted</p>
            </div>
            <Button variant="outline" size="sm">View Profile</Button>
          </div>
        </div>
      </div>
      
      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-divider p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary">Price per person</p>
          <p className="text-xl font-bold text-brand-green">{event.price}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="w-10 h-10">
            <Share2 className="w-4 h-4" />
          </Button>
          {isRegistered ? (
            <Button disabled className="bg-muted text-text-secondary px-6">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Registered
            </Button>
          ) : (
            <Button 
              className="bg-brand-green hover:bg-brand-green/90 text-white px-6"
              onClick={handleRegister}
            >
              Register Now
            </Button>
          )}
        </div>
      </div>
      
      <BottomNav mode="social" />
    </div>
  );
};

export default SocialEventDetail;