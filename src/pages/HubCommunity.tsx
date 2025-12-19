import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Post {
  id: string;
  user: {
    name: string;
    username: string;
    avatar?: string;
  };
  content: string;
  image?: string;
  activity?: {
    type: 'game' | 'booking' | 'achievement';
    sport?: string;
    venue?: string;
    date?: string;
    players?: number;
  };
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  timeAgo: string;
}

const HubCommunity = () => {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      user: { name: "Rahul Sharma", username: "rahul_plays", avatar: "" },
      content: "Just had an amazing badminton session at Phoenix Arena! 🏸 The new courts are incredible. Who's up for doubles this weekend?",
      image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&h=400&fit=crop",
      activity: {
        type: 'game',
        sport: 'Badminton',
        venue: 'Phoenix Sports Arena',
        players: 4
      },
      likes: 24,
      comments: 8,
      shares: 2,
      isLiked: false,
      isSaved: false,
      timeAgo: "2h ago"
    },
    {
      id: "2",
      user: { name: "Priya Patel", username: "priya_fitness", avatar: "" },
      content: "🎾 Finally hit my 100th game milestone! Thanks to everyone who's played with me this year. Here's to many more! #FitkitsFam",
      activity: {
        type: 'achievement',
        sport: 'Tennis',
      },
      likes: 156,
      comments: 32,
      shares: 12,
      isLiked: true,
      isSaved: true,
      timeAgo: "4h ago"
    },
    {
      id: "3",
      user: { name: "Amit Desai", username: "amit_cricket", avatar: "" },
      content: "Booking confirmed for Saturday morning cricket! 🏏 Need 3 more players to complete the team. Drop a comment if you're in!",
      image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&h=400&fit=crop",
      activity: {
        type: 'booking',
        sport: 'Cricket',
        venue: 'Stadium Cricket Nets',
        date: 'Saturday, 7:00 AM',
        players: 8
      },
      likes: 18,
      comments: 12,
      shares: 1,
      isLiked: false,
      isSaved: false,
      timeAgo: "6h ago"
    },
    {
      id: "4",
      user: { name: "Sneha Reddy", username: "sneha_squash", avatar: "" },
      content: "Recovery day at the spa after an intense week of training. Self-care is part of the game! 💆‍♀️ #Recovery #FitkitsWellness",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop",
      likes: 89,
      comments: 15,
      shares: 5,
      isLiked: false,
      isSaved: false,
      timeAgo: "8h ago"
    },
    {
      id: "5",
      user: { name: "Vikram Kumar", username: "vikram_hoops", avatar: "" },
      content: "Epic basketball showdown at Slam Dunk Courts yesterday! 🏀 Our team pulled through in the final quarter. What a game!",
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop",
      activity: {
        type: 'game',
        sport: 'Basketball',
        venue: 'Slam Dunk Courts',
        players: 10
      },
      likes: 67,
      comments: 21,
      shares: 8,
      isLiked: true,
      isSaved: false,
      timeAgo: "1d ago"
    }
  ]);

  const toggleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const toggleSave = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isSaved: !post.isSaved }
        : post
    ));
  };

  const getActivityBadge = (activity: Post['activity']) => {
    if (!activity) return null;
    
    const badges = {
      game: { bg: 'bg-primary/10', text: 'text-primary', label: 'Game Completed' },
      booking: { bg: 'bg-[hsl(var(--chip-purple-bg))]', text: 'text-[hsl(var(--chip-purple-text))]', label: 'Upcoming Booking' },
      achievement: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Achievement Unlocked' }
    };
    
    const badge = badges[activity.type];
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badge.bg} ${badge.text} font-medium`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-4 py-4 space-y-4">
        <SearchBar placeholder="Search community..." />
        
        {/* Stories/Quick Actions Row */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex flex-col items-center gap-1 min-w-[70px]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white border-2 border-white shadow-soft">
              <span className="text-2xl">+</span>
            </div>
            <span className="text-xs text-text-secondary">Your Story</span>
          </div>
          {['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram'].map((name, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 min-w-[70px]">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-0.5">
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-semibold text-text-secondary">{name[0]}</span>
                </div>
              </div>
              <span className="text-xs text-text-secondary">{name}</span>
            </div>
          ))}
        </div>

        {/* Feed Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-card rounded-2xl shadow-soft overflow-hidden">
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={post.user.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {post.user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{post.user.name}</p>
                    <p className="text-xs text-text-tertiary">@{post.user.username} · {post.timeAgo}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-text-tertiary">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </div>

              {/* Activity Badge */}
              {post.activity && (
                <div className="px-4 pb-2">
                  {getActivityBadge(post.activity)}
                </div>
              )}

              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="text-foreground text-sm leading-relaxed">{post.content}</p>
              </div>

              {/* Activity Details */}
              {post.activity && (post.activity.venue || post.activity.date || post.activity.players) && (
                <div className="mx-4 mb-3 p-3 bg-muted rounded-xl space-y-2">
                  {post.activity.sport && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">{post.activity.sport}</span>
                    </div>
                  )}
                  {post.activity.venue && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{post.activity.venue}</span>
                    </div>
                  )}
                  {post.activity.date && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{post.activity.date}</span>
                    </div>
                  )}
                  {post.activity.players && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Users className="w-3.5 h-3.5" />
                      <span>{post.activity.players} players</span>
                    </div>
                  )}
                </div>
              )}

              {/* Post Image */}
              {post.image && (
                <div className="w-full aspect-video bg-muted">
                  <img 
                    src={post.image} 
                    alt="Post" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="p-4 flex items-center justify-between border-t border-border/50">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleLike(post.id)}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <Heart 
                      className={`w-5 h-5 transition-colors ${
                        post.isLiked ? 'fill-red-500 text-red-500' : 'text-text-secondary'
                      }`} 
                    />
                    <span className={post.isLiked ? 'text-red-500 font-medium' : 'text-text-secondary'}>
                      {post.likes}
                    </span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <Share2 className="w-5 h-5" />
                    <span>{post.shares}</span>
                  </button>
                </div>
                <button onClick={() => toggleSave(post.id)}>
                  <Bookmark 
                    className={`w-5 h-5 transition-colors ${
                      post.isSaved ? 'fill-foreground text-foreground' : 'text-text-secondary'
                    }`} 
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <BottomNav mode="hub" />
    </div>
  );
};

export default HubCommunity;