import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { MessageCircle, Users, ChevronRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ChatRoom {
  id: string;
  name: string | null;
  type: string;
  created_at: string;
  updated_at: string;
  otherUser?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
  lastMessage?: {
    content: string;
    created_at: string;
  };
  unreadCount: number;
}

const SocialChat = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch chat rooms
  const { data: chatRooms = [], isLoading } = useQuery({
    queryKey: ['chat-rooms', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get rooms where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('chat_room_members')
        .select('room_id, last_read_at')
        .eq('user_id', user.id);

      if (memberError || !memberData || memberData.length === 0) return [];

      const roomIds = memberData.map(m => m.room_id);

      // Get room details
      const { data: rooms, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds);

      if (roomError || !rooms) return [];

      // Get all members for these rooms to find other users in DMs
      const { data: allMembers } = await supabase
        .from('chat_room_members')
        .select('room_id, user_id')
        .in('room_id', roomIds);

      // Get profiles for other users
      const otherUserIds = allMembers
        ?.filter(m => m.user_id !== user.id)
        .map(m => m.user_id) || [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', otherUserIds);

      // Get last message for each room
      const lastMessages: Record<string, { content: string; created_at: string }> = {};
      for (const room of rooms) {
        const { data: msgs } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (msgs && msgs.length > 0) {
          lastMessages[room.id] = msgs[0];
        }
      }

      // Get unread counts
      const unreadCounts: Record<string, number> = {};
      for (const member of memberData) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', member.room_id)
          .gt('created_at', member.last_read_at || '1970-01-01');
        
        unreadCounts[member.room_id] = count || 0;
      }

      return rooms.map(room => {
        const otherMember = allMembers?.find(m => m.room_id === room.id && m.user_id !== user.id);
        const otherProfile = profiles?.find(p => p.user_id === otherMember?.user_id);

        return {
          ...room,
          otherUser: otherProfile ? {
            display_name: otherProfile.display_name,
            avatar_url: otherProfile.avatar_url,
            username: otherProfile.username,
          } : undefined,
          lastMessage: lastMessages[room.id],
          unreadCount: unreadCounts[room.id] || 0,
        } as ChatRoom;
      }).sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at;
        const bTime = b.lastMessage?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    },
    enabled: !!user,
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_room_members',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredChats = chatRooms.filter(chat => {
    // Filter by type
    if (activeFilter === "chat" && chat.type !== "direct") return false;
    if (activeFilter === "group" && chat.type !== "group") return false;

    // Filter by search
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const chatName = chat.type === 'direct' 
        ? chat.otherUser?.display_name?.toLowerCase() || ''
        : chat.name?.toLowerCase() || '';
      const username = chat.otherUser?.username?.toLowerCase() || '';
      
      if (!chatName.includes(searchLower) && !username.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  const getChatName = (chat: ChatRoom) => {
    if (chat.type === 'direct') {
      return chat.otherUser?.display_name || 'Chat';
    }
    return chat.name || 'Group Chat';
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const chatCounts = {
    all: chatRooms.length,
    chat: chatRooms.filter(c => c.type === 'direct').length,
    group: chatRooms.filter(c => c.type === 'group').length,
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-4">
        <SearchBar 
          placeholder="Search chats..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        {/* Filter Chips */}
        <div className="flex gap-2">
          {[
            { id: "all", label: "All", count: chatCounts.all },
            { id: "chat", label: "Chat", count: chatCounts.chat },
            { id: "group", label: "Group", count: chatCounts.group },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
        
        {/* Chat List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {!searchQuery && 'Add friends to start chatting'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredChats.map((chat) => (
              <div 
                key={chat.id} 
                className="bg-card rounded-xl shadow-soft p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/social/chat/${chat.id}`)}
              >
                {/* Avatar */}
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {chat.type === 'direct' && chat.otherUser?.avatar_url ? (
                    <img src={chat.otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : chat.type === 'group' ? (
                    <Users className="w-6 h-6 text-primary" />
                  ) : (
                    <span className="text-primary font-bold">{getInitials(chat.otherUser?.display_name)}</span>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-foreground truncate">{getChatName(chat)}</h4>
                    <span className="text-xs text-muted-foreground">
                      {chat.lastMessage ? formatTime(chat.lastMessage.created_at) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
                
                {/* Unread Badge or Arrow */}
                {chat.unreadCount > 0 ? (
                  <div className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-destructive-foreground text-xs font-bold">{chat.unreadCount}</span>
                  </div>
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <BottomNav mode="social" />
    </div>
  );
};

export default SocialChat;