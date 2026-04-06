
CREATE TABLE public.special_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_id uuid,
  venue text NOT NULL,
  preferred_date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.special_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own requests" ON public.special_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own requests" ON public.special_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view activity requests" ON public.special_requests
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM activities WHERE activities.id = special_requests.activity_id AND activities.organizer_id = auth.uid())
  );

CREATE POLICY "Organizers can update request status" ON public.special_requests
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM activities WHERE activities.id = special_requests.activity_id AND activities.organizer_id = auth.uid())
  );
