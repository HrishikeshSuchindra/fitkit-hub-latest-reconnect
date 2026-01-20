-- Add tournament-specific fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS team_type TEXT DEFAULT 'individual' CHECK (team_type IN ('individual', 'team', 'both')),
ADD COLUMN IF NOT EXISTS team_size INTEGER,
ADD COLUMN IF NOT EXISTS min_team_size INTEGER,
ADD COLUMN IF NOT EXISTS max_team_size INTEGER,
ADD COLUMN IF NOT EXISTS rules TEXT,
ADD COLUMN IF NOT EXISTS guidelines TEXT,
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS format TEXT;

-- Update existing tournaments with default team_type
UPDATE public.events SET team_type = 'individual' WHERE event_type = 'tournament' AND team_type IS NULL;