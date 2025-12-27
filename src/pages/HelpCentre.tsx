import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Search, HelpCircle } from "lucide-react";

const faqs = [
  {
    category: "Bookings",
    questions: [
      {
        q: "How do I book a court?",
        a: "Navigate to the Venues section, select your preferred sport, choose a venue, pick a date and time slot, then confirm your booking. Payment is processed securely through our platform."
      },
      {
        q: "Can I cancel my booking?",
        a: "Yes, you can cancel your booking up to 2 hours before the scheduled time for a full refund. Cancellations within 2 hours may be subject to a cancellation fee."
      },
      {
        q: "How do I reschedule a booking?",
        a: "To reschedule, go to your Profile > My Bookings, select the booking you want to change, and tap 'Reschedule'. Choose a new date and time based on availability."
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept all major credit/debit cards, UPI, net banking, and wallet payments through our secure payment gateway."
      },
    ]
  },
  {
    category: "Events & Games",
    questions: [
      {
        q: "How do I join a public game?",
        a: "Go to the Hub section, browse available games, and tap 'Join Game' on any open game. You'll be added to the game and can chat with other players."
      },
      {
        q: "How can I host my own event?",
        a: "Navigate to Social > Host Event, fill in the event details including date, time, location, and participant limit. Submit for approval and we'll review within 24 hours."
      },
      {
        q: "What's the difference between public and friends-only games?",
        a: "Public games are visible to everyone and anyone can join. Friends-only games are only visible to your friends list and require an invitation to join."
      },
    ]
  },
  {
    category: "Account & Profile",
    questions: [
      {
        q: "How do I update my profile?",
        a: "Go to Profile > Edit Profile to change your name, username, bio, and avatar. Changes are saved automatically."
      },
      {
        q: "How do I add friends?",
        a: "In the Friends section, tap 'Add Friend' and enter your friend's username. Once they accept, you'll be connected and can invite each other to games."
      },
      {
        q: "How do I delete my account?",
        a: "Go to Profile > Edit Profile > Delete Account. This will permanently remove all your data. This action cannot be undone."
      },
    ]
  },
  {
    category: "Payments & Refunds",
    questions: [
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 5-7 business days. The amount will be credited to your original payment method."
      },
      {
        q: "I was charged but my booking wasn't confirmed. What do I do?",
        a: "Please contact us immediately through the Contact Us section. We'll investigate and process a refund if the booking wasn't completed."
      },
    ]
  },
];

const HelpCentre = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

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
          <HelpCircle className="w-12 h-12 mx-auto mb-3 text-primary-foreground" />
          <h1 className="text-2xl font-bold text-primary-foreground">Help Centre</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">Find answers to common questions</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 -mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-0 shadow-soft h-12 rounded-xl"
          />
        </div>
      </div>

      {/* FAQs */}
      <div className="px-5 mt-6 space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No results found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
          </div>
        ) : (
          filteredFaqs.map((category) => (
            <div key={category.category} className="bg-card rounded-2xl shadow-soft p-4">
              <h3 className="font-bold text-foreground mb-3">{category.category}</h3>
              <Accordion type="single" collapsible className="space-y-2">
                {category.questions.map((faq, idx) => (
                  <AccordionItem key={idx} value={`${category.category}-${idx}`} className="border-0">
                    <AccordionTrigger className="text-sm text-left py-3 hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))
        )}
      </div>

      {/* Contact Support */}
      <div className="px-5 mt-6">
        <div className="bg-muted rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">Still need help?</p>
          <Button onClick={() => navigate("/contact")} className="bg-primary">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HelpCentre;
