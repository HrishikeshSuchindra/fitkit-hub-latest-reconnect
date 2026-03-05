import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function logEvent(
  event_type: string,
  actor_id?: string | null,
  target_id?: string | null,
  target_type?: string | null,
  metadata?: Record<string, unknown>
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("event_logs").insert({
      event_type,
      actor_id: actor_id || null,
      target_id: target_id || null,
      target_type: target_type || null,
      metadata: metadata || {},
    });
  } catch (err) {
    console.error("Failed to log event:", event_type, err);
  }
}
