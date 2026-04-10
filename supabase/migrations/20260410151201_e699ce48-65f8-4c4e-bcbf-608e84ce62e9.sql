CREATE TABLE public.session_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL,
  session_id uuid,
  user_id uuid NOT NULL,
  group_id uuid,
  organizer_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Use a validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_session_rating
BEFORE INSERT OR UPDATE ON public.session_ratings
FOR EACH ROW EXECUTE FUNCTION public.validate_rating();

ALTER TABLE public.session_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own rating" ON public.session_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Ratings viewable by everyone" ON public.session_ratings
  FOR SELECT TO public USING (true);