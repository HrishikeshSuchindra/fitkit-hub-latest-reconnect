import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserPlus, Share2, Users, Gamepad2, UserMinus, Loader2, Search, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Friend {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  isOnline: boolean;
  lastSeen?: string;
}

interface FriendsSectionProps {
  onNavigate: (section: string) => void;
}

export function FriendsSection({ onNavigate }: FriendsSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [friendUsername, setFriendUsername] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Fetch friends
  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          id,
          requester_id,
          addressee_id,
          status
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq("status", "accepted");
      
      if (error) throw error;
      
      // Get friend user IDs
      const friendIds = data.map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );
      
      if (friendIds.length === 0) return [];
      
      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", friendIds);
      
      if (profileError) throw profileError;
      
      return profiles.map(p => ({
        id: p.user_id,
        display_name: p.display_name || "User",
        username: p.username || "",
        avatar_url: p.avatar_url,
        isOnline: Math.random() > 0.5, // Simulated for now
        lastSeen: "2h ago",
      }));
    },
    enabled: !!user,
  });

  const onlineFriends = friends.filter(f => f.isOnline);
  const offlineFriends = friends.filter(f => !f.isOnline);

  // Add friend by username
  const handleAddFriend = async () => {
    if (!user || !friendUsername.trim()) return;
    
    setSearching(true);
    
    try {
      // Find user by username
      const { data: targetUser, error: findError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", friendUsername.trim().toLowerCase())
        .single();
      
      if (findError || !targetUser) {
        toast.error("User not found");
        return;
      }
      
      if (targetUser.user_id === user.id) {
        toast.error("You cannot add yourself as a friend");
        return;
      }
      
      // Check if friendship already exists
      const { data: existing } = await supabase
        .from("friendships")
        .select("id")
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUser.user_id}),and(requester_id.eq.${targetUser.user_id},addressee_id.eq.${user.id})`)
        .maybeSingle();
      
      if (existing) {
        toast.info("Friend request already sent or you are already friends");
        return;
      }
      
      // Create friendship request
      const { error } = await supabase
        .from("friendships")
        .insert({
          requester_id: user.id,
          addressee_id: targetUser.user_id,
          status: "accepted", // For simplicity, auto-accept
        });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["friends", user.id] });
      toast.success("Friend added!");
      setShowAddFriend(false);
      setFriendUsername("");
    } catch (error) {
      console.error("Error adding friend:", error);
      toast.error("Failed to add friend");
    } finally {
      setSearching(false);
    }
  };

  // Remove friend
  const handleRemoveFriend = async () => {
    if (!user || !selectedFriend) return;
    
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${selectedFriend.id}),and(requester_id.eq.${selectedFriend.id},addressee_id.eq.${user.id})`);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["friends", user.id] });
      toast.success("Friend removed");
      setShowRemoveConfirm(false);
      setSelectedFriend(null);
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend");
    }
  };

  // Share invite code
  const handleShareInvite = async () => {
    const inviteCode = user?.id.slice(0, 8).toUpperCase();
    const shareData = {
      title: "Join me on Fitkits!",
      text: `Use my invite code: ${inviteCode} to join Fitkits and play sports together!`,
      url: `https://fitkits.app/invite/${inviteCode}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Invite link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Invite to game
  const handleInviteToGame = (friend: Friend) => {
    toast.success(`Invite sent to ${friend.display_name}!`);
  };

  const FriendItem = ({ friend }: { friend: Friend }) => (
    <div className="flex items-center gap-3 py-3">
      <div className="relative">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
          friend.isOnline ? "bg-primary/10" : "bg-muted"
        }`}>
          {friend.avatar_url ? (
            <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className={`font-bold text-sm ${friend.isOnline ? "text-primary" : "text-muted-foreground"}`}>
              {friend.display_name[0]}
            </span>
          )}
        </div>
        {friend.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{friend.display_name}</p>
        <p className="text-xs text-muted-foreground">@{friend.username}</p>
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => handleInviteToGame(friend)}
        >
          <Gamepad2 className="w-4 h-4 text-primary" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => {
            setSelectedFriend(friend);
            setShowRemoveConfirm(true);
          }}
        >
          <UserMinus className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Friends Card */}
      <div className="bg-card rounded-2xl shadow-soft p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-foreground">Friends</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAddFriend(true)}
            className="text-primary"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-6">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No friends yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowAddFriend(true)}
            >
              Find Friends
            </Button>
          </div>
        ) : (
          <>
            {/* Online Friends */}
            {onlineFriends.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Online ({onlineFriends.length})
                </p>
                <div className="divide-y divide-border">
                  {onlineFriends.slice(0, 3).map(friend => (
                    <FriendItem key={friend.id} friend={friend} />
                  ))}
                </div>
              </div>
            )}

            {/* Offline Friends */}
            {offlineFriends.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Offline ({offlineFriends.length})
                </p>
                <div className="divide-y divide-border">
                  {offlineFriends.slice(0, 3).map(friend => (
                    <FriendItem key={friend.id} friend={friend} />
                  ))}
                </div>
              </div>
            )}

            {friends.length > 6 && (
              <Button
                variant="ghost"
                className="w-full mt-2 text-primary"
                onClick={() => onNavigate("friends")}
              >
                View All Friends
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Invite More Friends Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Invite More Friends</h3>
        <p className="text-sm text-white/80 mb-4">Play together and earn rewards</p>
        <Button
          onClick={handleShareInvite}
          className="bg-white text-blue-600 hover:bg-white/90 rounded-full px-6 font-semibold"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Invite Code
        </Button>
      </div>

      {/* Add Friend Dialog */}
      <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Friend</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter friend's username"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                className="pl-10 bg-muted border-0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFriend(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFriend} disabled={searching || !friendUsername.trim()}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Friend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Friend Confirmation */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Remove Friend</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to remove {selectedFriend?.display_name} from your friends?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveFriend}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
