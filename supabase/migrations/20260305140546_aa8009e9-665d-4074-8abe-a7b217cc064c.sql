
-- Trigger to log user_signup events when a new profile is created (profiles are created by handle_new_user on auth.users insert)
CREATE OR REPLACE FUNCTION public.log_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.event_logs (event_type, actor_id, target_id, target_type, metadata)
  VALUES (
    'user_signup',
    NEW.user_id,
    NEW.user_id,
    'user',
    jsonb_build_object(
      'display_name', NEW.display_name,
      'username', NEW.username
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_log_signup
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_user_signup();
