import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Clock, Users, ImagePlus, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SocialHost = () => {
  const [formData, setFormData] = useState({
    title: "",
    category: "fitdates",
    description: "",
    date: "",
    time: "",
    location: "",
    maxParticipants: "",
    price: "",
  });

  const categories = [
    { id: "fitdates", label: "FitDates" },
    { id: "coffee", label: "Coffee Raves" },
    { id: "wellness", label: "Wellness Retreats" },
    { id: "social", label: "Social Sports" },
    { id: "other", label: "Other" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Host request submitted!", {
      description: "We'll review your event and get back to you within 24 hours."
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Host an Event</h1>
          <p className="text-sm text-text-secondary">Submit a request to host your own social event</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              placeholder="e.g., Morning Yoga & Brunch"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-muted border-0"
            />
          </div>
          
          {/* Category */}
          <div className="space-y-2">
            <Label>Event Category</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.category === cat.id
                      ? "bg-brand-green text-white"
                      : "bg-muted text-text-secondary"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your event, what participants can expect..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-muted border-0 min-h-[100px]"
            />
          </div>
          
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-muted border-0 pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <div className="relative">
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="bg-muted border-0 pl-10"
                />
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              </div>
            </div>
          </div>
          
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <Input
                id="location"
                placeholder="Venue name & address"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-muted border-0 pl-10"
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            </div>
          </div>
          
          {/* Participants & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="participants">Max Participants</Label>
              <div className="relative">
                <Input
                  id="participants"
                  type="number"
                  placeholder="e.g., 20"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  className="bg-muted border-0 pl-10"
                />
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price per Person</Label>
              <Input
                id="price"
                placeholder="₹299 or Free"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="bg-muted border-0"
              />
            </div>
          </div>
          
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Event Image</Label>
            <div className="border-2 border-dashed border-divider rounded-xl p-6 flex flex-col items-center justify-center">
              <ImagePlus className="w-8 h-8 text-text-secondary mb-2" />
              <p className="text-sm text-text-secondary">Tap to upload event image</p>
              <p className="text-xs text-text-tertiary">JPG, PNG up to 5MB</p>
            </div>
          </div>
          
          {/* Submit */}
          <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green/90 text-white h-12">
            <Send className="w-4 h-4 mr-2" /> Submit Host Request
          </Button>
          
          <p className="text-xs text-text-tertiary text-center">
            By submitting, you agree to our event hosting guidelines and terms of service.
          </p>
        </form>
      </div>
      
      <BottomNav mode="social" />
    </div>
  );
};

export default SocialHost;