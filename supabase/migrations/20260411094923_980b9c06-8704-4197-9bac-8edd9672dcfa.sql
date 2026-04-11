-- Fix: Restrict bookings UPDATE policy to authenticated users only
-- This prevents anonymous users from updating guest bookings where user_id IS NULL
DROP POLICY IF EXISTS "Organizers can update bookings" ON public.bookings;

CREATE POLICY "Organizers can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id)
  OR (EXISTS (
    SELECT 1 FROM activity_sessions s
    JOIN activities a ON s.activity_id = a.id
    WHERE s.id = bookings.session_id AND a.organizer_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix: Set search_path on functions missing it
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;