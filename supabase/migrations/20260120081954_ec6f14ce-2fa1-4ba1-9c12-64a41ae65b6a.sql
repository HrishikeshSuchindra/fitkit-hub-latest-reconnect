-- Mark a chat as read for the current user without allowing broader updates to chat_room_members
CREATE OR REPLACE FUNCTION public.mark_chat_room_read(_room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_room_members
  SET last_read_at = now()
  WHERE room_id = _room_id
    AND user_id = auth.uid();
END;
$$;

-- Allow authenticated users to call it
GRANT EXECUTE ON FUNCTION public.mark_chat_room_read(uuid) TO authenticated;