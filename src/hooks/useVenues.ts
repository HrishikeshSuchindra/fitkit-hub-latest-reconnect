import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables } from "@/integrations/supabase/types";

// Seeded database images point to /<filename>.jpg; map them to bundled assets.
import venueFootball from "@/assets/venue-football.jpg";
import venueBadminton from "@/assets/venue-badminton.jpg";
import venueCricket from "@/assets/venue-cricket.jpg";
import venuePickleball from "@/assets/venue-pickleball.jpg";
import venueBasketball from "@/assets/venue-basketball.jpg";
import venueTableTennis from "@/assets/venue-tabletennis.jpg";
import venueSquash from "@/assets/venue-squash.jpg";
import venueTennis from "@/assets/venue-tennis.jpg";
import recoverySwimming from "@/assets/recovery-swimming.jpg";
import recoveryIcebath from "@/assets/recovery-icebath.jpg";
import recoveryMassage from "@/assets/recovery-massage.jpg";
import recoverySauna from "@/assets/recovery-sauna.jpg";
import recoveryYoga from "@/assets/recovery-yoga.jpg";
import studioYoga from "@/assets/studio-yoga.jpg";
import studioGym from "@/assets/studio-gym.jpg";

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

// Helper to get image URL (handles bundled assets + direct URLs)
export const getVenueImageUrl = (imageUrl: string | null): string => {
  if (!imageUrl) return "/placeholder.svg";

  // Seeded data uses absolute paths like /venue-football.jpg. Those files are bundled in src/assets.
  const normalized = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  const mapped = SEEDED_IMAGE_MAP[normalized];
  if (mapped) return mapped;

  // If it starts with http, it's already a valid URL
  if (imageUrl.startsWith("http")) return imageUrl;

  // Otherwise serve as app-relative path
  return normalized;
};

const SEEDED_IMAGE_MAP: Record<string, string> = {
  "/venue-football.jpg": venueFootball,
  "/venue-badminton.jpg": venueBadminton,
  "/venue-cricket.jpg": venueCricket,
  "/venue-pickleball.jpg": venuePickleball,
  "/venue-basketball.jpg": venueBasketball,
  "/venue-tabletennis.jpg": venueTableTennis,
  "/venue-squash.jpg": venueSquash,
  "/venue-tennis.jpg": venueTennis,
  "/recovery-swimming.jpg": recoverySwimming,
  "/recovery-icebath.jpg": recoveryIcebath,
  "/recovery-massage.jpg": recoveryMassage,
  "/recovery-sauna.jpg": recoverySauna,
  "/recovery-yoga.jpg": recoveryYoga,
  "/studio-yoga.jpg": studioYoga,
  "/studio-gym.jpg": studioGym,
};
