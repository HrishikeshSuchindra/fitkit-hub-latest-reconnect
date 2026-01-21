// Admin Slot Blocks API - Manage blocked time slots for venues
// Endpoints: GET (list blocks, slot availability), POST (create block), DELETE (remove block)
// Venue owners can only manage blocks for their own venues

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  authenticateUser, 
  createServiceClient, 
  logAdminAction,
  corsHeaders 
} from "../_shared/auth-middleware.ts";

// Sport-based slot durations in minutes
const SLOT_DURATIONS: Record<string, number> = {
  football: 60,
  cricket: 120,
  tennis: 60,
  badminton: 30,
  squash: 30,
  tabletennis: 30,
  pickleball: 30,
  basketball: 60,
  default: 30
};

// Generate all time slots for a venue based on opening/closing times and sport
function generateAllSlots(openTime: string, closeTime: string, sport: string): string[] {
  const duration = SLOT_DURATIONS[sport?.toLowerCase()] || SLOT_DURATIONS.default;
  const slots: string[] = [];
  
  const [openHour, openMin] = openTime.split(":").map(Number);
  const [closeHour, closeMin] = closeTime.split(":").map(Number);
  
  let currentMinutes = openHour * 60 + openMin;
  const endMinutes = closeHour * 60 + closeMin;
  
  while (currentMinutes + duration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    slots.push(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`);
    currentMinutes += duration;
  }
  
  return slots;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate user
  const auth = await authenticateUser(req);
  if (auth.error) return auth.error;

  const supabase = createServiceClient();
  const url = new URL(req.url);

  // Check if user is admin
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.userId);

  const isAdmin = userRoles?.some(r => r.role === "admin");

  // Get venues owned by user
  const { data: ownedVenues } = await supabase
    .from("venues")
    .select("id, name")
    .eq("owner_id", auth.userId);

  const ownedVenueIds = ownedVenues?.map(v => v.id) || [];
  const isVenueOwner = ownedVenueIds.length > 0;

  // Must be either admin or venue owner to access
  if (!isAdmin && !isVenueOwner) {
    return new Response(
      JSON.stringify({ error: "Access denied. You must be an admin or venue owner." }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    if (req.method === "GET") {
      const action = url.searchParams.get("action");
      
      // NEW: Slot availability endpoint for Admin App
      if (action === "slot_availability") {
        const venueId = url.searchParams.get("venue_id");
        const date = url.searchParams.get("date");
        
        if (!venueId || !date) {
          return new Response(
            JSON.stringify({ error: "venue_id and date are required for slot_availability" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Verify ownership (unless admin)
        if (!isAdmin && !ownedVenueIds.includes(venueId)) {
          return new Response(
            JSON.stringify({ error: "You can only view availability for venues you own" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Fetch venue configuration
        const { data: venue, error: venueError } = await supabase
          .from("venues")
          .select("opening_time, closing_time, total_courts, sport, name")
          .eq("id", venueId)
          .single();
        
        if (venueError || !venue) {
          return new Response(
            JSON.stringify({ error: "Venue not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Fetch bookings for this date
        const { data: bookings } = await supabase
          .from("bookings")
          .select("slot_time, court_number")
          .eq("venue_id", venueId)
          .eq("slot_date", date)
          .eq("status", "confirmed");
        
        // Fetch blocks for this date
        const { data: blocks } = await supabase
          .from("slot_blocks")
          .select("slot_time, reason")
          .eq("venue_id", venueId)
          .eq("slot_date", date);
        
        // Generate all time slots based on venue config
        const allSlots = generateAllSlots(
          venue.opening_time || "06:00", 
          venue.closing_time || "22:00", 
          venue.sport
        );
        
        // Merge booking counts and block status
        const slotsWithStatus = allSlots.map(time => {
          const bookedCourts = (bookings || []).filter(b => b.slot_time === time).length;
          const block = (blocks || []).find(b => b.slot_time === time);
          
          return {
            time,
            booked_courts: bookedCourts,
            is_blocked: !!block,
            block_reason: block?.reason || null
          };
        });
        
        return new Response(
          JSON.stringify({
            slots: slotsWithStatus,
            venue: {
              name: venue.name,
              total_courts: venue.total_courts || 1,
              opening_time: venue.opening_time || "06:00",
              closing_time: venue.closing_time || "22:00",
              sport: venue.sport
            }
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Existing: List slot blocks for a venue
      const venueId = url.searchParams.get("venue_id");
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
      const offset = (page - 1) * limit;

      let query = supabase
        .from("slot_blocks")
        .select("*, venues(name)", { count: "exact" });

      // Non-admins can only see blocks for venues they own
      if (!isAdmin) {
        if (venueId) {
          if (!ownedVenueIds.includes(venueId)) {
            return new Response(
              JSON.stringify({ error: "You can only view blocks for venues you own" }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          query = query.eq("venue_id", venueId);
        } else {
          query = query.in("venue_id", ownedVenueIds);
        }
      } else if (venueId) {
        query = query.eq("venue_id", venueId);
      }

      // Apply date filters
      if (dateFrom) {
        query = query.gte("slot_date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("slot_date", dateTo);
      }

      // Apply pagination and ordering
      query = query
        .range(offset, offset + limit - 1)
        .order("slot_date", { ascending: true })
        .order("slot_time", { ascending: true });

      const { data: blocks, error, count } = await query;

      if (error) {
        console.error("Error fetching slot blocks:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch slot blocks" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          blocks,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST") {
      const { venue_id, slot_date, slot_time, reason, slots, block_full_day } = await req.json();

      // NEW: Handle full day blocking
      if (block_full_day) {
        if (!venue_id || !slot_date) {
          return new Response(
            JSON.stringify({ error: "venue_id and slot_date are required for full day block" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Verify ownership (unless admin)
        if (!isAdmin && !ownedVenueIds.includes(venue_id)) {
          return new Response(
            JSON.stringify({ error: "You can only block slots for venues you own" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Fetch venue config
        const { data: venue, error: venueError } = await supabase
          .from("venues")
          .select("opening_time, closing_time, sport")
          .eq("id", venue_id)
          .single();
        
        if (venueError || !venue) {
          return new Response(
            JSON.stringify({ error: "Venue not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Generate all time slots for the day
        const allSlots = generateAllSlots(
          venue.opening_time || "06:00", 
          venue.closing_time || "22:00", 
          venue.sport
        );
        
        // Create block entries for all slots
        const blocksToCreate = allSlots.map(time => ({
          venue_id,
          slot_date,
          slot_time: time,
          reason: reason || "Full day block",
          blocked_by: auth.userId
        }));
        
        // Bulk upsert
        const { data: createdBlocks, error } = await supabase
          .from("slot_blocks")
          .upsert(blocksToCreate, { onConflict: "venue_id,slot_date,slot_time" })
          .select();
        
        if (error) {
          console.error("Error creating full day block:", error);
          return new Response(
            JSON.stringify({ error: "Failed to create full day block", details: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Log action
        await logAdminAction(auth.userId!, "full_day_blocked", "slot_block", venue_id, {
          venue_id,
          slot_date,
          reason,
          slots_count: createdBlocks?.length || 0
        });
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            blocks: createdBlocks,
            count: createdBlocks?.length || 0,
            message: `Blocked ${createdBlocks?.length || 0} slots for the full day`
          }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Existing: Support single block or multiple blocks
      const blocksToCreate = slots || [{ venue_id, slot_date, slot_time, reason }];

      // Validate all blocks
      for (const block of blocksToCreate) {
        if (!block.venue_id || !block.slot_date || !block.slot_time) {
          return new Response(
            JSON.stringify({ error: "venue_id, slot_date, and slot_time are required for each block" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify ownership (unless admin)
        if (!isAdmin && !ownedVenueIds.includes(block.venue_id)) {
          return new Response(
            JSON.stringify({ error: "You can only block slots for venues you own" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Prepare insert data
      const insertData = blocksToCreate.map((block: { venue_id: string; slot_date: string; slot_time: string; reason?: string }) => ({
        venue_id: block.venue_id,
        slot_date: block.slot_date,
        slot_time: block.slot_time,
        reason: block.reason || null,
        blocked_by: auth.userId
      }));

      const { data: createdBlocks, error } = await supabase
        .from("slot_blocks")
        .upsert(insertData, { onConflict: "venue_id,slot_date,slot_time" })
        .select();

      if (error) {
        console.error("Error creating slot block:", error);
        return new Response(
          JSON.stringify({ error: "Failed to create slot block", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log action for each block
      for (const block of createdBlocks || []) {
        await logAdminAction(auth.userId!, "slot_blocked", "slot_block", block.id, {
          venue_id: block.venue_id,
          slot_date: block.slot_date,
          slot_time: block.slot_time,
          reason: block.reason
        });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          blocks: createdBlocks,
          count: createdBlocks?.length || 0
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "DELETE") {
      const { block_id, venue_id, slot_date, slot_time, unblock_full_day } = await req.json();

      // NEW: Handle full day unblocking
      if (unblock_full_day) {
        if (!venue_id || !slot_date) {
          return new Response(
            JSON.stringify({ error: "venue_id and slot_date are required for full day unblock" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Verify ownership (unless admin)
        if (!isAdmin && !ownedVenueIds.includes(venue_id)) {
          return new Response(
            JSON.stringify({ error: "You can only unblock slots for venues you own" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Delete all blocks for this venue on this date
        const { data: deleted, error } = await supabase
          .from("slot_blocks")
          .delete()
          .eq("venue_id", venue_id)
          .eq("slot_date", slot_date)
          .select();
        
        if (error) {
          console.error("Error unblocking full day:", error);
          return new Response(
            JSON.stringify({ error: "Failed to unblock full day", details: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        await logAdminAction(auth.userId!, "full_day_unblocked", "slot_block", venue_id, {
          venue_id,
          slot_date,
          slots_count: deleted?.length || 0
        });
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            count: deleted?.length || 0,
            message: `Unblocked ${deleted?.length || 0} slots for the full day`
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Support deletion by ID or by venue/date/time combo
      let query = supabase.from("slot_blocks").delete();

      if (block_id) {
        // Get the block to verify ownership
        const { data: block } = await supabase
          .from("slot_blocks")
          .select("venue_id")
          .eq("id", block_id)
          .single();

        if (!block) {
          return new Response(
            JSON.stringify({ error: "Slot block not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!isAdmin && !ownedVenueIds.includes(block.venue_id)) {
          return new Response(
            JSON.stringify({ error: "You can only unblock slots for venues you own" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        query = query.eq("id", block_id);
      } else if (venue_id && slot_date && slot_time) {
        if (!isAdmin && !ownedVenueIds.includes(venue_id)) {
          return new Response(
            JSON.stringify({ error: "You can only unblock slots for venues you own" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        query = query
          .eq("venue_id", venue_id)
          .eq("slot_date", slot_date)
          .eq("slot_time", slot_time);
      } else {
        return new Response(
          JSON.stringify({ error: "Either block_id, venue_id/slot_date/slot_time, or unblock_full_day are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await query;

      if (error) {
        console.error("Error deleting slot block:", error);
        return new Response(
          JSON.stringify({ error: "Failed to delete slot block" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await logAdminAction(auth.userId!, "slot_unblocked", "slot_block", block_id || `${venue_id}/${slot_date}/${slot_time}`, {
        venue_id,
        slot_date,
        slot_time
      });

      return new Response(
        JSON.stringify({ success: true, message: "Slot block removed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Admin slot blocks error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
