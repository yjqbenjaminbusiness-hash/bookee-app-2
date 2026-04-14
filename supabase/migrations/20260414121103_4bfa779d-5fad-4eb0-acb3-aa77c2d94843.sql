CREATE OR REPLACE FUNCTION public.enforce_booking_payment_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _is_organizer boolean;
BEGIN
  IF current_setting('role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM activity_sessions s
    JOIN activities a ON a.id = s.activity_id
    WHERE s.id = NEW.session_id AND a.organizer_id = auth.uid()
  ) INTO _is_organizer;

  IF NOT _is_organizer THEN
    NEW.payment_status := OLD.payment_status;
    NEW.reservation_status := OLD.reservation_status;
    NEW.reserved_until := OLD.reserved_until;
  END IF;

  NEW.stripe_payment_id := OLD.stripe_payment_id;

  RETURN NEW;
END;
$$;