-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view active venues" ON public.venues;

-- Create new policy allowing public read access to active venues
CREATE POLICY "Anyone can view active venues"
ON public.venues
FOR SELECT
USING (is_active = true);