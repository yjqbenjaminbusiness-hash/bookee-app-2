
-- Fix 1: terms_consent - restrict INSERT to own user_id
DROP POLICY "Anyone can insert consent" ON public.terms_consent;
CREATE POLICY "Users can insert own consent" ON public.terms_consent
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix 2: profiles - restrict SELECT to own profile + admins
DROP POLICY "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
