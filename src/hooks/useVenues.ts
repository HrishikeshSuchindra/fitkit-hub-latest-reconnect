import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables } from "@/integrations/supabase/types";

export type Venue = Tables<"venues">;

// Fetch venues by category and optional sport filter
export const useVenues = (category?: string, sport?: string) => {
  return useQuery({
    queryKey: ["venues", category, sport],
    queryFn: async () => {
      let query = supabase.from("venues").select("*");

      if (category) {
        query = query.eq("category", category);
      }

      if (sport && sport !== "all") {
        query = query.eq("sport", sport);
      }

      const { data, error } = await query.order("rating", { ascending: false });

      if (error) throw error;
      return data as Venue[];
    },
  });
};

// Fetch venue counts by sport for a category
export const useVenueCounts = (category: string) => {
  return useQuery({
    queryKey: ["venue-counts", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venues")
        .select("sport")
        .eq("category", category);

      if (error) throw error;

      // Count venues per sport
      const counts: Record<string, number> = { all: data.length };
      data.forEach((venue) => {
        counts[venue.sport] = (counts[venue.sport] || 0) + 1;
      });

      return counts;
    },
  });
};

// Fetch a single venue by ID or slug
export const useVenueById = (idOrSlug: string) => {
  return useQuery({
    queryKey: ["venue", idOrSlug],
    queryFn: async () => {
      // Try to fetch by ID first
      let { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("id", idOrSlug)
        .maybeSingle();

      // If not found by ID, try by slug
      if (!data) {
        const result = await supabase
          .from("venues")
          .select("*")
          .eq("slug", idOrSlug)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data as Venue | null;
    },
    enabled: !!idOrSlug,
  });
};

// Search venues by name
export const useVenueSearch = (query: string) => {
  return useQuery({
    queryKey: ["venue-search", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .ilike("name", `%${query}%`)
        .order("rating", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Venue[];
    },
    enabled: query.length >= 2,
  });
};

// Fetch user's favorite venues
export const useFavoriteVenues = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorite-venues", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("favorites")
        .select("venue_id, venues(*)")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((fav) => fav.venues) as Venue[];
    },
    enabled: !!user,
  });
};

// Check if a venue is favorited
export const useIsFavorite = (venueId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-favorite", venueId, user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("venue_id", venueId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!venueId,
  });
};

// Toggle favorite status
export const useToggleFavorite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ venueId, isFavorite }: { venueId: string; isFavorite: boolean }) => {
      if (!user) throw new Error("User not authenticated");

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("venue_id", venueId);
        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, venue_id: venueId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { venueId }) => {
      queryClient.invalidateQueries({ queryKey: ["is-favorite", venueId] });
      queryClient.invalidateQueries({ queryKey: ["favorite-venues"] });
    },
  });
};

// Helper to get image URL (handles both local assets and database paths)
export const getVenueImageUrl = (imageUrl: string | null): string => {
  if (!imageUrl) return "/placeholder.svg";
  
  // If it starts with http or /, it's already a valid path
  if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) {
    return imageUrl;
  }
  
  return `/${imageUrl}`;
};
