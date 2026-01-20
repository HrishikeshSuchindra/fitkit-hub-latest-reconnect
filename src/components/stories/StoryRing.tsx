import { Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryRingProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  isOwn?: boolean;
  hasUnviewed?: boolean;
  hasStory?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  onAddClick?: () => void;
}

export const StoryRing = ({
  avatarUrl,
  displayName,
  isOwn = false,
  hasUnviewed = false,
  hasStory = false,
  size = "md",
  onClick,
  onAddClick,
}: StoryRingProps) => {
  const sizeClasses = {
    sm: "w-14 h-14",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  const innerSizeClasses = {
    sm: "w-12 h-12",
    md: "w-14 h-14",
    lg: "w-18 h-18",
  };

  const ringClasses = cn(
    "rounded-full p-0.5 transition-all",
    hasUnviewed && hasStory && "bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-600",
    !hasUnviewed && hasStory && "bg-gradient-to-tr from-muted-foreground/40 to-muted-foreground/60",
    !hasStory && "bg-transparent"
  );

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <button
          onClick={onClick}
          className={cn(sizeClasses[size], ringClasses, "flex-shrink-0")}
        >
          <div className={cn(
            innerSizeClasses[size],
            "rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-background"
          )}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={displayName || "User"} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-brand-soft flex items-center justify-center">
                <User className="w-5 h-5 text-brand-green" />
              </div>
            )}
          </div>
        </button>
        
        {isOwn && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddClick?.();
            }}
            className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-brand-green rounded-full flex items-center justify-center border-2 border-background shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>
      
      <span className={cn(
        "text-xs font-medium truncate max-w-16 text-center",
        isOwn ? "text-foreground" : "text-text-secondary"
      )}>
        {isOwn ? "Your story" : (displayName?.split(' ')[0] || "User")}
      </span>
    </div>
  );
};
