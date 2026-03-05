

# Implementation Plan

This plan covers three distinct workstreams: Google Sign-In setup, Admin Event Logger, and "Coming Soon" empty states.

---

## 1. Google Sign-In

The current `useAuth.tsx` uses `supabase.auth.signInWithOAuth({ provider: 'google' })` directly. Since this project runs on Lovable Cloud, Google OAuth is managed automatically, but the code must use the Lovable Cloud auth module instead.

**Steps:**
- Run the **Configure Social Login** tool to generate the `src/integrations/lovable/` module and install `@lovable.dev/cloud-auth-js`
- Update `useAuth.tsx` → replace `supabase.auth.signInWithOAuth({ provider: 'google' })` with `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
- Same for Apple sign-in if desired
- No Razorpay changes needed (separate issue)

---

## 2. Admin Event Logger (Master Admin Only)

Create a comprehensive event logging system that records all significant platform events into a new `event_logs` table, viewable only by the master admin in the Admin App.

### Database

**New table: `event_logs`**
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| event_type | text | e.g. `booking_confirmed`, `booking_cancelled_user`, `booking_cancelled_admin`, `payment_completed`, `payment_failed`, `event_registration`, `event_cancelled`, `user_signup`, `user_deactivated`, `venue_created`, `venue_updated`, `slot_blocked`, `slot_unblocked`, `owner_application_submitted`, `owner_application_approved`, `owner_application_rejected` |
| actor_id | uuid | User who triggered the event |
| target_id | uuid | nullable, related entity ID |
| target_type | text | e.g. `booking`, `payment`, `event`, `venue`, `user` |
| metadata | jsonb | Full event details (booking details, payment amounts, cancellation reasons, etc.) |
| created_at | timestamptz | default now() |

**RLS:** SELECT only for users with `admin` role. INSERT via service role (edge functions).

### Edge Function: `log-event`

A small backend function that accepts event data and inserts into `event_logs` using the service role key. Called from existing edge functions (`validate-and-create-booking`, `verify-razorpay-payment`, `admin-bookings` cancellation flow, etc.).

### Integration Points

Add `log-event` calls to these existing edge functions:
- **`validate-and-create-booking`** → log `booking_confirmed` with booking details
- **`verify-razorpay-payment`** → log `payment_completed` with payment details
- **`admin-bookings`** (cancellation) → log `booking_cancelled_admin`
- **`create-razorpay-order`** → log `payment_initiated`
- **`admin-venues`** (create/update) → log `venue_created` / `venue_updated`
- **`admin-events`** → log event CRUD operations
- **`admin-users`** (deactivation) → log `user_deactivated`
- **`admin-slot-blocks`** → log `slot_blocked` / `slot_unblocked`

For user-side cancellations, add logging in the booking cancellation client code (or create a small wrapper function).

### Admin App Consumption

The Admin App (separate project) will query `event_logs` via the existing Supabase client, filtered by the admin role. This plan only sets up the backend infrastructure; the Admin App UI is in the other project.

---

## 3. "Coming Soon" Empty States

For pages that display lists of venues, events, games, etc., replace the bare "No venues found" / empty content with a styled "Coming Soon" placeholder.

**Create a reusable component: `src/components/ComingSoon.tsx`**
- Displays an icon, "We're Coming Soon!" heading, and a short subtitle
- Accepts optional `message` prop for context-specific text

**Pages to update:**
- `VenuesCourts.tsx` — when venues list is empty
- `VenuesRecovery.tsx` — when venues list is empty
- `VenuesStudio.tsx` — when venues list is empty
- `Social.tsx` — when events list is empty
- `HubGames.tsx` — when public games and tournaments are empty
- `HubCommunity.tsx` — when posts are empty

Replace existing `"No venues found"` / empty-list checks with the `<ComingSoon />` component.

---

## Execution Order

1. Configure Google Social Login (tool + code update)
2. Create `event_logs` table migration
3. Create `log-event` edge function
4. Integrate logging calls into existing edge functions
5. Create `ComingSoon` component and update empty-state pages

