
-- Add username to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;

-- Add visibility to activities (public/private, default public)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

-- Add special_request to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_request text;

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL,
  organizer_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Announcements viewable by everyone"
  ON public.announcements FOR SELECT TO public USING (true);

CREATE POLICY "Organizers can create announcements"
  ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete own announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (auth.uid() = organizer_id);
