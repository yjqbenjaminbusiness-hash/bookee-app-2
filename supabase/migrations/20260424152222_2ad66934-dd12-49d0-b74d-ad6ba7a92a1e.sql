-- Public, read-only function returning active booking counts per session for a given activity.
-- Counts only bookings that are NOT 'rejected' or 'cancelled' (matches Activity page logic).
-- SECURITY DEFINER + restricted privileges so callers can read counts without seeing booking PII.

CREATE OR REPLACE FUNCTION public.get_active_booking_counts(p_activity_id uuid)
RETURNS TABLE(session_id uuid, active_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id AS session_id,
         COALESCE(COUNT(b.id) FILTER (
           WHERE b.reservation_status NOT IN ('rejected', 'cancelled')
         ), 0)::integer AS active_count
  FROM public.activity_sessions s
  LEFT JOIN public.bookings b ON b.session_id = s.id
  WHERE s.activity_id = p_activity_id
  GROUP BY s.id;
$$;

REVOKE ALL ON FUNCTION public.get_active_booking_counts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_booking_counts(uuid) TO anon, authenticated;