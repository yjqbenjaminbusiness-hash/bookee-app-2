-- 1. group_members: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Group members viewable by everyone" ON public.group_members;

CREATE POLICY "Group members viewable by authenticated users"
ON public.group_members
FOR SELECT
TO authenticated
USING (true);

-- 2. ballot_participants: tighten INSERT to require ballot eligibility
DROP POLICY IF EXISTS "Authenticated users can join ballot" ON public.ballot_participants;

CREATE POLICY "Authenticated users can join eligible ballots"
ON public.ballot_participants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.ballots b
    WHERE b.id = ballot_participants.ballot_id
      AND (
        b.visibility = 'public'
        OR b.created_by = auth.uid()
        OR (
          b.visibility = 'private'
          AND b.group_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = b.group_id
              AND gm.user_id = auth.uid()
          )
        )
      )
  )
);