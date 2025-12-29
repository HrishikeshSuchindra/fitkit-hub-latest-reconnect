-- Fix infinite recursion in RLS by moving membership checks into SECURITY DEFINER functions

CREATE OR REPLACE FUNCTION public.is_chat_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_room_members
    WHERE room_id = _room_id
      AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_chat_room_admin(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_room_members
    WHERE room_id = _room_id
      AND user_id = _user_id
      AND role = 'admin'
  );
$$;

-- Replace broken/recursive policies
DROP POLICY IF EXISTS "Members can view room members" ON public.chat_room_members;
DROP POLICY IF EXISTS "Room admins can add members" ON public.chat_room_members;
DROP POLICY IF EXISTS "Users can add members to their rooms" ON public.chat_room_members;

DROP POLICY IF EXISTS "Members can view their rooms" ON public.chat_rooms;

-- chat_room_members: SELECT
CREATE POLICY "Members can view room members"
ON public.chat_room_members
FOR SELECT
USING (
  public.is_chat_room_member(room_id, auth.uid())
);

-- chat_room_members: INSERT
-- Allow: user adds self; room creator adds anyone; room admin adds anyone
CREATE POLICY "Users can add members to their rooms"
ON public.chat_room_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR auth.uid() = (SELECT created_by FROM public.chat_rooms cr WHERE cr.id = room_id)
  OR public.is_chat_room_admin(room_id, auth.uid())
);

-- chat_rooms: SELECT
CREATE POLICY "Members can view their rooms"
ON public.chat_rooms
FOR SELECT
USING (
  public.is_chat_room_member(id, auth.uid())
  OR created_by = auth.uid()
);
