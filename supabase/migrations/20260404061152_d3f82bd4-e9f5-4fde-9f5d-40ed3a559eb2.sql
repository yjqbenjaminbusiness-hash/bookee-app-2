
-- Insert demo group
INSERT INTO public.groups (id, organizer_id, name, description, sport, image_url)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '7a918d88-ced4-447c-8c3a-de1452ace6ba',
  'Demo Group – Badminton Club',
  'This is a demo group to showcase the platform features.',
  'Badminton',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Insert demo activity linked to demo group
INSERT INTO public.activities (id, organizer_id, title, sport, venue, location, date, description, status, group_id, image_url)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '7a918d88-ced4-447c-8c3a-de1452ace6ba',
  'Demo Activity – Weekend Badminton',
  'Badminton',
  'Demo Sports Hall',
  'Demo Location',
  '2030-12-31',
  'This is a demo activity to showcase the platform. Not a real session.',
  'active',
  '00000000-0000-0000-0000-000000000001',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Insert demo session for the demo activity
INSERT INTO public.activity_sessions (id, activity_id, time_label, start_time, end_time, max_slots, filled_slots, price)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '10:00 AM - 12:00 PM',
  '10:00',
  '12:00',
  20,
  0,
  10
) ON CONFLICT (id) DO NOTHING;

-- Auto-join organizer as group member
INSERT INTO public.group_members (group_id, user_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '7a918d88-ced4-447c-8c3a-de1452ace6ba'
) ON CONFLICT DO NOTHING;
