import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Review {
  id: string;
  venue_id: string;
  user_id: string;
  booking_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export const useReviews = (venueId: string | undefined) => {
  return useQuery({
    queryKey: ["reviews", venueId],
    queryFn: async () => {
      if (!venueId) return [];
      
      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("venue_id", venueId)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      if (!reviewsData || reviewsData.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      
      // Fetch profiles for those users
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, username")
        .in("user_id", userIds);

      // Create a map of user_id to profile
      const profileMap = new Map(
        profilesData?.map(p => [p.user_id, p]) || []
      );

      // Merge reviews with profiles
      const reviewsWithProfiles: Review[] = reviewsData.map(review => ({
        ...review,
        profile: profileMap.get(review.user_id) || undefined,
      }));

      return reviewsWithProfiles;
    },
    enabled: !!venueId,
  });
};

export const useUserReview = (venueId: string | undefined) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-review", venueId, user?.id],
    queryFn: async () => {
      if (!venueId || !user) return null;
      
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("venue_id", venueId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!venueId && !!user,
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      venueId,
      rating,
      comment,
    }: {
      venueId: string;
      rating: number;
      comment?: string;
    }) => {
      if (!user) throw new Error("Must be logged in to submit a review");

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          venue_id: venueId,
          user_id: user.id,
          rating,
          comment: comment || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.venueId] });
      queryClient.invalidateQueries({ queryKey: ["user-review", variables.venueId] });
      queryClient.invalidateQueries({ queryKey: ["venue"] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      reviewId,
      venueId,
      rating,
      comment,
    }: {
      reviewId: string;
      venueId: string;
      rating: number;
      comment?: string;
    }) => {
      if (!user) throw new Error("Must be logged in to update a review");

      const { data, error } = await supabase
        .from("reviews")
        .update({
          rating,
          comment: comment || null,
        })
        .eq("id", reviewId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.venueId] });
      queryClient.invalidateQueries({ queryKey: ["user-review", variables.venueId] });
      queryClient.invalidateQueries({ queryKey: ["venue"] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      reviewId,
      venueId,
    }: {
      reviewId: string;
      venueId: string;
    }) => {
      if (!user) throw new Error("Must be logged in to delete a review");

      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.venueId] });
      queryClient.invalidateQueries({ queryKey: ["user-review", variables.venueId] });
      queryClient.invalidateQueries({ queryKey: ["venue"] });
    },
  });
};
