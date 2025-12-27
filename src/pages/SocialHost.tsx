import { useState, useRef } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Clock, Users, ImagePlus, Send, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useStorage } from "@/hooks/useStorage";
import { supabase } from "@/integrations/supabase/client";

const SocialHost = () => {
  const { user } = useAuth();
  const { uploadEventImage, uploading } = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to storage
    const url = await uploadEventImage(file);
    if (url) {
      setImageUrl(url);
      toast.success("Image uploaded!");
    } else {
      toast.error("Failed to upload image");
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.time || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user?.id)
        .single();

      // Send approval request email
      const { error } = await supabase.functions.invoke("send-host-approval-request", {
        body: {
          ...formData,
          imageUrl: imageUrl,
          hostName: profile?.display_name || user?.email?.split("@")[0] || "Unknown",
          hostEmail: user?.email || "",
        },
      });

      if (error) throw error;

      toast.success("Host request submitted!", {
        description: "We'll review your event and get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        title: "",
        category: "fitdates",
        description: "",
        date: "",
        time: "",
        location: "",
        maxParticipants: "",
        price: "",
      });
      setImagePreview(null);
      setImageUrl(null);
    } catch (error) {
      console.error("Error submitting host request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Morning Yoga & Brunch"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-muted border-0"
              required
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
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
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
              <Label htmlFor="date">Date *</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-muted border-0 pl-10"
                  required
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <div className="relative">
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="bg-muted border-0 pl-10"
                  required
                />
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <div className="relative">
              <Input
                id="location"
                placeholder="Venue name & address"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-muted border-0 pl-10"
                required
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={imagePreview} alt="Event preview" className="w-full h-48 object-cover" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 rounded-full w-8 h-8"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Tap to upload event image</p>
                <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>
          
          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 h-12"
            disabled={submitting || uploading}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Host Request
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            By submitting, you agree to our event hosting guidelines and terms of service.
          </p>
        </form>
      </div>
      
      <BottomNav mode="social" />
    </div>
  );
};

export default SocialHost;
