import { useState, useRef } from "react";
import { Plus, User } from "lucide-react";
import { useStories, GroupedStories } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";
import { StoryRing } from "./StoryRing";
import { StoryViewer } from "./StoryViewer";
import { StoryAddSheet } from "./StoryAddSheet";
import { cn } from "@/lib/utils";

export const StoriesBar = () => {
  const { user } = useAuth();
  const { groupedStories, isLoading, hasOwnStory, uploadStory, uploading } = useStories();
  const [viewingStories, setViewingStories] = useState<GroupedStories | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleStoryClick = (group: GroupedStories, index: number) => {
    // Find the starting index in the global array
    const globalIndex = groupedStories.findIndex(g => g.user_id === group.user_id);
    setViewingIndex(globalIndex);
    setViewingStories(group);
  };

  const handleNextUser = () => {
    const nextIndex = viewingIndex + 1;
    if (nextIndex < groupedStories.length) {
      setViewingIndex(nextIndex);
      setViewingStories(groupedStories[nextIndex]);
    } else {
      setViewingStories(null);
    }
  };

  const handlePrevUser = () => {
    const prevIndex = viewingIndex - 1;
    if (prevIndex >= 0) {
      setViewingIndex(prevIndex);
      setViewingStories(groupedStories[prevIndex]);
    }
  };

  const handleAddStory = async (file: File, caption?: string) => {
    await uploadStory(file, caption);
    setAddSheetOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 px-4 py-3 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-3 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div 
        ref={scrollRef}
        className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide"
      >
        {/* Add Story Button (if user has no story) or Own Story */}
        {user && !hasOwnStory && (
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setAddSheetOpen(true)}
              className="w-16 h-16 rounded-full border-2 border-dashed border-brand-green/50 flex items-center justify-center bg-brand-soft/30 hover:bg-brand-soft/50 transition-colors"
            >
              <Plus className="w-6 h-6 text-brand-green" />
            </button>
            <span className="text-xs font-medium text-foreground">Add story</span>
          </div>
        )}

        {/* Stories */}
        {groupedStories.map((group, index) => (
          <StoryRing
            key={group.user_id}
            avatarUrl={group.profile.avatar_url}
            displayName={group.profile.display_name || group.profile.username}
            isOwn={user?.id === group.user_id}
            hasUnviewed={group.has_unviewed}
            hasStory={group.stories.length > 0}
            onClick={() => handleStoryClick(group, index)}
            onAddClick={() => setAddSheetOpen(true)}
          />
        ))}

        {/* If no stories at all */}
        {!user && groupedStories.length === 0 && (
          <div className="flex items-center justify-center w-full py-4">
            <p className="text-sm text-text-secondary">Login to see stories</p>
          </div>
        )}
      </div>

      {/* Story Viewer */}
      {viewingStories && (
        <StoryViewer
          group={viewingStories}
          allGroups={groupedStories}
          currentIndex={viewingIndex}
          onClose={() => setViewingStories(null)}
          onNextUser={handleNextUser}
          onPrevUser={handlePrevUser}
        />
      )}

      {/* Add Story Sheet */}
      <StoryAddSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        onSubmit={handleAddStory}
        isUploading={uploading}
      />
    </>
  );
};
