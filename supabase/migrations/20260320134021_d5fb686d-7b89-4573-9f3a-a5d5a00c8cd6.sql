
-- ==========================================
-- BOOKEE DATABASE SCHEMA
-- ==========================================

-- 1. Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'pending', 'paid', 'refunded');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  telegram_chat_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 4. Activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  sport TEXT NOT NULL,
  venue TEXT NOT NULL,
  location TEXT,
  description TEXT,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  auto_post_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_post_count INTEGER NOT NULL DEFAULT 0,
  max_auto_posts INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activities viewable by everyone" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Organizers can create activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update own activities" ON public.activities FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete own activities" ON public.activities FOR DELETE USING (auth.uid() = organizer_id);

-- 5. Activity sessions (multi-session support)
CREATE TABLE public.activity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
  time_label TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  max_slots INTEGER NOT NULL DEFAULT 10,
  filled_slots INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sessions viewable by everyone" ON public.activity_sessions FOR SELECT USING (true);
CREATE POLICY "Organizers can manage sessions" ON public.activity_sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.activities WHERE id = activity_id AND organizer_id = auth.uid())
);
CREATE POLICY "Organizers can update sessions" ON public.activity_sessions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.activities WHERE id = activity_id AND organizer_id = auth.uid())
);
CREATE POLICY "Organizers can delete sessions" ON public.activity_sessions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.activities WHERE id = activity_id AND organizer_id = auth.uid())
);

-- 6. Bookings / Reservations
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.activity_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  player_phone TEXT,
  player_username TEXT,
  reservation_status reservation_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  stripe_payment_id TEXT,
  amount DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bookings viewable by participant or organizer" ON public.bookings FOR SELECT USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.activity_sessions s 
    JOIN public.activities a ON s.activity_id = a.id 
    WHERE s.id = session_id AND a.organizer_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Anyone can create booking" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Organizers can update bookings" ON public.bookings FOR UPDATE USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.activity_sessions s 
    JOIN public.activities a ON s.activity_id = a.id 
    WHERE s.id = session_id AND a.organizer_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- 7. Terms/PDPA consent
CREATE TABLE public.terms_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consent BOOLEAN NOT NULL DEFAULT true,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.terms_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own consent" ON public.terms_consent FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert consent" ON public.terms_consent FOR INSERT WITH CHECK (true);

-- 8. Beta registrations
CREATE TABLE public.beta_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  activity_size TEXT,
  organize_frequency TEXT,
  consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can register for beta" ON public.beta_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view registrations" ON public.beta_registrations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 9. Telegram bot state
CREATE TABLE public.telegram_bot_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  update_offset BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (1, 0);
ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.telegram_bot_state FOR ALL USING (false);

-- 10. Telegram messages
CREATE TABLE public.telegram_messages (
  update_id BIGINT PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  text TEXT,
  raw_update JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_telegram_messages_chat_id ON public.telegram_messages (chat_id);
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.telegram_messages FOR ALL USING (false);

-- 11. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
