-- Add phone_number column to profiles table for easy access by admin
ALTER TABLE public.profiles 
ADD COLUMN phone_number text;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.phone_number IS 'User mobile number for booking contact purposes';