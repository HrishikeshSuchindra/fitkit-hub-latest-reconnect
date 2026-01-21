-- Add new columns for complete venue data management
ALTER TABLE venues ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS instagram_handle text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS min_booking_duration integer DEFAULT 30;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS peak_price numeric;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS peak_hours jsonb DEFAULT '[]'::jsonb;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS day_schedules jsonb;

-- Add comments for documentation
COMMENT ON COLUMN venues.phone_number IS 'Venue contact phone number';
COMMENT ON COLUMN venues.website_url IS 'Venue website URL';
COMMENT ON COLUMN venues.instagram_handle IS 'Instagram handle without @';
COMMENT ON COLUMN venues.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN venues.min_booking_duration IS 'Minimum booking slot duration in minutes';
COMMENT ON COLUMN venues.peak_price IS 'Price during peak hours';
COMMENT ON COLUMN venues.peak_hours IS 'Array of peak hour ranges: [{start: 18, end: 22}]';
COMMENT ON COLUMN venues.day_schedules IS 'Per-day schedules: {mon: {enabled: true, open: "09:00", close: "17:00"}, ...}';