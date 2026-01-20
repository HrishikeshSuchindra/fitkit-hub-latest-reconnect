import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Image URLs hosted on the preview app (bundled assets)
const SEED_IMAGES: Record<string, string> = {
  "venue-football.jpg": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80",
  "venue-badminton.jpg": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80",
  "venue-cricket.jpg": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
  "venue-pickleball.jpg": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
  "venue-basketball.jpg": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
  "venue-tabletennis.jpg": "https://images.unsplash.com/photo-1611251135345-18c56206b863?w=800&q=80",
  "venue-squash.jpg": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
  "venue-tennis.jpg": "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80",
  "recovery-swimming.jpg": "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80",
  "recovery-icebath.jpg": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
  "recovery-massage.jpg": "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=80",
  "recovery-sauna.jpg": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80",
  "recovery-yoga.jpg": "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
  "studio-yoga.jpg": "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&q=80",
  "studio-gym.jpg": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const isAdmin = roleData?.role === "admin";
    
    // Also allow venue owners to seed their venue images
    const { data: ownedVenues } = await supabase
      .from("venues")
      .select("id")
      .eq("owner_id", user.id);
    
    const isVenueOwner = ownedVenues && ownedVenues.length > 0;

    if (!isAdmin && !isVenueOwner) {
      return new Response(
        JSON.stringify({ error: "Access denied. Admin or venue owner required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { image: string; success: boolean; url?: string; error?: string }[] = [];

    // Download and upload each seed image
    for (const [filename, sourceUrl] of Object.entries(SEED_IMAGES)) {
      try {
        console.log(`Fetching ${filename} from ${sourceUrl}`);
        
        // Fetch image from source
        const imageResponse = await fetch(sourceUrl);
        if (!imageResponse.ok) {
          results.push({ image: filename, success: false, error: `Failed to fetch: ${imageResponse.status}` });
          continue;
        }

        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();

        // Upload to storage
        const storagePath = `seed/${filename}`;
        const { error: uploadError } = await supabase.storage
          .from("venue-images")
          .upload(storagePath, imageBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          results.push({ image: filename, success: false, error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("venue-images")
          .getPublicUrl(storagePath);

        results.push({ image: filename, success: true, url: urlData.publicUrl });
        console.log(`Successfully uploaded ${filename}`);
      } catch (err) {
        results.push({ image: filename, success: false, error: String(err) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Seeding complete. ${successCount} succeeded, ${failCount} failed.`,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
