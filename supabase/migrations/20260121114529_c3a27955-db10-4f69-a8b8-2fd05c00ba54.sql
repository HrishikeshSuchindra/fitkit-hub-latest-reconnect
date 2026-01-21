-- Add court_number column to track which specific court is booked
ALTER TABLE bookings ADD COLUMN court_number INTEGER DEFAULT 1;

-- Create validation function for court_number
CREATE OR REPLACE FUNCTION public.validate_court_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.court_number < 1 OR NEW.court_number > NEW.total_courts THEN
    RAISE EXCEPTION 'court_number must be between 1 and total_courts';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for court number validation
CREATE TRIGGER check_court_number
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_court_number();