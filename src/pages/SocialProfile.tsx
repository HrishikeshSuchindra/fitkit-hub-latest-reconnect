import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Share2 } from "lucide-react";

const SocialProfile = () => {
  const friends = [
    { name: "Rahul Sharma", status: "online", time: "2m ago" },
    { name: "Priya Patel", status: "online", time: "5m ago" },
    { name: "Amit Desai", status: "offline", time: "2h ago" },
    { name: "Sneha Reddy", status: "offline", time: "1d ago" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      {/* Profile Header with Gradient */}
      <div className="relative bg-gradient-to-br from-chip-purple-text to-chip-purple-bg pt-8 pb-20">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-soft flex items-center justify-center">
              <Users className="w-12 h-12 text-brand-green" />
            </div>
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          
          {/* User Info */}
          <h2 className="mt-4 text-2xl font-bold text-white">Arjun Kumar</h2>
          <p className="text-white/80 text-sm">@arjunkumar</p>
          
          {/* Stats */}
          <div className="flex gap-8 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">248</p>
              <p className="text-xs text-white/70">Games</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">156</p>
              <p className="text-xs text-white/70">Friends</p>
            </div>
          </div>
          
          {/* Edit Button */}
          <Button className="mt-4 bg-white text-chip-purple-text hover:bg-white/90 rounded-full px-6">
            Edit Profile
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-5 -mt-10 space-y-5">
        {/* Friends List Card */}
        <div className="bg-card rounded-2xl shadow-soft p-4">
          <h3 className="font-bold text-lg text-foreground mb-4">Friends</h3>
          
          {/* Online Friends */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Online</p>
            {friends.filter(f => f.status === "online").map((friend, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2">
                <div className="relative">
                  <div className="w-10 h-10 bg-brand-soft rounded-full flex items-center justify-center">
                    <span className="text-brand-green font-bold text-sm">{friend.name[0]}</span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{friend.name}</p>
                  <p className="text-xs text-text-tertiary">{friend.time}</p>
                </div>
                <Button className="bg-brand-green hover:bg-brand-green/90 text-white h-8 px-4 text-xs rounded-lg">
                  Invite
                </Button>
              </div>
            ))}
          </div>
          
          {/* Offline Friends */}
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Offline</p>
            {friends.filter(f => f.status === "offline").map((friend, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-text-secondary font-bold text-sm">{friend.name[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{friend.name}</p>
                  <p className="text-xs text-text-tertiary">{friend.time}</p>
                </div>
                <Button variant="outline" className="h-8 px-4 text-xs rounded-lg">
                  Message
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Invite CTA Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Invite More Friends</h3>
          <p className="text-sm text-white/80 mb-4">Play together and earn rewards</p>
          <Button className="bg-white text-blue-600 hover:bg-white/90 rounded-full px-6 font-semibold">
            <Share2 className="w-4 h-4 mr-2" />
            Share Invite Code
          </Button>
        </div>
      </div>
      
      <BottomNav mode="social" />
    </div>
  );
};

export default SocialProfile;
