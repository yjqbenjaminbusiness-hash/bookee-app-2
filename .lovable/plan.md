

# Fix Plan: Special Request as Standalone Option + Status Bug Fixes + Edge Function Imports

## What You Asked For

You want a **"Request Different Timeslot"** option visible on the activity/session page itself — not just the inline special request field inside the join dialog. Players should be able to submit a request for a custom time without needing to pick an existing slot first.

## Current State

- A standalone `SpecialRequestPage` exists at `/player/special-request` but it uses **mock data only** (`store.createSpecialRequest`), not Supabase. It also has hardcoded venues unrelated to the activity being viewed.
- The join dialog already has a "Special Request" textarea — this stays as-is.
- The existing `SpecialRequestPage` and the organizer's `SpecialRequests` page both use mock data, not the database.

## Plan

### 1. Add "Request Different Timeslot" Button on EventDetails Page

In `src/pages/player/EventDetails.tsx`, below the sessions list, add a visible button/link:

```
Can't find a suitable time? → Request a Custom Slot
```

Clicking it opens a dialog (not a page navigation) pre-filled with the activity's venue and sport. The dialog collects:
- Preferred date
- Preferred start/end time
- Optional note

On submit, it creates a **special request record in Supabase** (not mock store).

### 2. Database: Create `special_requests` Table

Since the current special request system is mock-only, we need a real table:

```sql
CREATE TABLE public.special_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_id uuid,
  venue text NOT NULL,
  preferred_date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.special_requests ENABLE ROW LEVEL SECURITY;

-- Players can create their own requests
CREATE POLICY "Users can create own requests" ON public.special_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Players can view own requests
CREATE POLICY "Users can view own requests" ON public.special_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Organizers can view requests for their activities
CREATE POLICY "Organizers can view activity requests" ON public.special_requests
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM activities WHERE activities.id = special_requests.activity_id AND activities.organizer_id = auth.uid())
  );

-- Organizers can update request status
CREATE POLICY "Organizers can update request status" ON public.special_requests
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM activities WHERE activities.id = special_requests.activity_id AND activities.organizer_id = auth.uid())
  );
```

### 3. Update Organizer ManageEvent to Show Special Requests

In `src/pages/organizer/ManageEvent.tsx` (SupabaseManageView), add a section that fetches and displays special requests for the activity from the new table. Show: player name, preferred date/time, note, status, and Approve/Reject buttons.

### 4. Fix Participant Status Bug

In `src/pages/player/EventDetails.tsx`:
- Add `rejected` check as first condition in `getMyStatus()`
- Add `rejected` case to `statusBadge()`
- Exclude rejected bookings from `userBookingIds` so rejected users can re-sign up
- Add `rejected` badge to participant list

In `src/pages/organizer/ManageEvent.tsx`:
- Add `rejected` status to the participant table badge

### 5. Fix Edge Function Build Errors

In all 6 edge function files, change:
```
import { createClient } from "npm:@supabase/supabase-js@2.57.2"
```
to:
```
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
```

## Files Modified

| File | Changes |
|------|---------|
| Migration SQL | Create `special_requests` table with RLS |
| `src/pages/player/EventDetails.tsx` | Add "Request Custom Slot" dialog; fix `getMyStatus()` and `statusBadge()` for rejected; exclude rejected from `userBookingIds` |
| `src/pages/organizer/ManageEvent.tsx` | Add special requests section from DB; fix rejected badge in participant table |
| 6 edge function `index.ts` files | Fix `npm:` import to `https://esm.sh/` |

## Risk Assessment
- New `special_requests` table is fully additive — no existing data affected
- Status fix only adds new cases, no existing logic removed
- Edge function import is a direct swap

