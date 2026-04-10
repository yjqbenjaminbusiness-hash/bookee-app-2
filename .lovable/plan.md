

# Add Session Actions, Post Game, Find Participants, and Session Rating

## Overview

Add organizer action buttons (Post Game, Find Participants), and a simple session rating system. Contact buttons already exist in the player event detail view. The rating system needs a new database table.

## 1. Database: Create `session_ratings` table

New migration to create a minimal ratings table:

```sql
CREATE TABLE public.session_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL,
  session_id uuid,
  user_id uuid NOT NULL,
  group_id uuid,
  organizer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.session_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own rating" ON public.session_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Ratings viewable by everyone" ON public.session_ratings
  FOR SELECT TO public USING (true);
```

This stores rating at session level with `group_id` and `organizer_id` for aggregation. The unique constraint prevents duplicate ratings per user per session.

## 2. Organizer Manage View: Add "Post Game" and "Find Participants" buttons

**File**: `src/pages/organizer/ManageEvent.tsx` (SupabaseManageView)

Add two buttons in the header area (after the visibility toggles, ~line 994):

- **"Post Game"**: Generates a formatted message with activity name, date, venue, available slots, and join link (`https://bookee-app.com/player/events/{activityId}`). Copies to clipboard with toast confirmation.
- **"Find Participants"**: Same message but with urgency framing ("Spots filling fast! X slots remaining"). Also copies to clipboard.

Both are simple copy-to-clipboard actions. No bot integration needed for MVP.

## 3. Player Event Detail: Add "Rate Session" button

**File**: `src/pages/player/EventDetails.tsx` (SupabaseActivityView)

After the session list section (~line 1370+), add a "Rate This Session" card that appears for users who have a confirmed booking. Contains:

- 1-5 star selector (clickable star icons, reusing existing `Star` import)
- Optional comment textarea
- Submit button that inserts into `session_ratings` with `activity_id`, `session_id` (first booked session), `group_id` (from activity), `organizer_id`
- Shows existing average rating if ratings exist

Rating target logic: always store `group_id` and `organizer_id` from the activity. Display aggregation can be done at group level or organizer level later.

## 4. Display average rating

- **Player EventDetails**: Show average rating badge next to the activity title (small star + number)
- **GroupPage**: Show average rating from all `session_ratings` where `group_id` matches

Both are simple `SELECT AVG(rating)` queries.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/organizer/ManageEvent.tsx` | Add Post Game + Find Participants buttons in SupabaseManageView header |
| `src/pages/player/EventDetails.tsx` | Add Rate Session UI + display avg rating in SupabaseActivityView |
| `src/pages/player/GroupPage.tsx` | Display group average rating |
| Database migration | Create `session_ratings` table with RLS |

No changes to Telegram bot, no new components, no changes to core session logic.

