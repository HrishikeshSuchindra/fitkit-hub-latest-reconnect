import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useEffect } from "react";

// Fetch blocked slots for a venue on a specific date
export const useSlotBlocks = (venueId: string, date: Date) => {
  const formattedDate = format(date, "yyyy-MM-dd");

  const query = useQuery({
    queryKey: ["slot-blocks", venueId, formattedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slot_blocks")
        .select("slot_time, reason")
        .eq("venue_id", venueId)
        .eq("slot_date", formattedDate);

      if (error) throw error;
      
      // Return a set of blocked slot times
      const blockedSlots: Record<string, string | null> = {};
      data?.forEach((block) => {
        blockedSlots[block.slot_time] = block.reason;
      });
      
      return blockedSlots;
    },
  });

  // Subscribe to realtime updates for slot blocks
  useEffect(() => {
    const channel = supabase
      .channel(`slot-blocks-${venueId}-${formattedDate}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "slot_blocks",
          filter: `venue_id=eq.${venueId}`,
        },
        () => {
          // Refetch when slot blocks change
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [venueId, formattedDate, query]);

  return query;
};
