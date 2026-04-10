-- Prevent non-service-role users from modifying payment-sensitive fields on UPDATE
CREATE OR REPLACE FUNCTION public.enforce_booking_payment_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role') != 'service_role' THEN
    NEW.payment_status := OLD.payment_status;
    NEW.stripe_payment_id := OLD.stripe_payment_id;
    NEW.reservation_status := OLD.reservation_status;
    NEW.reserved_until := OLD.reserved_until;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER booking_payment_immutability
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_payment_immutability();