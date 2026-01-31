import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Image, X, Loader2 } from "lucide-react";
import { useCreatePost } from "@/hooks/useCommunityPosts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const SPORTS = [
  { value: "badminton", label: "Badminton" },
  { value: "football", label: "Football" },
  { value: "cricket", label: "Cricket" },
  { value: "tennis", label: "Tennis" },
  { value: "basketball", label: "Basketball" },
  { value: "swimming", label: "Swimming" },
  { value: "yoga", label: "Yoga" },
  { value: "gym", label: "Gym" },
  { value: "other", label: "Other" },
];

interface CreatePostSheetProps {
  trigger?: React.ReactNode;
}

export const CreatePostSheet = ({ trigger }: CreatePostSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [sport, setSport] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const createPost = useCreatePost();
  
  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (imageUrls.length + files.length > 4) {
      toast.error("Maximum 4 images allowed");
      return;
    }
    
    setIsUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Image must be less than 5MB");
          continue;
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("post-media")
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("post-media")
          .getPublicUrl(fileName);
        
        setImageUrls(prev => [...prev, publicUrl]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please write something");
      return;
    }
    
    await createPost.mutateAsync({
      content: content.trim(),
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      sport: sport || undefined,
    });
    
    // Reset form
    setContent("");
    setSport("");
    setImageUrls([]);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button 
            className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary shadow-lg z-40"
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle>Create Post</SheetTitle>
            <Button 
              onClick={handleSubmit}
              disabled={!content.trim() || createPost.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createPost.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Post
            </Button>
          </div>
        </SheetHeader>
        
        <div className="py-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">
                {profile?.display_name || "User"}
              </p>
              <p className="text-sm text-muted-foreground">
                @{profile?.username || "user"}
              </p>
            </div>
          </div>
          
          {/* Content */}
          <Textarea
            placeholder="Share your game experience, achievement, or thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none border-none text-base focus-visible:ring-0 p-0"
          />
          
          {/* Image Preview */}
          {imageUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img 
                    src={url} 
                    alt={`Upload ${index + 1}`} 
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Sport Tag */}
          <Select value={sport} onValueChange={setSport}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tag a sport (optional)" />
            </SelectTrigger>
            <SelectContent>
              {SPORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || imageUrls.length >= 4}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Image className="w-4 h-4 mr-2" />
              )}
              Add Photo
            </Button>
            <span className="text-xs text-muted-foreground">
              {imageUrls.length}/4 images
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
