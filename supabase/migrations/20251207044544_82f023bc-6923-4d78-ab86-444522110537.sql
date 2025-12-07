-- Add foreign key relationship from bookings.user_id to profiles.user_id
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;