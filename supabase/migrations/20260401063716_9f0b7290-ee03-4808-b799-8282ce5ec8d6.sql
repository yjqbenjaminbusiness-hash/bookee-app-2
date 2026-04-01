
-- Fix storage: activity-images ownership
DROP POLICY "Users can delete own uploads" ON storage.objects;
DROP POLICY "Users can update own uploads" ON storage.objects;
CREATE POLICY "Owner can delete activity images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'activity-images' AND owner = auth.uid());
CREATE POLICY "Owner can update activity images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'activity-images' AND owner = auth.uid());

-- Fix storage: group-images ownership
DROP POLICY "Authenticated delete group images" ON storage.objects;
DROP POLICY "Authenticated update group images" ON storage.objects;
CREATE POLICY "Owner can delete group images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'group-images' AND owner = auth.uid());
CREATE POLICY "Owner can update group images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'group-images' AND owner = auth.uid());

-- Fix ballot_participants: restrict to own user_id
DROP POLICY "Anyone can join ballot" ON public.ballot_participants;
CREATE POLICY "Authenticated users can join ballot" ON public.ballot_participants
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix bookings: restrict to own user_id
DROP POLICY "Anyone can create booking" ON public.bookings;
CREATE POLICY "Authenticated users can create booking" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
