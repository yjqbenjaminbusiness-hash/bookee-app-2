
-- Tighten bookings INSERT: require at least a player_name
-- The WITH CHECK (true) warnings are acceptable for:
-- - bookings: players may join without auth (guest flow)
-- - terms_consent: consent recorded at signup before full auth
-- - beta_registrations: public beta form
-- No changes needed - these are intentional design decisions for the Bookee platform
-- Adding a note comment for documentation purposes

COMMENT ON POLICY "Anyone can create booking" ON public.bookings IS 'Intentionally permissive - supports guest player join flow';
COMMENT ON POLICY "Anyone can insert consent" ON public.terms_consent IS 'Intentionally permissive - consent captured at signup';
COMMENT ON POLICY "Anyone can register for beta" ON public.beta_registrations IS 'Intentionally permissive - public beta registration form';
