

# Fix & Enhance Plan: Username, Private Activities, Announcements, Special Requests, Waitlist, Status System

## Diagnosis

1. **Username**: The `profiles` table has `display_name` but no dedicated `username` field. The `bookings` table already has `player_username` column. Settings page is read-only — no edit capability.

2. **Private activities**: The `participantVisibility` field exists only in mock data (`MockEvent`). The Supabase `activities` table has NO visibility/privacy column. The Explore page (`Events.tsx`) fetches all activities via `dataService.listActivities()` with no filtering. The `CreateEvent` form has a visibility toggle but never stores it to the DB.

3. **Announcements**: No announcements table or mechanism exists for per-activity announcements.

4. **Special request during signup/join**: The `bookings` table has no `special_request` or `notes` field. The join flow in `EventDetails.tsx` has no input for it.

5. **Waitlist**: When session is full, the UI shows "Full" badge but no "Join Waitlist" option. No auto-waitlist logic.

6. **Participant status**: Booking has `reservation_status` (pending/confirmed/rejected) and `payment_status` (unpaid/pending/paid). The player-facing view doesn't show the user their own status clearly.

## Schema Changes Required

**Migration 1** — Add columns and table:
```sql
-- Add username to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;

-- Add visibility to activities (public/private, default public)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

-- Add special_request to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_request text;

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL,
  organizer_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS: everyone can read announcements for activities they can see
CREATE POLICY "Announcements viewable by everyone"
  ON public.announcements FOR SELECT TO public USING (true);

CREATE POLICY "Organizers can create announcements"
  ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete own announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (auth.uid() = organizer_id);
```

## Implementation Plan

### 1. Username Customization
- **SettingsPage.tsx**: Add editable username field with save button. Update `profiles.username` via Supabase. Show fallback to `display_name`.
- **useAuth.tsx**: Include `username` in `supabaseUserToMockUser` mapping; add to `MockUser` type.
- **data.ts**: When creating bookings, pass `player_username` alongside `player_name`.
- **Participant lists**: Display `player_username || player_name` in EventDetails and ManageEvent.

### 2. Private Activity Visibility
- **CreateEvent.tsx**: Save `participantVisibility` value as `visibility` column on activity creation.
- **data.ts**: Add `listPublicActivities()` that filters `visibility = 'public'`.
- **Events.tsx** (Explore): Use `listPublicActivities()` instead of `listActivities()` so private activities are hidden from non-members.
- **OrganizeLanding.tsx**: Continue showing all organizer's activities (including private).
- **ManageEvent.tsx** (Supabase view): Add toggle to switch activity visibility.

### 3. Announcements
- **data.ts**: Add `createAnnouncement()`, `listAnnouncementsByActivity()`.
- **ManageEvent.tsx** (Supabase view): Add announcement input + send button + list of past announcements.
- **EventDetails.tsx** (SupabaseActivityView): Show announcements section for participants.

### 4. Special Request on Join
- **EventDetails.tsx** (SupabaseActivityView `handleJoin`): Show a small dialog/modal before confirming join, with optional "Special Request" textarea. Pass to `createBooking()`.
- **data.ts** `createBooking`: Include `special_request` field.
- **ManageEvent.tsx**: Display special request in participant table (tooltip or inline).

### 5. Waitlist Auto-Join
- **EventDetails.tsx** (SupabaseActivityView): When session is full, change button to "Join Waitlist". Create booking with `reservation_status = 'cancelled'` (matching existing waitlist convention).
- Show "Waitlisted" badge to user instead of "Joined".

### 6. Participant Status System
- **EventDetails.tsx** (SupabaseActivityView): After joining, show user's status clearly: "Confirmed", "Pending", "Waitlisted", "Pending Payment".
- **Unlock logic**: When user's `reservation_status !== 'confirmed'` or `payment_status === 'unpaid'`, hide certain details (e.g., organizer phone, court info) behind a lock icon.

### Files Modified
| File | Changes |
|------|---------|
| `src/pages/SettingsPage.tsx` | Add username edit field |
| `src/hooks/useAuth.tsx` | Map username from profile |
| `src/lib/data.ts` | Add visibility filter, announcements CRUD, special_request in booking, Activity type update |
| `src/pages/organizer/CreateEvent.tsx` | Save visibility to DB |
| `src/pages/player/Events.tsx` | Filter private activities |
| `src/pages/player/EventDetails.tsx` | Waitlist join, special request modal, status display, announcements view, unlock logic |
| `src/pages/organizer/ManageEvent.tsx` | Announcements posting, visibility toggle, special request display |
| Migration SQL | New columns + announcements table |

### Risk Assessment
- Adding columns with defaults is safe — no existing data breaks.
- New `announcements` table is additive.
- Filtering explore by `visibility = 'public'` only affects the public listing; organizer views remain unfiltered.
- Waitlist uses existing `reservation_status = 'cancelled'` convention already in ManageEvent, so no conflict.

