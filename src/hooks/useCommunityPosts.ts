import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface CommunityPost {
  id: string;
  content: string;
  image_urls: string[] | null;
  sport: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_id: string;
  visibility: string | null;
  author?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  isLiked?: boolean;
}

export const useCommunityPosts = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["community-posts"],
    queryFn: async (): Promise<CommunityPost[]> => {
      // Fetch posts with author profile
      const { data: posts, error } = await supabase
        .from("posts")
        .select(`
          id,
          content,
          image_urls,
          sport,
          likes_count,
          comments_count,
          created_at,
          author_id,
          visibility
        `)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      if (!posts || posts.length === 0) return [];
      
      // Fetch author profiles
      const authorIds = [...new Set(posts.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", authorIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      // Fetch user's likes if logged in
      let userLikes: Set<string> = new Set();
      if (user) {
        const { data: likes } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", user.id);
        userLikes = new Set(likes?.map(l => l.post_id) || []);
      }
      
      return posts.map(post => ({
        ...post,
        author: profileMap.get(post.author_id) || null,
        isLiked: userLikes.has(post.id),
      }));
    },
  });
};

export const useTogglePostLike = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, isCurrentlyLiked }: { postId: string; isCurrentlyLiked: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, isCurrentlyLiked }) => {
      await queryClient.cancelQueries({ queryKey: ["community-posts"] });
      
      const previousPosts = queryClient.getQueryData<CommunityPost[]>(["community-posts"]);
      
      queryClient.setQueryData<CommunityPost[]>(["community-posts"], old => 
        old?.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: !isCurrentlyLiked, 
                likes_count: post.likes_count + (isCurrentlyLiked ? -1 : 1) 
              }
            : post
        )
      );
      
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["community-posts"], context.previousPosts);
      }
      toast.error("Failed to update like");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
};

export const useCreatePost = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ content, imageUrls, sport }: { 
      content: string; 
      imageUrls?: string[]; 
      sport?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");
      
      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          content,
          image_urls: imageUrls || null,
          sport: sport || null,
          visibility: "public",
          likes_count: 0,
          comments_count: 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Post created successfully!");
    },
    onError: (error) => {
      console.error("Failed to create post:", error);
      toast.error("Failed to create post");
    },
  });
};

export const useUserRole = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      // Return the highest priority role
      const roles = data?.map(r => r.role) || [];
      if (roles.includes("admin")) return "admin";
      if (roles.includes("venue_owner")) return "venue_owner";
      if (roles.includes("moderator")) return "moderator";
      return "user";
    },
    enabled: !!user,
  });
};
