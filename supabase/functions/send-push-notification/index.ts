import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRateLimiter, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Push notification rate limit: 100 per minute
const rateLimiter = createRateLimiter(RATE_LIMITS.push);

// VAPID keys for Web Push - NO insecure defaults
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_SUBJECT = 'mailto:hello@fitkits.app';

interface PushPayload {
  user_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
}

// Base64URL encode
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Import crypto key for signing
async function importVapidKey(privateKey: string): Promise<CryptoKey> {
  // Decode base64url to raw bytes
  const padding = '='.repeat((4 - (privateKey.length % 4)) % 4);
  const base64 = (privateKey + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  
  return await crypto.subtle.importKey(
    'raw',
    rawData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

// Create JWT for VAPID
async function createVapidJWT(audience: string, privateKey: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: VAPID_SUBJECT,
  };

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await importVapidKey(privateKey);
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      new TextEncoder().encode(unsignedToken)
    );

    // Convert DER signature to raw format if needed
    const signatureArray = new Uint8Array(signature);
    return `${unsignedToken}.${base64UrlEncode(signatureArray)}`;
  } catch (error) {
    console.error('Error creating VAPID JWT:', error);
    throw error;
  }
}

// Send push notification to a subscription
async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; icon?: string; data?: Record<string, unknown> },
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    
    const vapidJWT = await createVapidJWT(audience, vapidPrivateKey);
    
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Authorization': `vapid t=${vapidJWT}, k=${vapidPublicKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Push send failed:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending push:', error);
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate VAPID configuration
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error("VAPID keys not configured - push notifications unavailable");
    return new Response(
      JSON.stringify({ error: "Push notifications not configured. VAPID keys required." }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Apply rate limiting
  const limitResponse = rateLimiter(req);
  if (limitResponse) {
    console.log('Rate limit exceeded for push notifications');
    return new Response(limitResponse.body, {
      status: limitResponse.status,
      headers: { ...corsHeaders, ...Object.fromEntries(limitResponse.headers.entries()) },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Validate this is an internal service call (service role key required)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.includes(supabaseServiceKey)) {
      console.error('Unauthorized call to send-push-notification');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - internal function only' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    console.log('Push notification request:', JSON.stringify(payload));

    if (!payload.title || !payload.body) {
      console.error('Missing required fields: title and body');
      return new Response(
        JSON.stringify({ error: 'title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user IDs to notify
    const userIds: string[] = [];
    if (payload.user_id) {
      userIds.push(payload.user_id);
    }
    if (payload.user_ids) {
      userIds.push(...payload.user_ids);
    }

    if (userIds.length === 0) {
      console.error('No user IDs provided');
      return new Response(
        JSON.stringify({ error: 'user_id or user_ids required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching push tokens for ${userIds.length} users`);

    // Fetch push tokens for users
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('*')
      .in('user_id', userIds)
      .eq('is_active', true)
      .eq('platform', 'web');

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tokens?.length || 0} push tokens`);

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No push tokens found for users', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications
    const results = await Promise.all(
      tokens.map(async (token) => {
        try {
          const subscription = JSON.parse(token.token);
          const result = await sendPushNotification(
            subscription,
            {
              title: payload.title,
              body: payload.body,
              icon: payload.icon || '/favicon.ico',
              data: payload.data,
            },
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
          );
          console.log(`Push result for user ${token.user_id}:`, result);
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Error processing token:', error);
          return { success: false, error: errorMessage };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    // Store notification in database
    for (const userId of userIds) {
      const { error: insertError } = await supabase.from('notifications').insert({
        user_id: userId,
        title: payload.title,
        body: payload.body,
        type: 'push',
        data: payload.data,
        is_read: false,
      });
      if (insertError) {
        console.error(`Error inserting notification for user ${userId}:`, insertError);
      }
    }

    console.log(`Sent ${successCount} notifications, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
