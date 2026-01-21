-- Allow venue owners to upload and manage venue images
CREATE POLICY "Venue owners can manage venue images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'venue-images' 
  AND has_role(auth.uid(), 'venue_owner'::app_role)
)
WITH CHECK (
  bucket_id = 'venue-images' 
  AND has_role(auth.uid(), 'venue_owner'::app_role)
);