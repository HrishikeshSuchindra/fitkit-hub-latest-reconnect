-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_image TEXT,
  venue_address TEXT,
  sport TEXT,
  slot_date DATE NOT NULL,
  slot_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL,
  total_courts INTEGER NOT NULL DEFAULT 3,
  player_count INTEGER NOT NULL DEFAULT 1,
  visibility TEXT NOT NULL DEFAULT 'friends' CHECK (visibility IN ('public', 'friends')),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "Users can create their own bookings"
ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = user_id);

-- Anyone can view slot availability (aggregated booking counts by slot)
CREATE POLICY "Anyone can view booking counts for availability"
ON public.bookings
FOR SELECT
USING (status = 'confirmed');

-- Create index for faster availability lookups
CREATE INDEX idx_bookings_availability ON public.bookings(venue_id, slot_date, slot_time, status);

-- Create trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for bookings table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;