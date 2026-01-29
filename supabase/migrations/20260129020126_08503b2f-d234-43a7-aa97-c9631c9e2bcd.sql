-- Fix 1: Restrict profiles table to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 2: Restrict venues table - only show phone_number to authenticated users
-- We need to update the policy to require authentication for viewing venue details
-- But keep basic venue info visible for discovery
DROP POLICY IF EXISTS "Venues are publicly viewable" ON public.venues;

-- Allow authenticated users to view all active venue details
CREATE POLICY "Authenticated users can view active venues" 
ON public.venues FOR SELECT 
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Fix 3: Update notifications INSERT policy to only allow self-notifications from clients
-- System notifications will go through edge functions with service role
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Only allow users to create notifications for themselves (self-notifications like booking cancellations)
CREATE POLICY "Users can create self notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- System notifications (from edge functions) bypass RLS via service role key