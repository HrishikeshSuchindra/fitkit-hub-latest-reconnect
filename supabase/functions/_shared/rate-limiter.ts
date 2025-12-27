// Rate Limiter for Edge Functions
// Uses in-memory storage with cleanup (suitable for edge function lifecycle)

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Prefix for the key
}

// In-memory store (per function instance)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60000; // 1 minute

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}

export function getRateLimitKey(req: Request, identifier?: string): string {
  // Use IP address or custom identifier
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return identifier || ip;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  cleanup();
  
  const now = Date.now();
  const fullKey = `${config.keyPrefix || "rl"}:${key}`;
  
  let entry = store.get(fullKey);
  
  // Create new entry or reset if window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    store.set(fullKey, entry);
  }
  
  entry.count++;
  
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = Math.max(0, entry.resetTime - now);
  
  return { allowed, remaining, resetIn };
}

export function rateLimitResponse(resetIn: number): Response {
  const retryAfter = Math.ceil(resetIn / 1000);
  
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": Math.ceil(Date.now() / 1000 + retryAfter).toString(),
      },
    }
  );
}

// Middleware-style rate limiter
export function createRateLimiter(config: RateLimitConfig) {
  return function checkLimit(req: Request, identifier?: string): Response | null {
    const key = getRateLimitKey(req, identifier);
    const { allowed, remaining, resetIn } = checkRateLimit(key, config);
    
    if (!allowed) {
      return rateLimitResponse(resetIn);
    }
    
    return null; // Request is allowed
  };
}

// Common rate limit configs
export const RATE_LIMITS = {
  // Strict: 10 requests per minute (for sensitive operations)
  strict: { windowMs: 60000, maxRequests: 10, keyPrefix: "strict" },
  
  // Standard: 60 requests per minute
  standard: { windowMs: 60000, maxRequests: 60, keyPrefix: "standard" },
  
  // Relaxed: 120 requests per minute
  relaxed: { windowMs: 60000, maxRequests: 120, keyPrefix: "relaxed" },
  
  // Auth: 5 requests per minute (for login/signup)
  auth: { windowMs: 60000, maxRequests: 5, keyPrefix: "auth" },
  
  // OTP: 3 requests per 5 minutes
  otp: { windowMs: 300000, maxRequests: 3, keyPrefix: "otp" },
  
  // Push: 100 notifications per minute
  push: { windowMs: 60000, maxRequests: 100, keyPrefix: "push" },
};

// Example usage in edge function:
/*
import { createRateLimiter, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const rateLimiter = createRateLimiter(RATE_LIMITS.standard);

serve(async (req) => {
  // Check rate limit
  const limitResponse = rateLimiter(req);
  if (limitResponse) return limitResponse;
  
  // Process request...
});
*/
