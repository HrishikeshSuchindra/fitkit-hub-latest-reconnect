import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, UserPlus, Search, Gift, Users, Loader2, Check, X, UserCheck, Clock, MessageCircle, Calendar, Trophy, UserMinus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-mobile";

interface FriendProfile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  games_played: number;
  friends_count: number;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  requester?: FriendProfile;
  addressee?: FriendProfile;
}

const Friends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);
  const [selectedFriendshipId, setSelectedFriendshipId] = useState<string | null>(null);
  const [showUnfriendDialog, setShowUnfriendDialog] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch accepted friends with proper profile fetching
  const { data: friends = [], isLoading } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get friendships
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');
      
      if (error || !friendships) return [];
      
      // Get all friend user IDs
      const friendUserIds = friendships.map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );
      
      // Fetch profiles for all friends
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', friendUserIds);
      
      // Map profiles to friendships
      return friendships.map(f => {
        const friendUserId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        const friendProfile = profiles?.find(p => p.user_id === friendUserId);
        return {
          ...f,
          friend: friendProfile
        };
      });
    },
    enabled: !!user,
  });

  // Fetch pending requests (received) with requester profiles
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pending-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get pending requests where user is addressee
      const { data: requests, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('addressee_id', user.id)
        .eq('status', 'pending');
      
      if (error || !requests) return [];
      
      // Get requester profiles
      const requesterIds = requests.map(r => r.requester_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', requesterIds);
      
      return requests.map(r => ({
        ...r,
        requester: profiles?.find(p => p.user_id === r.requester_id)
      }));
    },
    enabled: !!user,
  });

  // Real-time subscription for friend requests
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('friendships-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
          queryClient.invalidateQueries({ queryKey: ['friends'] });
          queryClient.invalidateQueries({ queryKey: ['sent-requests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Fetch sent pending requests (to disable add button)
  const { data: sentRequests = [] } = useQuery({
    queryKey: ['sent-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('friendships')
        .select('addressee_id')
        .eq('requester_id', user.id)
        .eq('status', 'pending');
      if (error) return [];
      return data?.map(r => r.addressee_id) || [];
    },
    enabled: !!user,
  });

  // Search users
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['search-users', debouncedSearch],
    queryFn: async () => {
      if (!user || debouncedSearch.length < 2) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .or(`display_name.ilike.%${debouncedSearch}%,username.ilike.%${debouncedSearch}%`)
        .limit(10);
      if (error) return [];
      return data || [];
    },
    enabled: !!user && debouncedSearch.length >= 2,
  });

  // Check if already friends or request pending
  const getFriendshipStatus = (profileUserId: string): 'none' | 'pending' | 'friends' => {
    // Check if already friends
    const isFriend = friends.some((f: any) => 
      f.requester_id === profileUserId || f.addressee_id === profileUserId
    );
    if (isFriend) return 'friends';
    
    // Check if request sent
    if (sentRequests.includes(profileUserId)) return 'pending';
    
    return 'none';
  };

  // Send friend request
  const sendRequestMutation = useMutation({
    mutationFn: async (addresseeId: string) => {
      const { error } = await supabase.from('friendships').insert({
        requester_id: user!.id,
        addressee_id: addresseeId,
        status: 'pending',
      });
      if (error) throw error;
      
      // Create notification for the receiver
      await supabase.from('notifications').insert({
        user_id: addresseeId,
        type: 'friend_request',
        title: 'New Friend Request',
        body: `You have a new friend request`,
        data: { friend_id: user!.id },
      });
    },
    onSuccess: () => {
      toast.success("Friend request sent!");
      queryClient.invalidateQueries({ queryKey: ['search-users'] });
      queryClient.invalidateQueries({ queryKey: ['sent-requests'] });
    },
    onError: () => toast.error("Failed to send request"),
  });

  // Accept friend request
  const acceptRequestMutation = useMutation({
    mutationFn: async ({ friendshipId, requesterId }: { friendshipId: string; requesterId: string }) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);
      if (error) throw error;
      
      // Notify the requester that their request was accepted
      await supabase.from('notifications').insert({
        user_id: requesterId,
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        body: `Your friend request has been accepted!`,
        data: { friend_id: user!.id },
      });
    },
    onSuccess: () => {
      toast.success("Friend request accepted!");
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
    },
    onError: () => toast.error("Failed to accept request"),
  });

  // Decline friend request
  const declineRequestMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request declined");
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
    },
  });

  // Unfriend mutation
  const unfriendMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Friend removed");
      setSelectedFriend(null);
      setShowUnfriendDialog(false);
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: () => toast.error("Failed to remove friend"),
  });

  // Start or get DM chat room
  const startChatMutation = useMutation({
    mutationFn: async (friendUserId: string) => {
      // Check if a DM room already exists between these users
      const { data: existingRooms } = await supabase
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', user!.id);
      
      if (existingRooms) {
        for (const room of existingRooms) {
          const { data: members } = await supabase
            .from('chat_room_members')
            .select('user_id')
            .eq('room_id', room.room_id);
          
          const { data: roomData } = await supabase
            .from('chat_rooms')
            .select('type')
            .eq('id', room.room_id)
            .single();
          
          if (
            roomData?.type === 'direct' &&
            members?.length === 2 &&
            members.some(m => m.user_id === friendUserId)
          ) {
            return room.room_id;
          }
        }
      }
      
      // Create new DM room
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          type: 'direct',
          created_by: user!.id,
        })
        .select()
        .single();
      
      if (roomError) throw roomError;
      
      // Add both users as members
      const { error: memberError } = await supabase
        .from('chat_room_members')
        .insert([
          { room_id: newRoom.id, user_id: user!.id, role: 'admin' },
          { room_id: newRoom.id, user_id: friendUserId, role: 'member' },
        ]);
      
      if (memberError) throw memberError;
      
      return newRoom.id;
    },
    onSuccess: (roomId) => {
      setSelectedFriend(null);
      navigate(`/hub/chat/${roomId}`);
    },
    onError: () => toast.error("Failed to start chat"),
  });

  const handleInviteFriends = () => {
    if (navigator.share) {
      navigator.share({ title: 'Join me on FitKits!', text: 'Hey! Join me on FitKits!', url: window.location.origin }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success("Link copied!");
    }
  };

  const handleUnfriend = () => {
    if (selectedFriendshipId) {
      unfriendMutation.mutate(selectedFriendshipId);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-4 pb-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="text-lg font-semibold ml-2">Friends</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
            onFocus={() => setShowSearchResults(true)}
            className="pl-10"
          />
          {showSearchResults && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-strong border z-50 max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
              ) : (
                searchResults.map((profile: any) => {
                  const status = getFriendshipStatus(profile.user_id);
                  return (
                    <div key={profile.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{profile.display_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">@{profile.username || 'user'}</p>
                      </div>
                      {status === 'friends' ? (
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">Friends</span>
                      ) : status === 'pending' ? (
                        <Button size="sm" variant="secondary" disabled className="opacity-50">
                          <Clock className="w-4 h-4 mr-1" /> Pending
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => sendRequestMutation.mutate(profile.user_id)} disabled={sendRequestMutation.isPending}>
                          <UserPlus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card className="p-4 shadow-md mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><UserCheck className="w-5 h-5" /> Friend Requests</h3>
            <div className="space-y-3">
              {pendingRequests.map((req: any) => (
                <div key={req.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {req.requester?.avatar_url ? <img src={req.requester.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{req.requester?.display_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">@{req.requester?.username || 'user'}</p>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-green-600 hover:text-green-700 hover:bg-green-100" 
                    onClick={() => acceptRequestMutation.mutate({ friendshipId: req.id, requesterId: req.requester_id })}
                    disabled={acceptRequestMutation.isPending}
                  >
                    <Check className="w-5 h-5" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-100" 
                    onClick={() => declineRequestMutation.mutate(req.id)}
                    disabled={declineRequestMutation.isPending}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/hub/community")}>
            <UserPlus className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-sm">Find Friends</p>
            <p className="text-xs text-muted-foreground">Discover players nearby</p>
          </Card>
          <Card className="p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={handleInviteFriends}>
            <Gift className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-sm">Invite Friends</p>
            <p className="text-xs text-muted-foreground">Share & earn rewards</p>
          </Card>
        </div>

        {/* Friends List */}
        <Card className="p-4 shadow-md">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-muted-foreground" /> Your Friends</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No friends yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((f: any) => {
                const friend = f.friend;
                return (
                  <div 
                    key={f.id} 
                    className="flex items-center gap-3 p-3 bg-muted rounded-xl cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => {
                      setSelectedFriend(friend);
                      setSelectedFriendshipId(f.id);
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {friend?.avatar_url ? <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{friend?.display_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">@{friend?.username || 'user'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Friend Profile Sheet */}
      <Sheet open={!!selectedFriend} onOpenChange={(open) => { if (!open) { setSelectedFriend(null); setSelectedFriendshipId(null); } }}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle>Profile</SheetTitle>
          </SheetHeader>
          {selectedFriend && (
            <div className="mt-6 space-y-6 overflow-y-auto">
              {/* Profile Header */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {selectedFriend.avatar_url ? (
                    <img src={selectedFriend.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-12 h-12 text-primary" />
                  )}
                </div>
                <h3 className="mt-4 text-xl font-bold">{selectedFriend.display_name || 'User'}</h3>
                <p className="text-muted-foreground">@{selectedFriend.username || 'user'}</p>
                {selectedFriend.bio && (
                  <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">{selectedFriend.bio}</p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 text-center">
                  <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{selectedFriend.games_played || 0}</p>
                  <p className="text-xs text-muted-foreground">Games Played</p>
                </Card>
                <Card className="p-4 text-center">
                  <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{selectedFriend.friends_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Friends</p>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  onClick={() => startChatMutation.mutate(selectedFriend.user_id)}
                  disabled={startChatMutation.isPending}
                >
                  {startChatMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4 mr-2" />
                  )}
                  Message
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => toast.success("Invite feature coming soon!")}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Invite to Game
                </Button>
              </div>

              {/* Unfriend Button */}
              <Button 
                variant="ghost" 
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowUnfriendDialog(true)}
              >
                <UserMinus className="w-4 h-4 mr-2" />
                Remove Friend
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Unfriend Confirmation Dialog */}
      <Dialog open={showUnfriendDialog} onOpenChange={setShowUnfriendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Friend</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedFriend?.display_name || 'this user'} from your friends? You can always send a new friend request later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowUnfriendDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleUnfriend}
              disabled={unfriendMutation.isPending}
            >
              {unfriendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Friends;
