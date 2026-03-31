
-- Create storage bucket for group images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('group-images', 'group-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for group images
CREATE POLICY "Public read group images" ON storage.objects FOR SELECT USING (bucket_id = 'group-images');
CREATE POLICY "Authenticated upload group images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'group-images');
CREATE POLICY "Authenticated update group images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'group-images');
CREATE POLICY "Authenticated delete group images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'group-images');
