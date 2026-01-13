// Centralized Authentication & Authorization Middleware
// Used by all edge functions for consistent auth handling

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthResult {
  userId: string | null;
  error: Response | null;
}

export interface RoleAuthResult extends AuthResult {
  role?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Creates a Supabase client with service role for admin operations
 */
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
}

/**
 * Creates a Supabase client with the user's JWT for RLS-respecting operations
 */
export function createUserClient(authHeader: string): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  
  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: {
      headers: { Authorization: authHeader }
    }
  });
}

/**
 * Authenticates a user from the request's Authorization header
 * Returns userId if valid, or an error Response if invalid
 */
export async function authenticateUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      userId: null,
      error: new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }
  
  const token = authHeader.replace("Bearer ", "");
  const supabase = createServiceClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return {
      userId: null,
      error: new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }
  
  return { userId: user.id, error: null };
}

/**
 * Validates that the user has the specified role
 * Uses the has_role database function for secure server-side validation
 */
export async function requireRole(
  req: Request, 
  role: 'admin' | 'moderator' | 'user'
): Promise<RoleAuthResult> {
  const authResult = await authenticateUser(req);
  
  if (authResult.error) {
    return authResult;
  }
  
  const supabase = createServiceClient();
  
  // Check role using the security definer function
  const { data: hasRole, error: roleError } = await supabase
    .rpc('has_role', { _user_id: authResult.userId, _role: role });
  
  if (roleError) {
    console.error("Role check error:", roleError);
    return {
      userId: null,
      error: new Response(
        JSON.stringify({ error: "Failed to verify user role" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }
  
  if (!hasRole) {
    return {
      userId: null,
      error: new Response(
        JSON.stringify({ error: "Forbidden: Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }
  
  return { userId: authResult.userId, role, error: null };
}

/**
 * Shorthand for requiring admin role
 */
export async function requireAdmin(req: Request): Promise<RoleAuthResult> {
  return requireRole(req, 'admin');
}

/**
 * Validates service-to-service calls using the service role key
 * Used for internal edge function calls
 */
export function validateServiceCall(req: Request): { valid: boolean; error: Response | null } {
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!serviceRoleKey) {
    return {
      valid: false,
      error: new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }
  
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return {
      valid: false,
      error: new Response(
        JSON.stringify({ error: "Unauthorized: Invalid service credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }
  
  return { valid: true, error: null };
}

/**
 * Checks if the user account is active
 * Returns error if account is deactivated
 */
export async function checkAccountActive(userId: string): Promise<{ active: boolean; error: Response | null }> {
  const supabase = createServiceClient();
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    // If profile doesn't exist yet, treat as active (new user)
    if (error.code === 'PGRST116') {
      return { active: true, error: null };
    }
    
    console.error("Profile check error:", error);
    return {
      active: false,
      error: new Response(
        JSON.stringify({ error: "Failed to verify account status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }
  
  if (profile && profile.is_active === false) {
    return {
      active: false,
      error: new Response(
        JSON.stringify({ error: "Account has been deactivated", code: "ACCOUNT_DEACTIVATED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }
  
  return { active: true, error: null };
}

/**
 * Logs an admin action for audit purposes
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createServiceClient();
    
    await supabase.from('admin_audit_log').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details || null
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
    // Don't throw - audit logging should not block the main operation
  }
}

/**
 * Standard CORS headers for responses
 */
export { corsHeaders };
