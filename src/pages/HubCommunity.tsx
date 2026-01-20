import { useState, useRef } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { StoriesBar } from "@/components/stories/StoriesBar";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

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

  // Double tap tracking
  const lastTapRef = useRef<{ postId: string; time: number } | null>(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState<string | null>(null);

  const toggleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleDoubleTap = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post && !post.isLiked) {
      toggleLike(postId);
    }
    // Show heart animation
    setShowHeartAnimation(postId);
    setTimeout(() => setShowHeartAnimation(null), 800);
  };

  const handlePostTap = (postId: string) => {
    const now = Date.now();
    if (lastTapRef.current?.postId === postId && now - lastTapRef.current.time < 300) {
      handleDoubleTap(postId);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { postId, time: now };
    }
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
      
      <div className="space-y-0">
        <div className="px-4 py-4">
          <SearchBar placeholder="Search community..." />
        </div>
        
        {/* Stories Bar */}
        <StoriesBar />

        {/* Feed Posts - Instagram Style */}
        <div className="divide-y divide-border/50">
          {posts.map((post) => (
            <div key={post.id} className="bg-card">
              {/* Post Header */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                    <AvatarImage src={post.user.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                      {post.user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{post.user.username}</p>
                    {post.activity?.venue && (
                      <p className="text-xs text-text-tertiary">{post.activity.venue}</p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-text-tertiary h-8 w-8">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </div>

              {/* Post Image with Double Tap */}
              {post.image && (
                <div 
                  className="relative w-full aspect-square bg-muted cursor-pointer select-none"
                  onClick={() => handlePostTap(post.id)}
                >
                  <img 
                    src={post.image} 
                    alt="Post" 
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {/* Heart Animation */}
                  <AnimatePresence>
                    {showHeartAnimation === post.id && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        <Heart className="w-24 h-24 fill-white text-white drop-shadow-lg" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Actions Row */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleLike(post.id)}
                    className="active:scale-90 transition-transform"
                  >
                    <Heart 
                      className={`w-6 h-6 transition-colors ${
                        post.isLiked ? 'fill-red-500 text-red-500' : 'text-foreground'
                      }`} 
                    />
                  </button>
                  <button className="active:scale-90 transition-transform">
                    <MessageCircle className="w-6 h-6 text-foreground" />
                  </button>
                  <button className="active:scale-90 transition-transform">
                    <Share2 className="w-6 h-6 text-foreground" />
                  </button>
                </div>
                <button 
                  onClick={() => toggleSave(post.id)}
                  className="active:scale-90 transition-transform"
                >
                  <Bookmark 
                    className={`w-6 h-6 transition-colors ${
                      post.isSaved ? 'fill-foreground text-foreground' : 'text-foreground'
                    }`} 
                  />
                </button>
              </div>

              {/* Likes Count */}
              <div className="px-4">
                <p className="text-sm font-semibold text-foreground">{post.likes.toLocaleString()} likes</p>
              </div>

              {/* Caption */}
              <div className="px-4 pt-1 pb-2">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{post.user.username}</span>{' '}
                  {post.content}
                </p>
              </div>

              {/* Activity Details */}
              {post.activity && (post.activity.venue || post.activity.date || post.activity.players) && (
                <div className="mx-4 mb-2 p-3 bg-muted/50 rounded-xl space-y-1.5">
                  {post.activity.sport && (
                    <div className="flex items-center gap-2">
                      {getActivityBadge(post.activity)}
                      <span className="text-xs font-medium text-foreground">{post.activity.sport}</span>
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

              {/* View Comments */}
              {post.comments > 0 && (
                <div className="px-4 pb-1">
                  <button className="text-sm text-text-secondary">
                    View all {post.comments} comments
                  </button>
                </div>
              )}

              {/* Timestamp */}
              <div className="px-4 pb-3">
                <p className="text-xs text-text-tertiary uppercase">{post.timeAgo}</p>
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