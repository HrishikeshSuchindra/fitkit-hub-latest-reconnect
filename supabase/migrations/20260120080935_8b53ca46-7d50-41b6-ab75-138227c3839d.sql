-- Create stories table for Instagram-like stories feature
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Create story_views table to track who viewed which story
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Create indexes for performance
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX idx_story_views_viewer_id ON public.story_views(viewer_id);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stories
-- Everyone can view active (non-expired) stories
CREATE POLICY "Anyone can view active stories"
ON public.stories FOR SELECT
TO authenticated
USING (expires_at > now());

-- Users can create their own stories
CREATE POLICY "Users can create own stories"
ON public.stories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete own stories"
ON public.stories FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for story_views
-- Story owners can see who viewed their stories
CREATE POLICY "Story owners can view story views"
ON public.story_views FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_views.story_id
    AND stories.user_id = auth.uid()
  )
  OR viewer_id = auth.uid()
);

-- Users can create view records (mark as viewed)
CREATE POLICY "Users can mark stories as viewed"
ON public.story_views FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = viewer_id);

-- Enable realtime for stories
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;