import { useState, useRef, useMemo } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { StoriesBar } from "@/components/stories/StoriesBar";
import { CreatePostSheet } from "@/components/community/CreatePostSheet";
import { CommentsSheet } from "@/components/community/CommentsSheet";
import { PostOptionsSheet } from "@/components/community/PostOptionsSheet";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useCommunityPosts, useTogglePostLike, useUserRole, useDeletePost, CommunityPost } from "@/hooks/useCommunityPosts";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface MockPost {
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
  isMock: true;
}

interface DisplayPost {
  id: string;
  authorId?: string;
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
  isMock: boolean;
}

const MOCK_POSTS: MockPost[] = [
  {
    id: "mock-1",
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
    timeAgo: "2h ago",
    isMock: true
  },
  {
    id: "mock-2",
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
    timeAgo: "4h ago",
    isMock: true
  },
  {
    id: "mock-3",
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
    timeAgo: "6h ago",
    isMock: true
  },
  {
    id: "mock-4",
    user: { name: "Sneha Reddy", username: "sneha_squash", avatar: "" },
    content: "Recovery day at the spa after an intense week of training. Self-care is part of the game! 💆‍♀️ #Recovery #FitkitsWellness",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop",
    likes: 89,
    comments: 15,
    shares: 5,
    isLiked: false,
    isSaved: false,
    timeAgo: "8h ago",
    isMock: true
  },
  {
    id: "mock-5",
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
    timeAgo: "1d ago",
    isMock: true
  }
];

const HubCommunity = () => {
  const { user } = useAuth();
  const { data: userRole } = useUserRole();
  const { data: realPosts, isLoading } = useCommunityPosts();
  const toggleLike = useTogglePostLike();
  const deletePost = useDeletePost();
  
  // Mock post state for local interactions
  const [mockPostState, setMockPostState] = useState<Record<string, { isLiked: boolean; likes: number; isSaved: boolean }>>({});
  
  // Double tap tracking
  const lastTapRef = useRef<{ postId: string; time: number } | null>(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState<string | null>(null);

  // Sheet states
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentsPostUsername, setCommentsPostUsername] = useState<string>("");
  const [optionsPost, setOptionsPost] = useState<DisplayPost | null>(null);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<DisplayPost | null>(null);

  // Check if user can create posts (admin or venue_owner)
  const canCreatePosts = userRole === 'admin' || userRole === 'venue_owner';

  // Convert real posts to display format and merge with mock posts
  const allPosts: DisplayPost[] = useMemo(() => {
    const convertedRealPosts: DisplayPost[] = (realPosts || []).map(post => ({
      id: post.id,
      authorId: post.author_id,
      user: {
        name: post.author?.display_name || 'User',
        username: post.author?.username || 'user',
        avatar: post.author?.avatar_url || undefined,
      },
      content: post.content,
      image: post.image_urls?.[0] || undefined,
      activity: post.sport ? {
        type: 'game' as const,
        sport: post.sport,
      } : undefined,
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      shares: 0,
      isLiked: post.isLiked || false,
      isSaved: false,
      timeAgo: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
      isMock: false,
    }));
    
    // Real posts first, then mock posts
    return [...convertedRealPosts, ...MOCK_POSTS];
  }, [realPosts]);

  const handleToggleLike = (postId: string, isMock: boolean, currentlyLiked: boolean) => {
    if (isMock) {
      // Handle mock post like locally
      setMockPostState(prev => {
        const current = prev[postId] || { 
          isLiked: MOCK_POSTS.find(p => p.id === postId)?.isLiked || false,
          likes: MOCK_POSTS.find(p => p.id === postId)?.likes || 0,
          isSaved: MOCK_POSTS.find(p => p.id === postId)?.isSaved || false,
        };
        return {
          ...prev,
          [postId]: {
            ...current,
            isLiked: !current.isLiked,
            likes: current.isLiked ? current.likes - 1 : current.likes + 1,
          }
        };
      });
    } else {
      // Handle real post like via API
      if (user) {
        toggleLike.mutate({ postId, isCurrentlyLiked: currentlyLiked });
      }
    }
  };

  const handleDoubleTap = (postId: string, isMock: boolean, currentlyLiked: boolean) => {
    if (!currentlyLiked) {
      handleToggleLike(postId, isMock, currentlyLiked);
    }
    setShowHeartAnimation(postId);
    setTimeout(() => setShowHeartAnimation(null), 800);
  };

  const handlePostTap = (postId: string, isMock: boolean, currentlyLiked: boolean) => {
    const now = Date.now();
    if (lastTapRef.current?.postId === postId && now - lastTapRef.current.time < 300) {
      handleDoubleTap(postId, isMock, currentlyLiked);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { postId, time: now };
    }
  };

  const toggleSave = (postId: string, isMock: boolean) => {
    if (isMock) {
      setMockPostState(prev => {
        const current = prev[postId] || { 
          isLiked: MOCK_POSTS.find(p => p.id === postId)?.isLiked || false,
          likes: MOCK_POSTS.find(p => p.id === postId)?.likes || 0,
          isSaved: MOCK_POSTS.find(p => p.id === postId)?.isSaved || false,
        };
        return {
          ...prev,
          [postId]: {
            ...current,
            isSaved: !current.isSaved,
          }
        };
      });
      toast.success(mockPostState[postId]?.isSaved ? "Removed from saved" : "Post saved");
    } else {
      toast.success("Post saved");
    }
  };

  const handleShare = async (post: DisplayPost) => {
    const shareData = {
      title: `Post by ${post.user.username}`,
      text: post.content.substring(0, 100) + (post.content.length > 100 ? "..." : ""),
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== "AbortError") {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied to clipboard");
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const handleDeletePost = async () => {
    if (!deleteConfirmPost || deleteConfirmPost.isMock) return;
    
    try {
      await deletePost.mutateAsync(deleteConfirmPost.id);
      setDeleteConfirmPost(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const getPostState = (post: DisplayPost) => {
    if (post.isMock && mockPostState[post.id]) {
      return {
        isLiked: mockPostState[post.id].isLiked,
        likes: mockPostState[post.id].likes,
        isSaved: mockPostState[post.id].isSaved,
      };
    }
    return {
      isLiked: post.isLiked,
      likes: post.likes,
      isSaved: post.isSaved,
    };
  };

  const getActivityBadge = (activity: DisplayPost['activity']) => {
    if (!activity) return null;
    
    const badges = {
      game: { bg: 'bg-primary/10', text: 'text-primary', label: 'Game Completed' },
      booking: { bg: 'bg-[hsl(var(--chip-purple-bg))]', text: 'text-[hsl(var(--chip-purple-text))]', label: 'Upcoming Booking' },
      achievement: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Achievement Unlocked' }
    };
    
    const badge = badges[activity.type];
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badge.bg} ${badge.text} font-medium`}>
        {badge.label}
      </span>
    );
  };

  const isOwnPost = (post: DisplayPost) => {
    if (post.isMock) return false;
    return user?.id === post.authorId;
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
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading posts...
            </div>
          ) : (
            allPosts.map((post) => {
              const state = getPostState(post);
              
              return (
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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-text-tertiary h-8 w-8"
                      onClick={() => setOptionsPost(post)}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Post Image with Double Tap */}
                  {post.image && (
                    <div 
                      className="relative w-full aspect-square bg-muted cursor-pointer select-none"
                      onClick={() => handlePostTap(post.id, post.isMock, state.isLiked)}
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
                        onClick={() => handleToggleLike(post.id, post.isMock, state.isLiked)}
                        className="active:scale-90 transition-transform"
                      >
                        <Heart 
                          className={`w-6 h-6 transition-colors ${
                            state.isLiked ? 'fill-red-500 text-red-500' : 'text-foreground'
                          }`} 
                        />
                      </button>
                      <button 
                        onClick={() => {
                          setCommentsPostId(post.id);
                          setCommentsPostUsername(post.user.username);
                        }}
                        className="active:scale-90 transition-transform"
                      >
                        <MessageCircle className="w-6 h-6 text-foreground" />
                      </button>
                      <button 
                        onClick={() => handleShare(post)}
                        className="active:scale-90 transition-transform"
                      >
                        <Share2 className="w-6 h-6 text-foreground" />
                      </button>
                    </div>
                    <button 
                      onClick={() => toggleSave(post.id, post.isMock)}
                      className="active:scale-90 transition-transform"
                    >
                      <Bookmark 
                        className={`w-6 h-6 transition-colors ${
                          state.isSaved ? 'fill-foreground text-foreground' : 'text-foreground'
                        }`} 
                      />
                    </button>
                  </div>

                  {/* Likes Count */}
                  <div className="px-4">
                    <p className="text-sm font-semibold text-foreground">{state.likes.toLocaleString()} likes</p>
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
                      <button 
                        onClick={() => {
                          setCommentsPostId(post.id);
                          setCommentsPostUsername(post.user.username);
                        }}
                        className="text-sm text-text-secondary"
                      >
                        View all {post.comments} comments
                      </button>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="px-4 pb-3">
                    <p className="text-xs text-text-tertiary uppercase">{post.timeAgo}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Create Post FAB - Only for admins/venue owners */}
      {canCreatePosts && <CreatePostSheet />}

      {/* Comments Sheet */}
      <CommentsSheet
        open={!!commentsPostId}
        onOpenChange={(open) => {
          if (!open) setCommentsPostId(null);
        }}
        postId={commentsPostId}
        postAuthorUsername={commentsPostUsername}
      />

      {/* Post Options Sheet */}
      <PostOptionsSheet
        open={!!optionsPost}
        onOpenChange={(open) => {
          if (!open) setOptionsPost(null);
        }}
        isOwnPost={optionsPost ? isOwnPost(optionsPost) : false}
        isSaved={optionsPost ? getPostState(optionsPost).isSaved : false}
        onDelete={() => {
          if (optionsPost) {
            setDeleteConfirmPost(optionsPost);
          }
        }}
        onToggleSave={() => {
          if (optionsPost) {
            toggleSave(optionsPost.id, optionsPost.isMock);
          }
        }}
        onShare={() => {
          if (optionsPost) {
            handleShare(optionsPost);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmPost} onOpenChange={(open) => !open && setDeleteConfirmPost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePost.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <BottomNav mode="hub" />
    </div>
  );
};

export default HubCommunity;
