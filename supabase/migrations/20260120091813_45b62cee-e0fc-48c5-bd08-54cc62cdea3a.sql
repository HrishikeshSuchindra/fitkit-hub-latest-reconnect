-- Add event_id column to chat_rooms for event-specific chat groups
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE CASCADE;

-- Add tickets_count column to event_registrations for multiple ticket purchases
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS tickets_count integer NOT NULL DEFAULT 1;

-- Create index for faster event chat lookups
CREATE INDEX IF NOT EXISTS idx_chat_rooms_event_id ON public.chat_rooms(event_id);