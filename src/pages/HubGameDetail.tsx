import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, Share2, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useBookingById } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow } from "date-fns";
import venueFootball from "@/assets/venue-football.jpg";

const HubGameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isJoined, setIsJoined] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);

  const { data: game, isLoading } = useBookingById(gameId);

  // Check if user is already a member of the game's chat room
  useEffect(() => {
    const checkMembership = async () => {
      if (!gameId || !user) return;

      // Find chat room for this booking
      const { data: room } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("booking_id", gameId)
        .single();

      if (room) {
        setChatRoomId(room.id);
        
        // Check if user is a member
        const { data: membership } = await supabase
          .from("chat_room_members")
          .select("id")
          .eq("room_id", room.id)
          .eq("user_id", user.id)
          .single();

        setIsJoined(!!membership);

        // Get all members
        const { data: memberData } = await supabase
          .from("chat_room_members")
          .select(`
            user_id,
            role,
            profiles (
              display_name,
              username,
              avatar_url
            )
          `)
          .eq("room_id", room.id);

        if (memberData) {
          setMembers(memberData);
        }
      }
    };

    checkMembership();
  }, [gameId, user]);

  const handleJoin = async () => {
    if (!gameId || !user || !chatRoomId) return;
    
    setJoiningGame(true);
    try {
      // Add user to chat room
      const { error } = await supabase
        .from("chat_room_members")
        .insert({
          room_id: chatRoomId,
          user_id: user.id,
          role: "member",
        });

      if (error) throw error;

      setIsJoined(true);
      toast.success("Successfully joined!", {
        description: "You've been added to the game. Chat is now available."
      });

      // Refresh members
      const { data: memberData } = await supabase
        .from("chat_room_members")
        .select(`
          user_id,
          role,
          profiles (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq("room_id", chatRoomId);

      if (memberData) {
        setMembers(memberData);
      }
    } catch (error) {
      console.error("Error joining game:", error);
      toast.error("Failed to join game");
    } finally {
      setJoiningGame(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Game not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
        <BottomNav mode="hub" />
      </div>
    );
  }

  const isHost = game.user_id === user?.id;
  const maxPlayers = game.player_count || 10;
  const currentPlayers = members.length;
  const spotsLeft = maxPlayers - currentPlayers;

  // Get venue image based on sport
  const getVenueImage = () => {
    if (game.venue_image) return game.venue_image;
    return venueFootball;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      
      {/* Hero Image */}
      <div className="relative aspect-video">
        <img src={getVenueImage()} alt={game.venue_name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="px-2 py-1 bg-brand-green text-white text-xs font-medium rounded-full mb-2 inline-block">
            {game.sport || "Sports"}
          </span>
          <h1 className="text-xl font-bold text-white mb-1">
            {game.sport || "Game"} at {game.venue_name}
          </h1>
          <p className="text-sm text-white/80">
            Hosted by {game.profiles?.display_name || "Player"}
          </p>
        </div>
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
              <p className="text-sm font-semibold text-foreground">{getDateLabel(game.slot_date)}</p>
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Time</p>
              <p className="text-sm font-semibold text-foreground">{formatTime(game.slot_time)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-brand-green" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-text-secondary">Location</p>
            <p className="text-sm font-semibold text-foreground">{game.venue_address || game.venue_name}</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            View Map
          </Button>
        </div>
        
        {/* Description */}
        <div>
          <h3 className="font-bold text-foreground mb-2">About this Game</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Join this {game.sport || "sports"} game at {game.venue_name}. 
            Duration: {game.duration_minutes} minutes. All skill levels welcome!
          </p>
        </div>
        
        {/* Game Rules */}
        <div>
          <h3 className="font-bold text-foreground mb-2">Game Info</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-brand-green flex-shrink-0" />
              Duration: {game.duration_minutes} minutes
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-brand-green flex-shrink-0" />
              {game.visibility === "public" ? "Open to all players" : "Friends only"}
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-brand-green flex-shrink-0" />
              Be on time and respect all players
            </div>
          </div>
        </div>
        
        {/* Players */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-foreground">Players</h3>
            <span className="text-xs text-text-secondary">{currentPlayers}/{maxPlayers} joined</span>
          </div>
          <div className="space-y-2">
            {members.map((member, idx) => (
              <div key={idx} className="bg-muted rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-soft rounded-full flex items-center justify-center overflow-hidden">
                  {member.profiles?.avatar_url ? (
                    <img src={member.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-brand-green">
                      {(member.profiles?.display_name || "P").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {member.profiles?.display_name || "Player"}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  member.role === "admin" 
                    ? "bg-chip-purple-bg text-chip-purple-text" 
                    : "bg-brand-soft text-brand-green"
                }`}>
                  {member.role === "admin" ? "Host" : "Joined"}
                </span>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No players have joined yet. Be the first!
              </p>
            )}
          </div>
        </div>
        
        {/* Host */}
        {game.profiles && (
          <div className="bg-card rounded-xl shadow-soft p-4">
            <h3 className="font-bold text-foreground mb-3">Game Host</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center overflow-hidden">
                {game.profiles.avatar_url ? (
                  <img src={game.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">
                    {(game.profiles.display_name || "H").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{game.profiles.display_name || "Host"}</p>
                {game.profiles.username && (
                  <p className="text-xs text-text-secondary">@{game.profiles.username}</p>
                )}
              </div>
              <Button variant="outline" size="sm">View Profile</Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-divider p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-green" />
          <span className="text-sm font-semibold text-foreground">
            {spotsLeft > 0 ? `${spotsLeft} spots left` : "Game full"}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="w-10 h-10">
            <Share2 className="w-4 h-4" />
          </Button>
          {isHost || isJoined ? (
            <Button 
              className="bg-brand-green hover:bg-brand-green/90 text-white px-6"
              onClick={() => chatRoomId && navigate(`/hub/chat/${chatRoomId}`)}
              disabled={!chatRoomId}
            >
              <MessageCircle className="w-4 h-4 mr-2" /> Open Chat
            </Button>
          ) : spotsLeft <= 0 ? (
            <Button disabled className="bg-muted text-text-secondary px-6">
              Game Full
            </Button>
          ) : (
            <Button 
              className="bg-brand-green hover:bg-brand-green/90 text-white px-6"
              onClick={handleJoin}
              disabled={joiningGame || !chatRoomId}
            >
              {joiningGame ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Game"}
            </Button>
          )}
        </div>
      </div>
      
      <BottomNav mode="hub" />
    </div>
  );
};

export default HubGameDetail;