import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, UserPlus, Search, Gift, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const Friends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          addressee:profiles!friendships_addressee_id_fkey(*),
          requester:profiles!friendships_requester_id_fkey(*)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');
      
      if (error) {
        console.error("Friends fetch error:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!user,
  });

  const handleInviteFriends = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join me on FitKits!',
        text: 'Hey! Join me on FitKits to book sports venues and play together!',
        url: window.location.origin,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-4 pb-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">Friends</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card 
            className="p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/hub/community")}
          >
            <UserPlus className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-sm">Find Friends</p>
            <p className="text-xs text-muted-foreground">Discover players nearby</p>
          </Card>
          
          <Card 
            className="p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleInviteFriends}
          >
            <Gift className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-sm">Invite Friends</p>
            <p className="text-xs text-muted-foreground">Share & earn rewards</p>
          </Card>
        </div>

        {/* Friends List */}
        <Card className="p-4 shadow-md">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            Your Friends
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No friends yet</p>
              <p className="text-sm text-muted-foreground">Find players in the community!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friendship: any) => {
                const friend = friendship.requester_id === user?.id 
                  ? friendship.addressee 
                  : friendship.requester;
                
                return (
                  <div key={friendship.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {friend?.avatar_url ? (
                        <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {friend?.display_name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{friend?.username || 'user'}
                      </p>
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
