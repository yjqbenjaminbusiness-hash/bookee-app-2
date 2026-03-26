
-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  sport TEXT NOT NULL DEFAULT 'Other',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for groups
CREATE POLICY "Groups viewable by everyone" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Owners can update own groups" ON public.groups FOR UPDATE TO authenticated USING (auth.uid() = organizer_id);
CREATE POLICY "Owners can delete own groups" ON public.groups FOR DELETE TO authenticated USING (auth.uid() = organizer_id);

-- Create group_members junction table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members viewable by everyone" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join groups" ON public.group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_members.group_id AND organizer_id = auth.uid()));

-- Add group_id and image_url to activities
ALTER TABLE public.activities ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.activities ADD COLUMN image_url TEXT;

-- Add group_id to ballots
ALTER TABLE public.ballots ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

-- Create storage bucket for activity images
INSERT INTO storage.buckets (id, name, public) VALUES ('activity-images', 'activity-images', true);

-- Storage RLS: anyone can read, authenticated can upload
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'activity-images');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'activity-images');
CREATE POLICY "Users can update own uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'activity-images');
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'activity-images');
