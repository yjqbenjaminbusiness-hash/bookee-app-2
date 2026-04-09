

# Unify Ballot Sessions with Activity Sessions

## Diagnosis

Ballots are currently a **completely separate system**:
- Separate DB table (`ballots`) with different columns
- Separate participants table (`ballot_participants`) instead of `bookings`
- Separate detail page (`BallotDetails.tsx`) with custom UI
- Separate creation page (`CreateBallotSession.tsx`) inserting into `ballots`
- None of the activity features work for ballots (announcements, release details, participant management, waitlist, payment tracking, guest booking, etc.)

## Approach

Convert ballot creation to insert into the **activities** table (with a `session_type` tag), so ballots automatically get all activity features. The existing `ballots` table stays untouched (legacy data), but new ballots go through the activity system.

## Plan

### 1. Database Migration — Add `session_type` column to `activities`

Add a `session_type TEXT NOT NULL DEFAULT 'activity'` column. Values: `'activity'`, `'ballot'`. This is the only schema change needed.

### 2. Modify `CreateBallotSession.tsx` — Insert into activities + activity_sessions

Instead of inserting into `ballots`, call `dataService.createActivity()` with `session_type: 'ballot'`, then create one `activity_session` with the ballot's slots/deadline info. Maps:
- `activity_name` → `title`
- `location` → `venue` + `location`
- `ballot_deadline` → `date`
- `slots` → `activity_session.max_slots`
- `created_by` → `organizer_id`

### 3. Update `src/lib/data.ts` — Add session_type to Activity interface and createActivity

- Add `session_type` to the `Activity` interface
- Pass `session_type` through in `createActivity()`
- Add `listBallotActivities()` — filters activities where `session_type = 'ballot'`
- Add `listPublicBallotActivities()` — public ballot-type activities
- Add `listBallotActivitiesByOrganizer(organizerId)` — organizer's ballot activities
- Add `listBallotActivitiesByGroup(groupId)` — group's ballot activities

### 4. Update `OrganizeLanding.tsx` — Fetch ballot-type activities

Replace `dataService.listBallotsByOrganizer()` with `dataService.listBallotActivitiesByOrganizer()`. Render them alongside regular activities with a "Ballot" badge. They use the same row renderer but tagged differently.

### 5. Update `Events.tsx` (Explore) — Show public ballot activities

Replace `dataService.listPublicBallots()` with `dataService.listPublicBallotActivities()`. Render in the same activity grid with a "Ballot" badge. Click navigates to `/player/events/:id` (same EventDetails page).

### 6. Update `GroupPage.tsx` — Show group ballot activities

Replace `dataService.listBallotsByGroup()` with `dataService.listBallotActivitiesByGroup()`. Render in same activity list with badge.

### 7. Update `EventDetails.tsx` — Show "Ballot" badge when session_type is ballot

In the `SupabaseActivityView`, check `activity.session_type === 'ballot'` and show a Ballot badge. All features (participant list, announcements, release details, etc.) work automatically since it's the same activity system.

### 8. Update routing in `App.tsx`

Redirect `/player/ballots/:id` to `/player/events/:id` for backward compatibility with any shared links.

### 9. Keep `BallotDetails.tsx` as redirect only

Replace the full component with a simple redirect to `/player/events/:id`.

## Files Changed

| File | Change |
|------|--------|
| **DB Migration** | Add `session_type` column to `activities` |
| `src/lib/data.ts` | Add `session_type` to interface, add ballot-activity query methods |
| `src/pages/organizer/CreateBallotSession.tsx` | Insert into activities + activity_sessions instead of ballots |
| `src/pages/organizer/OrganizeLanding.tsx` | Use ballot-activity queries, add badge |
| `src/pages/player/Events.tsx` | Use ballot-activity queries, add badge |
| `src/pages/player/GroupPage.tsx` | Use ballot-activity queries, add badge |
| `src/pages/player/EventDetails.tsx` | Show "Ballot" badge when session_type is ballot |
| `src/pages/player/BallotDetails.tsx` | Convert to redirect to EventDetails |
| `src/App.tsx` | Minor: keep route but it redirects |

No changes to demo, layout, or ManageEvent (it already works for any activity).

