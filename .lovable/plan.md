
# Owner Registration & Approval System - Backend Updates

## Overview
This plan implements the database infrastructure required for the Admin App's venue owner registration and approval workflow. The changes enable:
- Users to submit applications to become venue owners
- Admins to review, approve, or reject applications
- Automatic profile and role syncing when applications are approved

---

## Current State Analysis

### What Exists
- **`user_roles` table**: Already supports `venue_owner` role with `app_role` enum
- **`profiles` table**: Stores user profile data (display_name, username, avatar, phone_number, etc.)
- **`has_role()` function**: Security definer function for checking user roles
- **Existing RLS on `user_roles`**: Admins have `ALL` access via `has_role()` check

### What's Missing
1. **`owner_applications` table** - Does not exist (confirmed via database query)
2. **Explicit INSERT/DELETE policies on `user_roles`** - Currently only has `ALL` policy which should work, but explicit policies provide clearer intent
3. **Admin INSERT/UPDATE policies on `profiles`** - Admins cannot currently insert or update profiles for other users

---

## Implementation Plan

### Phase 1: Create Owner Applications Table

Create a new table to track venue owner registration applications.

```text
┌─────────────────────────────────────────────────────────────┐
│                    owner_applications                        │
├─────────────────────────────────────────────────────────────┤
│ id              UUID (PK)      - Unique application ID      │
│ user_id         UUID (FK)      - References auth.users      │
│ email           TEXT           - Applicant's email          │
│ full_name       TEXT           - Applicant's name           │
│ phone           TEXT           - Contact number             │
│ business_name   TEXT           - Venue/Business name        │
│ message         TEXT (nullable)- Additional details         │
│ status          TEXT           - pending/approved/rejected  │
│ reviewed_by     UUID (nullable)- Admin who reviewed         │
│ reviewed_at     TIMESTAMPTZ    - Review timestamp           │
│ created_at      TIMESTAMPTZ    - Submission timestamp       │
│ updated_at      TIMESTAMPTZ    - Last update timestamp      │
└─────────────────────────────────────────────────────────────┘
```

**RLS Policies:**
- Users can INSERT their own applications
- Users can SELECT their own applications
- Admins can SELECT all applications
- Admins can UPDATE applications (for approval/rejection)
- Admins can DELETE applications

### Phase 2: Add Admin Policies for Profiles Table

Enable admins to create and update profiles when approving owner applications.

**New Policies:**
- `Admins can insert profiles` - INSERT policy for admins
- `Admins can update all profiles` - UPDATE policy for admins

### Phase 3: Add Explicit Admin Policies for User Roles

While the existing `ALL` policy should work, adding explicit INSERT and DELETE policies provides:
- Clearer security intent
- Better audit trail
- Alignment with the Admin App's expectations

**New Policies:**
- `Admins can insert roles` - INSERT policy for admins
- `Admins can delete roles` - DELETE policy for admins

---

## Technical Details

### Database Migration SQL

```sql
-- =============================================
-- PHASE 1: OWNER APPLICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.owner_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_name TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT owner_applications_status_check 
        CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_owner_applications_status 
    ON public.owner_applications(status);
CREATE INDEX IF NOT EXISTS idx_owner_applications_user_id 
    ON public.owner_applications(user_id);

-- Enable RLS
ALTER TABLE public.owner_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can submit applications"
    ON public.owner_applications FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own applications"
    ON public.owner_applications FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
    ON public.owner_applications FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update applications"
    ON public.owner_applications FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete applications"
    ON public.owner_applications FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PHASE 2: PROFILES TABLE ADMIN POLICIES
-- =============================================

CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PHASE 3: USER_ROLES EXPLICIT ADMIN POLICIES
-- =============================================

CREATE POLICY "Admins can insert roles"
    ON public.user_roles FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
    ON public.user_roles FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
```

### Important Notes

1. **Profile Sync on Approval**: The Admin App's `ManageOwners.tsx` component needs to be updated to insert/upsert a profile when approving an application. The migration here enables that capability via RLS.

2. **`profiles` Table Structure**: The existing profiles table uses `user_id` (not `id`) as the user identifier. When syncing profiles on approval, the Admin App should use:
   ```javascript
   await supabase.from('profiles').upsert({
     user_id: application.user_id,  // NOT 'id'
     display_name: application.full_name,
     phone_number: application.phone,
     is_active: true,
   }, { onConflict: 'user_id' });
   ```

3. **Unique Constraint**: Consider adding a unique constraint on `owner_applications(user_id)` if users should only have one pending application at a time.

---

## Post-Migration Checklist

After approving this migration:

1. The `owner_applications` table will be created and accessible
2. Admins will be able to manage applications via the Admin App
3. The Admin App's approval flow will need to sync profiles (frontend change in Admin App repo)
4. Test the full flow: Submit application → Admin reviews → Approve → User gets `venue_owner` role + profile

---

## Files to be Modified

| File | Change |
|------|--------|
| New Migration | Create `owner_applications` table + all RLS policies |

*Note: Frontend changes for profile syncing are in the Admin App repository, not this User App.*
