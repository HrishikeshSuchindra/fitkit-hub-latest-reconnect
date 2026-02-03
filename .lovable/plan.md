
# Plan: Allow Venue Owners With No Venues to See Empty Bookings

## Problem
When a user has the `venue_owner` role in the `user_roles` table but hasn't been assigned any venues yet (e.g., a newly approved owner), the admin-bookings edge function returns a 403 "Access denied" error instead of showing an empty bookings list.

## Solution
Update the `admin-bookings` edge function to check for the `venue_owner` role in the `user_roles` table, similar to how `admin-venues` handles it. This allows venue owners with no venues to access the bookings dashboard and see an empty state instead of an error.

## Changes Required

### 1. Update admin-bookings Edge Function
**File:** `supabase/functions/admin-bookings/index.ts`

**Current logic (lines 27-48):**
- Only checks if user has `admin` role
- Only considers someone a "venue owner" if they have venues in the `venues` table
- Denies access if neither condition is met

**New logic:**
- Check for `admin` role (unchanged)
- Check for `venue_owner` role in `user_roles` table (new)
- Check for owned venues (unchanged)
- Allow access if ANY of these conditions are true
- When querying bookings for a venue owner with no venues, return empty array

**Specific changes:**
```typescript
// Add venue_owner role check (similar to admin-venues)
const hasVenueOwnerRole = userRoles?.some(r => r.role === "venue_owner");

// Update access control logic
if (!isAdmin && !hasVenueOwnerRole && !isVenueOwner) {
  return new Response(
    JSON.stringify({ error: "Access denied..." }),
    { status: 403, ... }
  );
}

// For GET requests: handle empty ownedVenueIds gracefully
// When a venue owner has no venues, the .in() query with an empty array
// will return no results - this is the desired "no bookings" behavior
```

## Technical Details
- The change aligns `admin-bookings` with the existing pattern in `admin-venues` 
- When `ownedVenueIds` is empty for a venue owner, the query `query.in("venue_id", [])` returns no results
- This produces an empty bookings array with proper pagination, which the frontend can display as "No bookings found"
- No frontend changes required - it will naturally show the empty state

## Impact
- Venue owners awaiting venue assignment can access the admin dashboard
- They see a clean "no bookings" state instead of an error
- Existing admins and venue owners with venues are unaffected
