
-- 1. Fix ballots SELECT: restrict private ballots to creator/group members
DROP POLICY IF EXISTS "Ballots viewable by everyone" ON public.ballots;
CREATE POLICY "Ballots viewable based on visibility"
ON public.ballots FOR SELECT
TO public
USING (
  visibility = 'public'
  OR created_by = auth.uid()
  OR (
    visibility = 'private'
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = ballots.group_id
        AND group_members.user_id = auth.uid()
    )
  )
);

-- 2. Fix profiles INSERT: restrict to authenticated role only
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Drop old permissive storage upload policies
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload group images" ON storage.objects;
