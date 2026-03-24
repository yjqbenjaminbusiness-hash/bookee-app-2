
-- Create ballots table
CREATE TABLE public.ballots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_name TEXT NOT NULL,
  sport TEXT NOT NULL,
  location TEXT NOT NULL,
  ballot_deadline DATE NOT NULL,
  slots INTEGER NOT NULL DEFAULT 10,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ballot_participants table
CREATE TABLE public.ballot_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ballot_id UUID NOT NULL REFERENCES public.ballots(id) ON DELETE CASCADE,
  user_id UUID,
  telegram_username TEXT,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ballot_participants ENABLE ROW LEVEL SECURITY;

-- Ballots RLS
CREATE POLICY "Ballots viewable by everyone" ON public.ballots FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create ballots" ON public.ballots FOR INSERT TO public WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update own ballots" ON public.ballots FOR UPDATE TO public USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete own ballots" ON public.ballots FOR DELETE TO public USING (auth.uid() = created_by);

-- Ballot participants RLS
CREATE POLICY "Participants viewable by ballot creator" ON public.ballot_participants FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM public.ballots WHERE ballots.id = ballot_participants.ballot_id AND ballots.created_by = auth.uid())
  OR auth.uid() = user_id
);
CREATE POLICY "Anyone can join ballot" ON public.ballot_participants FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Participants can update own entry" ON public.ballot_participants FOR UPDATE TO public USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.ballots WHERE ballots.id = ballot_participants.ballot_id AND ballots.created_by = auth.uid())
);
CREATE POLICY "Participants can leave ballot" ON public.ballot_participants FOR DELETE TO public USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.ballots WHERE ballots.id = ballot_participants.ballot_id AND ballots.created_by = auth.uid())
);

-- Index for faster lookups
CREATE INDEX idx_ballot_participants_ballot_id ON public.ballot_participants(ballot_id);
CREATE INDEX idx_ballot_participants_user_id ON public.ballot_participants(user_id);
