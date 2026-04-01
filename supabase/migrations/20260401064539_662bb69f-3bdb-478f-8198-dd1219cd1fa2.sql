
-- Fix 1: Prevent payment status forgery on booking INSERT
-- Force safe defaults so clients cannot forge paid/confirmed status
CREATE OR REPLACE FUNCTION public.enforce_booking_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only the service role can set these; for normal users, force defaults
  IF current_setting('role') != 'service_role' THEN
    NEW.payment_status := 'unpaid';
    NEW.reservation_status := 'pending';
    NEW.stripe_payment_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_booking_defaults
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_defaults();

-- Fix 2: Restrict storage uploads to resource owners
-- Activity images: only the activity organizer can upload
DROP POLICY IF EXISTS "Authenticated users can upload activity images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload activity images" ON storage.objects;
CREATE POLICY "Organizers can upload activity images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'activity-images'
    AND owner = auth.uid()
  );

-- Group images: only the group organizer can upload  
DROP POLICY IF EXISTS "Authenticated users can upload group images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload group images" ON storage.objects;
CREATE POLICY "Organizers can upload group images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'group-images'
    AND owner = auth.uid()
  );
