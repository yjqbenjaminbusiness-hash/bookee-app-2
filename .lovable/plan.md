

# Enhance Organizer, Guest, Privacy, Telegram & Platform Features

## Diagnosis

### Current State
1. **Organizer-Added Guests**: No mechanism exists. Bookings require `user_id` (authenticated). Organizer can only manage existing bookings.
2. **Participant List Privacy**: `activities.visibility` column is overloaded — used for both listing visibility AND participant visibility in CreateEvent. ManageEvent toggles it for listing. The Supabase EventDetails path does NOT enforce participant list hiding.
3. **Terms & Conditions**: Login and Landing pages have placeholder links (`href="#"`) — no actual T&C page exists.
4. **Telegram**: Explore lists up to 8 activities (no limit to top 3, no location filter, no demo filtering, no "View more on web" link). Domain is `bookee-app.lovable.app`.
5. **Domain**: `SITE_URL` in telegram-poll is `https://bookee-app.lovable.app`. Need to confirm target domain.

### Conflicts
- The `visibility` column cannot serve both "listing privacy" and "participant list privacy" without a schema change.
- Guest bookings need `user_id = NULL` but the booking RLS requires `auth.uid() = user_id` for INSERT. Organizer-added guests must be inserted by the organizer, so we need an RLS policy allowing organizers to insert bookings for their activity sessions.

## Plan

### 1. Database Migration — Add `participant_visibility` column + Guest booking support

```sql
-- Separate participant list visibility from activity listing visibility
ALTER TABLE activities ADD COLUMN participant_visibility text NOT NULL DEFAULT 'public';

-- Allow organizers to insert bookings (for adding guests)
CREATE POLICY "Organizers can add guests" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activity_sessions s
      JOIN activities a ON s.activity_id = a.id
      WHERE s.id = bookings.session_id AND a.organizer_id = auth.uid()
    )
  );

-- Allow organizers to delete bookings (for removing guests)  
CREATE POLICY "Organizers can delete bookings" ON bookings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activity_sessions s
      JOIN activities a ON s.activity_id = a.id
      WHERE s.id = bookings.session_id AND a.organizer_id = auth.uid()
    )
  );
```

### 2. CreateEvent.tsx — Save `participant_visibility` separately
- Change `visibility: participantVisibility` to `participant_visibility: participantVisibility`
- Keep the existing `visibility` field as the default `'public'` for listing

### 3. ManageEvent.tsx — Add Guest feature + Participant Visibility toggle
- Add "Add Guest" form per session (name + optional note)
- Insert guest as booking with `user_id: null`, `player_name: "Guest - {name}"`, `reservation_status: 'confirmed'`
- Organizer can remove guests (delete booking)
- Add participant visibility toggle (separate from listing visibility) reading/writing `participant_visibility`

### 4. EventDetails.tsx (Supabase path) — Enforce participant list privacy
- Read `participant_visibility` from activity
- If `private`: hide participant list for non-organizer users (show only "X/Y booked" count + user's own booking status)

### 5. Terms & Conditions Page
- Create `src/pages/TermsPage.tsx` with basic terms content (no unlawful activities, no harmful events, no prohibited content)
- Add route `/terms` in App.tsx
- Update LoginPage and LandingPage placeholder links to point to `/terms`

### 6. Telegram Bot Improvements
In `supabase/functions/telegram-poll/index.ts`:

**A. Explore — Top 3 + "View more"**
- Change activity limit from 8 to 3
- Filter out demo activities (IDs ending in `0001`/`0002` pattern)
- Add "🌐 View more on web" button linking to web app `/player/events`

**B. Browse by location**
- Add "📍 Browse by Location" button in explore
- When clicked, query distinct venues, show as buttons
- Filter activities by selected venue

**C. Domain update**
- Change `SITE_URL` from `https://bookee-app.lovable.app` to the published domain

### 7. Data Service Update
- Update `dataService.createActivity` to accept `participant_visibility`

## Files Modified

| File | Changes |
|------|---------|
| Migration SQL | Add `participant_visibility` column, guest INSERT/DELETE policies |
| `src/pages/organizer/CreateEvent.tsx` | Save `participant_visibility` separately |
| `src/pages/organizer/ManageEvent.tsx` | Add guest form, participant visibility toggle |
| `src/pages/player/EventDetails.tsx` | Enforce participant list privacy |
| `src/pages/TermsPage.tsx` | New — basic T&C page |
| `src/App.tsx` | Add `/terms` route |
| `src/pages/LoginPage.tsx` | Link to `/terms` |
| `src/pages/LandingPage.tsx` | Link to `/terms` |
| `src/lib/data.ts` | Accept `participant_visibility` in createActivity |
| `supabase/functions/telegram-poll/index.ts` | Top 3 activities, location browse, demo filter, domain update, "view more" link |

## Risk Assessment
- New `participant_visibility` column is additive — no existing data affected, defaults to `public`
- Guest INSERT policy is additive — existing booking flow unchanged since authenticated users still use the existing policy
- Telegram changes are self-contained in the edge function

