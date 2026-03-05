

# Event Logs: What the Admin App Needs

## What's Already Done (This Project)

Everything is fully built on the backend. No additional APIs or edge functions are needed.

### Infrastructure in place:
1. **`event_logs` table** -- stores all platform events with columns: `id`, `event_type`, `actor_id`, `target_id`, `target_type`, `metadata` (JSONB), `created_at`
2. **RLS** -- SELECT restricted to users with `admin` role via `has_role(auth.uid(), 'admin')`
3. **Shared logger** (`_shared/event-logger.ts`) -- inserts logs using service role key
4. **`log-event` edge function** -- standalone endpoint (not needed by admin app, used internally)

### Events currently being logged:

| Event Type | Source Function | Metadata |
|---|---|---|
| `booking_confirmed` | `validate-and-create-booking` | venue_name, venue_id, sport, slot_date, slot_time, duration, price, court_number |
| `payment_initiated` | `create-razorpay-order` | amount, currency, booking_id, event_id |
| `payment_completed` | `verify-razorpay-payment` | amount, currency, booking_id, event_id, gateway_payment_id, payment_method |
| `booking_cancelled_admin` | `admin-bookings` | venue_name, venue_id, sport, slot_date, slot_time, reason, cancelled_by_user_id |
| `venue_created` | `admin-venues` | name, sport, city |
| `venue_updated` | `admin-venues` | changed field names |
| `event_cancelled` | `admin-events` | reason |
| `event_deleted` | `admin-events` | -- |
| `user_deactivated` | `admin-users` | reason |
| `slot_blocked` | `admin-slot-blocks` | venue_id, slot_date, slot_time, reason |
| `slot_unblocked` | `admin-slot-blocks` | venue_id, slot_date, slot_time |

## What the Admin App Needs to Implement

### Data Access -- Direct table query (no API needed)

The admin app already uses the same Supabase client. Simply query the `event_logs` table directly:

```typescript
const { data, error } = await supabase
  .from("event_logs")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(100);
```

The RLS policy ensures only admin-role users get results. No edge function call required.

### Useful query patterns for the UI:

```typescript
// Filter by event type
.eq("event_type", "booking_confirmed")

// Filter by date range
.gte("created_at", startDate)
.lte("created_at", endDate)

// Filter by target type
.eq("target_type", "booking")

// Search in metadata (JSONB)
.contains("metadata", { venue_id: "some-uuid" })
```

### Suggested Admin App UI

Build an "Event Logs" page with:
1. **Table/list** showing: timestamp, event type (badge), actor (resolve via profiles table join or separate lookup), target type, and a expandable metadata viewer
2. **Filters**: event type dropdown, date range picker, target type dropdown
3. **Auto-refresh** or pagination for real-time monitoring

### Actor name resolution

The `actor_id` is a UUID. To show display names, do a secondary lookup:
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("display_name, username")
  .eq("user_id", actorId)
  .single();
```

## Not Yet Logged (Gaps to Consider)

These events are NOT currently logged and would need additional work in this project if you want them:

- **`booking_cancelled_user`** -- user-side cancellations happen client-side in `BookingCancellation.tsx`, not through an edge function
- **`user_signup`** -- new user registration (would need a database trigger on `auth.users` insert)
- **`event_registration`** -- event sign-ups happen via client-side insert
- **`owner_application_submitted/approved/rejected`** -- owner application flow

Adding these would require either wrapping the client-side operations in edge functions or adding database triggers.

