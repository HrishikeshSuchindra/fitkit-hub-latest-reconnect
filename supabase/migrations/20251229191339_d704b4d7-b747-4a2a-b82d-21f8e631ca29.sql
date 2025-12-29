-- Drop broken policies
DROP POLICY IF EXISTS "Members can view room members" ON public.chat_room_members;
DROP POLICY IF EXISTS "Room admins can add members" ON public.chat_room_members;
DROP POLICY IF EXISTS "Members can view their rooms" ON public.chat_rooms;

-- Create fixed policies for chat_room_members
CREATE POLICY "Members can view room members" 
ON public.chat_room_members 
FOR SELECT 
USING (
  room_id IN (
    SELECT crm.room_id FROM public.chat_room_members crm 
    WHERE crm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add members to their rooms" 
ON public.chat_room_members 
FOR INSERT 
WITH CHECK (
  -- User can add themselves OR user is admin of the room
  user_id = auth.uid() OR
  room_id IN (
    SELECT crm.room_id FROM public.chat_room_members crm 
    WHERE crm.user_id = auth.uid() AND crm.role = 'admin'
  )
);

-- Create fixed policy for chat_rooms
CREATE POLICY "Members can view their rooms" 
ON public.chat_rooms 
FOR SELECT 
USING (
  id IN (
    SELECT crm.room_id FROM public.chat_room_members crm 
    WHERE crm.user_id = auth.uid()
  )
  OR created_by = auth.uid()
);