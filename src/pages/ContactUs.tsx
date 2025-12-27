import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Phone, Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const ContactUs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    message: "",
    email: user?.email || "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.category || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success("Message sent! We'll get back to you within 24 hours.");
    setSubmitting(false);
    navigate(-1);
  };

  const handleCall = () => {
    window.location.href = "tel:+919876543210";
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 pt-12 pb-8 px-5">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 text-primary-foreground hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-primary-foreground" />
          <h1 className="text-2xl font-bold text-primary-foreground">Contact Us</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">We're here to help</p>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2"
            onClick={handleCall}
          >
            <Phone className="w-5 h-5 text-primary" />
            <span className="text-sm">Call Us</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => window.location.href = "mailto:support@fitkits.app"}
          >
            <Mail className="w-5 h-5 text-primary" />
            <span className="text-sm">Email Us</span>
          </Button>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-soft p-5 space-y-4">
          <h3 className="font-bold text-lg text-foreground">Send us a message</h3>
          
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-muted border-0">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="booking">Booking Issue</SelectItem>
                <SelectItem value="payment">Payment & Refund</SelectItem>
                <SelectItem value="account">Account & Profile</SelectItem>
                <SelectItem value="event">Events & Games</SelectItem>
                <SelectItem value="feedback">Feedback & Suggestions</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description of your issue"
              className="bg-muted border-0"
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Your email address"
              className="bg-muted border-0"
            />
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Describe your issue in detail..."
              className="bg-muted border-0 min-h-[120px]"
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </form>

        {/* Business Hours */}
        <div className="bg-muted rounded-2xl p-4">
          <h4 className="font-semibold text-foreground mb-2">Business Hours</h4>
          <p className="text-sm text-muted-foreground">Monday - Saturday: 9:00 AM - 8:00 PM</p>
          <p className="text-sm text-muted-foreground">Sunday: 10:00 AM - 6:00 PM</p>
          <p className="text-xs text-muted-foreground mt-2">*Response time: Within 24 hours</p>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
