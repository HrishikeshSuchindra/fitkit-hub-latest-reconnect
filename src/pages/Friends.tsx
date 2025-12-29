import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, UserPlus, Search, Gift, Users, Loader2, Check, X, UserCheck, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-mobile";

const Friends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch accepted friends
  const { data: friends = [], isLoading } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('friendships')
        .select(`*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)`)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch pending requests (received)
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pending-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('friendships')
        .select(`*, requester:profiles!friendships_requester_id_fkey(*)`)
        .eq('addressee_id', user.id)
        .eq('status', 'pending');
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
  });

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
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Friend request accepted!");
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
    },
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

  const handleInviteFriends = () => {
    if (navigator.share) {
      navigator.share({ title: 'Join me on FitKits!', text: 'Hey! Join me on FitKits!', url: window.location.origin }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success("Link copied!");
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
                  <Button size="icon" variant="ghost" className="text-green-600" onClick={() => acceptRequestMutation.mutate(req.id)}><Check className="w-5 h-5" /></Button>
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => declineRequestMutation.mutate(req.id)}><X className="w-5 h-5" /></Button>
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
                const friend = f.requester_id === user?.id ? f.addressee : f.requester;
                return (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
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
    </div>
  );
};

export default Friends;
