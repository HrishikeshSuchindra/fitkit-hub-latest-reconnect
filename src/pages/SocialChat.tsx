import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { MessageCircle, Users } from "lucide-react";
import { useState } from "react";

const SocialChat = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  
  const chats = [
    { name: "Football Squad", lastMsg: "See you at 6!", time: "2m ago", unread: 3, isGroup: true },
    { name: "Rahul Sharma", lastMsg: "Ready for tomorrow?", time: "1h ago", unread: 0, isGroup: false },
    { name: "Badminton Gang", lastMsg: "Court booked!", time: "3h ago", unread: 5, isGroup: true },
    { name: "Priya Patel", lastMsg: "Thanks for the game", time: "Yesterday", unread: 0, isGroup: false },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-4">
        <SearchBar placeholder="Search messages..." />
        
        {/* Filter Chips */}
        <div className="flex gap-2">
          {[
            { id: "all", label: "All", count: 16 },
            { id: "chat", label: "Chat", count: 8 },
            { id: "group", label: "Group", count: 5 },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? "bg-brand-green text-white"
                  : "bg-muted text-text-secondary"
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
        
        {/* Chat List */}
        <div className="space-y-2">
          {chats.map((chat, idx) => (
            <div key={idx} className="bg-card rounded-xl shadow-soft p-4 flex items-center gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 bg-brand-soft rounded-full flex items-center justify-center flex-shrink-0">
                {chat.isGroup ? (
                  <Users className="w-6 h-6 text-brand-green" />
                ) : (
                  <span className="text-brand-green font-bold">{chat.name[0]}</span>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm text-foreground truncate">{chat.name}</h4>
                  <span className="text-xs text-text-tertiary">{chat.time}</span>
                </div>
                <p className="text-sm text-text-secondary truncate">{chat.lastMsg}</p>
              </div>
              
              {/* Message Button / Unread Badge */}
              {chat.unread > 0 ? (
                <div className="w-6 h-6 bg-brand-danger rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{chat.unread}</span>
                </div>
              ) : (
                <button className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-text-secondary flex-shrink-0">
                  Message
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <BottomNav mode="social" />
    </div>
  );
};

export default SocialChat;
