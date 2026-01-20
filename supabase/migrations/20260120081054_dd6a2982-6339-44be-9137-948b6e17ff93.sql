-- Create stories storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for stories bucket - public read access
CREATE POLICY "Stories are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

-- Users can upload their own stories
CREATE POLICY "Users can upload their own stories"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own stories
CREATE POLICY "Users can delete their own stories"
ON storage.objects FOR DELETE
USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);