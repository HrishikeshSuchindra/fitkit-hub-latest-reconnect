-- Add owner_id column to venues table
ALTER TABLE public.venues 
ADD COLUMN owner_id uuid REFERENCES auth.users(id);

-- Create index for owner lookups
CREATE INDEX idx_venues_owner_id ON public.venues(owner_id);

-- Create slot_blocks table for manual slot blocking
CREATE TABLE public.slot_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  blocked_by uuid NOT NULL REFERENCES auth.users(id),
  slot_date date NOT NULL,
  slot_time text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(venue_id, slot_date, slot_time)
);

-- Enable RLS on slot_blocks
ALTER TABLE public.slot_blocks ENABLE ROW LEVEL SECURITY;

-- RLS: Venue owners can manage their slot blocks
CREATE POLICY "Venue owners can manage slot blocks"
ON public.slot_blocks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.venues 
    WHERE venues.id = slot_blocks.venue_id 
    AND venues.owner_id = auth.uid()
  )
);

-- RLS: Anyone can view slot blocks (needed for availability check)
CREATE POLICY "Anyone can view slot blocks"
ON public.slot_blocks
FOR SELECT
USING (true);

-- RLS: Admins can manage all slot blocks
CREATE POLICY "Admins can manage all slot blocks"
ON public.slot_blocks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update venues RLS to allow owners to manage their venues
CREATE POLICY "Venue owners can manage their venues"
ON public.venues
FOR ALL
USING (owner_id = auth.uid());

-- Assign Pickleball Pro Arena to Hrishikesh
UPDATE public.venues 
SET owner_id = '51eeb581-52e6-4989-8005-6209505a2e9f'
WHERE id = 'f6ffecf7-9b08-4263-a247-abd151339e28';

-- Enable realtime for slot_blocks
ALTER PUBLICATION supabase_realtime ADD TABLE public.slot_blocks;