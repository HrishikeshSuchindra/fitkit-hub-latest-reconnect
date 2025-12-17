import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Smile,
  Users,
  Info,
  ChevronRight
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

interface Message {
  id: string;
  sender: string;
  senderAvatar: string;
  content: string;
  time: string;
  isMe: boolean;
  type: "text" | "image" | "system";
}

const HubChatRoom = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);

  const chatInfo = {
    id: chatId,
    name: "Football Squad",
    isGroup: true,
    members: [
      { name: "Rahul Sharma", avatar: "RS", role: "Admin", status: "online" },
      { name: "Priya Patel", avatar: "PP", role: "Member", status: "online" },
      { name: "Amit Desai", avatar: "AD", role: "Member", status: "offline" },
      { name: "Sneha Reddy", avatar: "SR", role: "Member", status: "online" },
      { name: "You", avatar: "ME", role: "Member", status: "online" },
    ],
    gameDate: "Today, 6:00 PM",
    venue: "Metro Arena, Andheri",
    media: [
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100",
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=100",
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100",
    ]
  };

  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "System", senderAvatar: "", content: "You joined the group", time: "5:00 PM", isMe: false, type: "system" },
    { id: "2", sender: "Rahul Sharma", senderAvatar: "RS", content: "Hey everyone! Ready for the match today?", time: "5:02 PM", isMe: false, type: "text" },
    { id: "3", sender: "Priya Patel", senderAvatar: "PP", content: "Yes! Can't wait 🏃‍♀️", time: "5:03 PM", isMe: false, type: "text" },
    { id: "4", sender: "You", senderAvatar: "ME", content: "I'll be there by 5:45", time: "5:05 PM", isMe: true, type: "text" },
    { id: "5", sender: "Amit Desai", senderAvatar: "AD", content: "Same here, see you all soon", time: "5:08 PM", isMe: false, type: "text" },
    { id: "6", sender: "Rahul Sharma", senderAvatar: "RS", content: "Perfect! I've booked Court 2. Remember to bring water bottles", time: "5:10 PM", isMe: false, type: "text" },
    { id: "7", sender: "Sneha Reddy", senderAvatar: "SR", content: "Thanks for organizing Rahul! 👏", time: "5:12 PM", isMe: false, type: "text" },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "You",
      senderAvatar: "ME",
      content: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      type: "text"
    };
    
    setMessages([...messages, newMessage]);
    setMessage("");
  };

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
              <div className="w-10 h-10 bg-brand-soft rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-green" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm text-foreground">{chatInfo.name}</h3>
                <p className="text-xs text-text-secondary">{chatInfo.members.length} members</p>
              </div>
            </button>
          </SheetTrigger>
          
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            <SheetHeader className="p-4 border-b border-divider">
              <SheetTitle>Group Info</SheetTitle>
            </SheetHeader>
            
            <div className="p-4 space-y-6">
              {/* Group Avatar & Name */}
              <div className="text-center">
                <div className="w-20 h-20 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-10 h-10 text-brand-green" />
                </div>
                <h3 className="font-bold text-lg text-foreground">{chatInfo.name}</h3>
                <p className="text-sm text-text-secondary">Game group • {chatInfo.members.length} members</p>
              </div>
              
              {/* Game Details */}
              <div className="bg-muted rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Game Details</h4>
                <div className="text-sm text-text-secondary">
                  <p>📅 {chatInfo.gameDate}</p>
                  <p>📍 {chatInfo.venue}</p>
                </div>
              </div>
              
              {/* Media */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-foreground">Media Shared</h4>
                  <button className="text-xs text-brand-green">See all</button>
                </div>
                <div className="flex gap-2">
                  {chatInfo.media.map((img, idx) => (
                    <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Members */}
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-3">Members</h4>
                <div className="space-y-2">
                  {chatInfo.members.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                      <div className="relative">
                        <div className="w-10 h-10 bg-brand-soft rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-brand-green">{member.avatar}</span>
                        </div>
                        {member.status === "online" && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-brand-green rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-text-secondary">{member.role}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-tertiary" />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-2">
                <Button variant="outline" className="w-full text-brand-danger border-brand-danger/30 hover:bg-brand-danger/10">
                  Leave Group
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-lg">
            <Phone className="w-5 h-5 text-text-secondary" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg">
            <Video className="w-5 h-5 text-text-secondary" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg" onClick={() => setShowInfo(true)}>
            <Info className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
      </header>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-20">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : msg.type === "system" ? "justify-center" : "justify-start"}`}>
            {msg.type === "system" ? (
              <div className="bg-muted px-3 py-1.5 rounded-full">
                <p className="text-xs text-text-secondary">{msg.content}</p>
              </div>
            ) : (
              <div className={`max-w-[75%] ${msg.isMe ? "" : "flex gap-2"}`}>
                {!msg.isMe && (
                  <div className="w-8 h-8 bg-brand-soft rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-brand-green">{msg.senderAvatar}</span>
                  </div>
                )}
                <div>
                  {!msg.isMe && (
                    <p className="text-xs text-text-secondary mb-1 ml-1">{msg.sender}</p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl ${
                    msg.isMe 
                      ? "bg-brand-green text-white rounded-br-md" 
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <p className={`text-xs text-text-tertiary mt-1 ${msg.isMe ? "text-right mr-1" : "ml-1"}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-divider p-3">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-lg">
            <Paperclip className="w-5 h-5 text-text-secondary" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg">
            <ImageIcon className="w-5 h-5 text-text-secondary" />
          </button>
          
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-muted border-0 h-10"
          />
          
          <button className="p-2 hover:bg-muted rounded-lg">
            <Smile className="w-5 h-5 text-text-secondary" />
          </button>
          
          <Button 
            size="icon" 
            className="bg-brand-green hover:bg-brand-green/90 w-10 h-10 rounded-full"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HubChatRoom;