import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Pause, Play, Trash2, Eye, MoreVertical, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStories, GroupedStories, StoryWithProfile } from "@/hooks/useStories";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StoryViewerProps {
  group: GroupedStories;
  allGroups: GroupedStories[];
  currentIndex: number;
  onClose: () => void;
  onNextUser: () => void;
  onPrevUser: () => void;
}

export const StoryViewer = ({
  group,
  allGroups,
  currentIndex,
  onClose,
  onNextUser,
  onPrevUser,
}: StoryViewerProps) => {
  const { user } = useAuth();
  const { markAsViewed, deleteStory, getStoryViewers } = useStories();
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const currentStory = group.stories[storyIndex];
  const isOwnStory = user?.id === group.user_id;
  const STORY_DURATION = 5000; // 5 seconds per story

  // Mark as viewed when story is displayed
  useEffect(() => {
    if (currentStory && !isOwnStory && user) {
      markAsViewed.mutate(currentStory.id);
    }
  }, [currentStory?.id, isOwnStory, user]);

  // Load viewers for own stories
  useEffect(() => {
    if (isOwnStory && currentStory) {
      getStoryViewers(currentStory.id).then(setViewers);
    }
  }, [currentStory?.id, isOwnStory]);

  // Progress timer
  useEffect(() => {
    if (isPaused) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    const startTime = Date.now() - (progress / 100) * STORY_DURATION;
    
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
      
      if (newProgress >= 100) {
        handleNext();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [storyIndex, isPaused, group.user_id]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [storyIndex, group.user_id]);

  const handleNext = useCallback(() => {
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onNextUser();
    }
  }, [storyIndex, group.stories.length, onNextUser]);

  const handlePrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setProgress(0);
    } else {
      onPrevUser();
    }
  }, [storyIndex, onPrevUser]);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    setIsPaused(false);

    // If it's a tap (not a swipe)
    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) {
      const screenWidth = window.innerWidth;
      const tapX = touchEndX;
      
      if (tapX < screenWidth / 3) {
        handlePrev();
      } else if (tapX > (screenWidth * 2) / 3) {
        handleNext();
      }
    } else if (Math.abs(deltaY) > 100 && deltaY > 0) {
      // Swipe down to close
      onClose();
    }
  };

  const handleDelete = async () => {
    if (currentStory) {
      await deleteStory.mutateAsync(currentStory.id);
      if (group.stories.length <= 1) {
        onClose();
      } else if (storyIndex >= group.stories.length - 1) {
        setStoryIndex(prev => prev - 1);
      }
    }
  };

  // Reset story index when group changes
  useEffect(() => {
    setStoryIndex(0);
    setProgress(0);
  }, [group.user_id]);

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 px-2 pt-2 pb-1">
        {group.stories.map((_, index) => (
          <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{
                width: index < storyIndex 
                  ? '100%' 
                  : index === storyIndex 
                    ? `${progress}%` 
                    : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20">
            {group.profile.avatar_url ? (
              <img 
                src={group.profile.avatar_url} 
                alt="" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm">
              {group.profile.display_name || group.profile.username || 'User'}
            </span>
            <span className="text-white/70 text-xs">
              {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPaused(!isPaused)}
            className="text-white hover:bg-white/20"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </Button>

          {isOwnStory && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Story
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Story content */}
      <div
        className="w-full h-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentStory.media_type === 'video' ? (
          <video
            src={currentStory.media_url}
            className="max-w-full max-h-full object-contain"
            autoPlay
            playsInline
            muted={false}
          />
        ) : (
          <img
            src={currentStory.media_url}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-20 left-0 right-0 px-4 z-10">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-3">
            <p className="text-white text-sm">{currentStory.caption}</p>
          </div>
        </div>
      )}

      {/* Navigation arrows (desktop) */}
      {currentIndex > 0 && (
        <button
          onClick={onPrevUser}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors hidden md:flex"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      {currentIndex < allGroups.length - 1 && (
        <button
          onClick={onNextUser}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors hidden md:flex"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Viewers button (own stories only) */}
      {isOwnStory && (
        <button
          onClick={() => setShowViewers(true)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
        >
          <Eye className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">{currentStory.view_count} views</span>
        </button>
      )}

      {/* Viewers Sheet */}
      <Sheet open={showViewers} onOpenChange={setShowViewers}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>Story Views</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {viewers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No views yet</p>
            ) : (
              viewers.map((viewer) => (
                <div key={viewer.viewer_id} className="flex items-center gap-3 p-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                    {viewer.profile.avatar_url ? (
                      <img src={viewer.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {viewer.profile.display_name || viewer.profile.username || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(viewer.viewed_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
