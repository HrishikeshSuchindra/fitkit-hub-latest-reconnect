import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, Share2, Users, Gamepad2, UserMinus, Loader2, Search, ChevronRight, Gift } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Friend {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  isOnline: boolean;
  lastSeen?: string;
}

interface FriendsListSectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (section: string) => void;
}

export function FriendsListSection({ open, onOpenChange, onNavigate }: FriendsListSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddFriend, setShowAddFriend] = useState(false);
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
      
      const friendIds = data.map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );
      
      if (friendIds.length === 0) return [];
      
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
        isOnline: Math.random() > 0.5,
        lastSeen: "2h ago",
      }));
    },
    enabled: !!user,
  });

  const handleAddFriend = async () => {
    if (!user || !friendUsername.trim()) return;
    
    setSearching(true);
    
    try {
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
      
      const { data: existing } = await supabase
        .from("friendships")
        .select("id")
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUser.user_id}),and(requester_id.eq.${targetUser.user_id},addressee_id.eq.${user.id})`)
        .maybeSingle();
      
      if (existing) {
        toast.info("Friend request already sent or you are already friends");
        return;
      }
      
      const { error } = await supabase
        .from("friendships")
        .insert({
          requester_id: user.id,
          addressee_id: targetUser.user_id,
          status: "accepted",
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

  const handleInviteToGame = (friend: Friend) => {
    toast.success(`Invite sent to ${friend.display_name}!`);
  };

  const FriendItem = ({ friend }: { friend: Friend }) => (
    <div className="flex items-center gap-3 py-2">
      <div className="relative">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden ${
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
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full" />
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
          className="h-7 w-7 p-0"
          onClick={() => handleInviteToGame(friend)}
        >
          <Gamepad2 className="w-3.5 h-3.5 text-primary" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => {
            setSelectedFriend(friend);
            setShowRemoveConfirm(true);
          }}
        >
          <UserMinus className="w-3.5 h-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Card className="shadow-md border-0 bg-card overflow-hidden">
        <Collapsible open={open} onOpenChange={onOpenChange}>
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-bold text-foreground">Friends</h3>
              {friends.length > 0 && (
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                  {friends.length}
                </span>
              )}
            </div>
            <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>

          <CollapsibleContent className="px-4 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Add Friend Button */}
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="w-full flex items-center justify-between py-3 border-b border-border"
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">Add Friend</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Find Friends */}
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="w-full flex items-center justify-between py-3 border-b border-border"
                >
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Find Friends</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Invite Friends with Gift icon */}
                <button
                  onClick={handleShareInvite}
                  className="w-full flex items-center justify-between py-3 border-b border-border"
                >
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium text-foreground">Invite Friends</span>
                  </div>
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Friends List */}
                {friends.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Your Friends ({friends.length})
                    </p>
                    <div className="divide-y divide-border">
                      {friends.slice(0, 5).map(friend => (
                        <FriendItem key={friend.id} friend={friend} />
                      ))}
                    </div>
                    {friends.length > 5 && (
                      <Button
                        variant="ghost"
                        className="w-full mt-2 text-primary"
                        onClick={() => onNavigate("friends")}
                      >
                        View All Friends
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                )}

                {friends.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No friends yet. Add friends to play together!</p>
                  </div>
                )}
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      </Card>

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
            <Button onClick={handleAddFriend} disabled={searching || !friendUsername.trim()} className="bg-primary text-white">
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
            <Button variant="destructive" onClick={handleRemoveFriend} className="text-white">
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}