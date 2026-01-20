import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, Clock, MapPin, Users, Trophy, Loader2, Edit2, Minus, Plus, User, UsersRound, BookOpen, AlertCircle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useEventById, useEventRegistration } from "@/hooks/useEvents";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const HubTournamentRegister = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToRefund, setAgreedToRefund] = useState(false);
  const [registrationType, setRegistrationType] = useState<"individual" | "team">("individual");
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState<string[]>([""]);
  const [isRegistering, setIsRegistering] = useState(false);

  const { data: event, isLoading } = useEventById(tournamentId);
  const { data: registration } = useEventRegistration(tournamentId);

  const isAlreadyRegistered = !!registration && registration.status === "registered";

  // Tournament-specific fields with type assertion
  const tournamentEvent = event as typeof event & {
    team_type?: string;
    team_size?: number;
    min_team_size?: number;
    max_team_size?: number;
    rules?: string;
    guidelines?: string;
    format?: string;
  };

  const teamType = tournamentEvent?.team_type || "individual";
  const minTeamSize = tournamentEvent?.min_team_size || 2;
  const maxTeamSize = tournamentEvent?.max_team_size || 5;

  const formatEventTime = (startTime: string, endTime: string | null) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    
    if (endTime) {
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }
    return formatTime(startTime);
  };

  const handleAddTeamMember = () => {
    if (teamMembers.length < maxTeamSize - 1) {
      setTeamMembers([...teamMembers, ""]);
    }
  };

  const handleRemoveTeamMember = (index: number) => {
    if (teamMembers.length > 1) {
      setTeamMembers(teamMembers.filter((_, i) => i !== index));
    }
  };

  const handleTeamMemberChange = (index: number, value: string) => {
    const updated = [...teamMembers];
    updated[index] = value;
    setTeamMembers(updated);
  };

  const handleRegister = async () => {
    if (!tournamentId || !user || !event) {
      toast.error("Please sign in to register");
      return;
    }

    // Validation for team registration
    if (registrationType === "team") {
      if (!teamName.trim()) {
        toast.error("Please enter your team name");
        return;
      }
      const validMembers = teamMembers.filter(m => m.trim());
      if (validMembers.length < minTeamSize - 1) {
        toast.error(`Please add at least ${minTeamSize - 1} team members`);
        return;
      }
    }
    
    setIsRegistering(true);
    
    try {
      // Create event registration
      const { data: regData, error: regError } = await supabase
        .from("event_registrations")
        .insert({
          event_id: tournamentId,
          user_id: user.id,
          status: "registered",
          payment_status: event.entry_fee === 0 ? "completed" : "pending",
          tickets_count: registrationType === "team" ? teamMembers.filter(m => m.trim()).length + 1 : 1,
        })
        .select()
        .single();

      if (regError) throw regError;

      // Check if chat room exists for this tournament
      const { data: existingRoom } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("event_id", tournamentId)
        .maybeSingle();

      let chatRoomId = existingRoom?.id;

      // If no chat room, create one
      if (!chatRoomId) {
        const { data: newRoom, error: roomError } = await supabase
          .from("chat_rooms")
          .insert({
            type: "group",
            name: `${event.title} - Tournament Chat`,
            event_id: tournamentId,
            created_by: user.id,
          })
          .select()
          .single();

        if (!roomError && newRoom) {
          chatRoomId = newRoom.id;
        }
      }

      // Add user to chat room
      if (chatRoomId) {
        const { data: existingMember } = await supabase
          .from("chat_room_members")
          .select("id")
          .eq("room_id", chatRoomId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existingMember) {
          await supabase.from("chat_room_members").insert({
            room_id: chatRoomId,
            user_id: user.id,
            role: "member",
          });
        }
      }

      // Send registration confirmation email
      try {
        await supabase.functions.invoke("send-event-registration-email", {
          body: {
            userId: user.id,
            eventId: tournamentId,
            registrationId: regData.id,
            eventTitle: event.title,
            eventType: event.event_type,
            eventDate: event.event_date,
            startTime: event.start_time,
            location: event.location,
            entryFee: event.entry_fee,
            ticketsCount: registrationType === "team" ? teamMembers.filter(m => m.trim()).length + 1 : 1,
          },
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }

      // Navigate to confirmation
      navigate(`/hub/tournament/${tournamentId}/confirmation`, {
        state: { 
          eventData: event, 
          registrationType,
          teamName: registrationType === "team" ? teamName : null,
          teamMembers: registrationType === "team" ? teamMembers.filter(m => m.trim()) : [],
          registrationId: regData.id,
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to register");
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Tournament not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/hub/games")}>
            Go to Hub
          </Button>
        </div>
        <BottomNav mode="hub" />
      </div>
    );
  }

  if (isAlreadyRegistered) {
    navigate(`/hub/tournament/${tournamentId}`);
    return null;
  }

  const eventTime = formatEventTime(event.start_time, event.end_time);
  const spotsLeft = event.max_participants ? event.max_participants - (event.current_participants || 0) : null;
  
  const canProceed = agreedToRules && agreedToTerms && (event.entry_fee === 0 || agreedToRefund);
  const ticketCount = registrationType === "team" ? teamMembers.filter(m => m.trim()).length + 1 : 1;
  const totalAmount = event.entry_fee * ticketCount;

  return (
    <div className="min-h-screen bg-background pb-36">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Tournament Registration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete your registration details
          </p>
        </div>

        {/* Tournament Card */}
        <div className="bg-card rounded-xl shadow-soft overflow-hidden">
          {event.image_url && (
            <div className="relative h-32">
              <img 
                src={event.image_url} 
                alt={event.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium">
                  Tournament
                </span>
                {event.prize_pool && (
                  <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full">
                    {event.prize_pool}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg text-foreground truncate">{event.title}</h2>
                <p className="text-sm text-muted-foreground">{event.sport}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground flex-shrink-0"
                onClick={() => navigate(`/hub/tournament/${tournamentId}`)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Registration Type Selection (if tournament allows both) */}
        {teamType === "both" && (
          <div className="bg-card rounded-xl shadow-soft p-4">
            <h3 className="font-semibold text-foreground mb-4">Registration Type</h3>
            <RadioGroup
              value={registrationType}
              onValueChange={(value) => setRegistrationType(value as "individual" | "team")}
              className="grid grid-cols-2 gap-3"
            >
              <div className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${registrationType === "individual" ? "border-primary bg-primary/5" : "border-muted bg-muted"}`}>
                <RadioGroupItem value="individual" id="individual" className="sr-only" />
                <Label htmlFor="individual" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${registrationType === "individual" ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Individual</p>
                    <p className="text-xs text-muted-foreground">Solo entry</p>
                  </div>
                </Label>
              </div>
              <div className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${registrationType === "team" ? "border-primary bg-primary/5" : "border-muted bg-muted"}`}>
                <RadioGroupItem value="team" id="team" className="sr-only" />
                <Label htmlFor="team" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${registrationType === "team" ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"}`}>
                    <UsersRound className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Team</p>
                    <p className="text-xs text-muted-foreground">{minTeamSize}-{maxTeamSize} players</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Team Details (if team registration) */}
        {(teamType === "team" || (teamType === "both" && registrationType === "team")) && (
          <div className="bg-card rounded-xl shadow-soft p-4 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <UsersRound className="w-4 h-4 text-primary" />
              Team Details
            </h3>
            
            <div>
              <Label htmlFor="teamName" className="text-sm text-muted-foreground">Team Name *</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-muted-foreground">Team Members (excluding you)</Label>
                <span className="text-xs text-muted-foreground">
                  {teamMembers.filter(m => m.trim()).length + 1}/{maxTeamSize} players
                </span>
              </div>
              <div className="space-y-2">
                {teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={member}
                      onChange={(e) => handleTeamMemberChange(index, e.target.value)}
                      placeholder={`Team member ${index + 1} name/email`}
                      className="flex-1"
                    />
                    {teamMembers.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => handleRemoveTeamMember(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {teamMembers.length < maxTeamSize - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={handleAddTeamMember}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tournament Details */}
        <div className="bg-card rounded-xl shadow-soft p-4 space-y-4">
          <h3 className="font-semibold text-foreground">Tournament Details</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium truncate">{format(new Date(event.event_date), "EEE, MMM d")}</p>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-medium truncate">{eventTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-medium truncate">{event.location}</p>
            </div>
          </div>

          {event.max_participants && (
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Availability</p>
                <p className="text-sm font-medium">
                  {spotsLeft} spots left out of {event.max_participants}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rules & Guidelines */}
        {(tournamentEvent.rules || tournamentEvent.guidelines) && (
          <div className="bg-card rounded-xl shadow-soft p-4 space-y-4">
            {tournamentEvent.rules && (
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Tournament Rules
                </h3>
                <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground whitespace-pre-line max-h-40 overflow-y-auto">
                  {tournamentEvent.rules}
                </div>
              </div>
            )}
            {tournamentEvent.guidelines && (
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  Guidelines
                </h3>
                <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground whitespace-pre-line max-h-40 overflow-y-auto">
                  {tournamentEvent.guidelines}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-card rounded-xl shadow-soft p-4">
          <h3 className="font-semibold text-foreground mb-4">Payment Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Entry Fee × {ticketCount} {ticketCount === 1 ? "entry" : "entries"}
              </span>
              <span className="font-medium">
                {event.entry_fee > 0 ? `₹${event.entry_fee} × ${ticketCount}` : "Free"}
              </span>
            </div>
            {event.entry_fee > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span className="font-medium">₹0</span>
                </div>
                <div className="border-t border-divider pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-lg text-primary">₹{totalAmount}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-card rounded-xl shadow-soft p-4 space-y-4">
          <h3 className="font-semibold text-foreground">Terms & Conditions</h3>
          
          <div className="flex items-start gap-3">
            <Checkbox
              id="rules"
              checked={agreedToRules}
              onCheckedChange={(checked) => setAgreedToRules(checked as boolean)}
            />
            <label htmlFor="rules" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              I have read and agree to the <span className="text-primary underline">tournament rules</span> and regulations.
            </label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              I agree to the <span className="text-primary underline">terms of service</span>. 
              I understand that the organizer reserves the right to modify or cancel the tournament.
            </label>
          </div>

          {event.entry_fee > 0 && (
            <div className="flex items-start gap-3">
              <Checkbox
                id="refund"
                checked={agreedToRefund}
                onCheckedChange={(checked) => setAgreedToRefund(checked as boolean)}
              />
              <label htmlFor="refund" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I understand the <span className="text-primary underline">refund policy</span>. 
                Cancellations made 48+ hours before the tournament are eligible for a full refund.
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-divider p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {registrationType === "team" ? `Team of ${ticketCount}` : "Individual entry"}
            </p>
            <p className="text-xl font-bold text-primary">
              {totalAmount > 0 ? `₹${totalAmount}` : "Free"}
            </p>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            onClick={handleRegister}
            disabled={!canProceed || isRegistering}
          >
            {isRegistering ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Trophy className="w-4 h-4 mr-2" />
            )}
            {totalAmount > 0 ? "Pay & Register" : "Confirm Registration"}
          </Button>
        </div>
      </div>

      <BottomNav mode="hub" />
    </div>
  );
};

export default HubTournamentRegister;