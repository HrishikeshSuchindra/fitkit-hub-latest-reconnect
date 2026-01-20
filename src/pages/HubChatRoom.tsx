import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Smile,
  Users,
  Info,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  message_type: string;
  sender?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

interface ChatMember {
  user_id: string;
  role: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

const HubChatRoom = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Fetch chat room info
  const { data: chatRoom, isLoading: isLoadingRoom } = useQuery({
    queryKey: ['hub-chat-room', chatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', chatId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!chatId,
  });

  // Fetch chat members with profiles
  const { data: members = [] } = useQuery({
    queryKey: ['hub-chat-members', chatId],
    queryFn: async () => {
      const { data: memberData, error } = await supabase
        .from('chat_room_members')
        .select('*')
        .eq('room_id', chatId);
      
      if (error || !memberData) return [];

      const userIds = memberData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      return memberData.map(m => ({
        ...m,
        profile: profiles?.find(p => p.user_id === m.user_id)
      })) as ChatMember[];
    },
    enabled: !!chatId,
  });

  // Get the other user for DM
  const otherMember = members.find(m => m.user_id !== user?.id);
  const chatName = chatRoom?.type === 'direct' 
    ? otherMember?.profile?.display_name || 'Chat'
    : chatRoom?.name || 'Group Chat';

  // Fetch messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['hub-messages', chatId],
    queryFn: async () => {
      const { data: msgData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', chatId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const senderIds = [...new Set(msgData?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', senderIds);

      return (msgData || []).map(m => ({
        ...m,
        sender: profiles?.find(p => p.user_id === m.sender_id)
      })) as Message[];
    },
    enabled: !!chatId,
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`hub-messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${chatId}`,
        },
        async (payload) => {
          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', payload.new.sender_id)
            .single();

          const newMessage: Message = {
            id: payload.new.id,
            sender_id: payload.new.sender_id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            message_type: payload.new.message_type || 'text',
            sender: profile ? {
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              username: profile.username,
            } : undefined,
          };

          queryClient.setQueryData(['hub-messages', chatId], (old: Message[] | undefined) => {
            if (!old) return [newMessage];
            if (old.some(m => m.id === newMessage.id)) return old;
            return [...old, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, queryClient]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark chat as read when entering
  useEffect(() => {
    if (!chatId || !user) return;
    
    const markAsRead = async () => {
      await supabase.rpc('mark_chat_room_read', { _room_id: chatId });
      // Invalidate hub chat list to update unread counts
      queryClient.invalidateQueries({ queryKey: ['hub-chat-rooms'] });
    };
    
    markAsRead();
  }, [chatId, user, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('messages').insert({
        room_id: chatId,
        sender_id: user!.id,
        content,
        message_type: 'text',
      });
      if (error) throw error;
    },
  });

  const handleSend = () => {
    if (!message.trim() || !user) return;
    sendMessageMutation.mutate(message);
    setMessage("");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoadingRoom || isLoadingMessages) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Custom Header */}
      <header className="bg-card border-b border-divider px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <button onClick={() => navigate("/hub/chat")} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        
        <Sheet open={showInfo} onOpenChange={setShowInfo}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                {chatRoom?.type === 'direct' && otherMember?.profile?.avatar_url ? (
                  <img src={otherMember.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : chatRoom?.type === 'direct' ? (
                  <span className="text-sm font-semibold text-primary">{getInitials(otherMember?.profile?.display_name)}</span>
                ) : (
                  <Users className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm text-foreground">{chatName}</h3>
                <p className="text-xs text-muted-foreground">
                  {chatRoom?.type === 'direct' ? 'Direct Message' : `${members.length} members`}
                </p>
              </div>
            </button>
          </SheetTrigger>
          
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            <SheetHeader className="p-4 border-b border-divider">
              <SheetTitle>Chat Info</SheetTitle>
            </SheetHeader>
            
            <div className="p-4 space-y-6">
              {/* Chat Avatar & Name */}
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden">
                  {chatRoom?.type === 'direct' && otherMember?.profile?.avatar_url ? (
                    <img src={otherMember.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-10 h-10 text-primary" />
                  )}
                </div>
                <h3 className="font-bold text-lg text-foreground">{chatName}</h3>
                <p className="text-sm text-muted-foreground">
                  {chatRoom?.type === 'direct' ? '@' + (otherMember?.profile?.username || 'user') : `${members.length} members`}
                </p>
              </div>
              
              {/* Members */}
              {chatRoom?.type === 'group' && (
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-3">Members</h4>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                          {member.profile?.avatar_url ? (
                            <img src={member.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold text-primary">{getInitials(member.profile?.display_name)}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {member.user_id === user?.id ? 'You' : member.profile?.display_name || 'User'}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-lg">
            <Phone className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg">
            <Video className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg" onClick={() => setShowInfo(true)}>
            <Info className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isMe ? "" : "flex gap-2"}`}>
                  {!isMe && (
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {msg.sender?.avatar_url ? (
                        <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold text-primary">{getInitials(msg.sender?.display_name)}</span>
                      )}
                    </div>
                  )}
                  <div>
                    {!isMe && chatRoom?.type === 'group' && (
                      <p className="text-xs text-muted-foreground mb-1 ml-1">{msg.sender?.display_name || 'User'}</p>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl ${
                      isMe 
                        ? "bg-primary text-primary-foreground rounded-br-md" 
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <p className={`text-xs text-muted-foreground mt-1 ${isMe ? "text-right mr-1" : "ml-1"}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-divider p-3">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-lg">
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-muted border-0 h-10"
          />
          
          <button className="p-2 hover:bg-muted rounded-lg">
            <Smile className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <Button 
            size="icon" 
            className="bg-primary hover:bg-primary/90 w-10 h-10 rounded-full"
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HubChatRoom;