

# Fix Ballot Functionality

## Diagnosis

The ballot creation flow works correctly — it inserts into the `ballots` table via Supabase. However, **ballots are never fetched or displayed** in any of the three target views:

1. **OrganizeLanding** (`/organize`) — only fetches `activities` via `listActivitiesByOrganizer`. No ballot query exists.
2. **GroupPage** (`/player/groups/:id`) — only fetches activities via `listActivitiesByGroup`. No ballot query.
3. **Explore** (`/player/events`) — only fetches activities via `listPublicActivities`. No ballot query.

Additionally:
- `data.ts` has `listBallots`, `listPublicBallots`, `listBallotsByGroup` but is **missing `listBallotsByOrganizer`**.
- `CreateBallotSession` navigates to `/organizer/dashboard` (line 65) instead of `/organize`.

## Plan

### 1. `src/lib/data.ts` — Add missing method

Add `listBallotsByOrganizer(organizerId: string)` that queries `ballots` where `created_by = organizerId`.

### 2. `src/pages/organizer/OrganizeLanding.tsx` — Fetch and display ballots

- Import `Ballot` type from `data.ts`
- Fetch `dataService.listBallotsByOrganizer(user.id)` alongside activities
- Store ballots in state, group by `group_id`
- Render ballot rows inside expanded groups (with Shuffle icon and "Ballot" badge) alongside activity rows
- Show unlinked ballots in the unlinked section
- Apply `showDemo` filter to ballots

### 3. `src/pages/player/Events.tsx` — Show public ballots in Explore

- Import `Ballot` type
- Fetch `dataService.listPublicBallots()` alongside activities
- Render a "Ballot Sessions" section with ballot cards (sport, location, deadline, slots)
- Apply sport filter and search to ballots too

### 4. `src/pages/player/GroupPage.tsx` — Show group ballots

- Import `Ballot` type
- Fetch `dataService.listBallotsByGroup(groupId)` alongside activities
- Render ballot rows alongside activity rows in the upcoming/past tabs

### 5. `src/pages/organizer/CreateBallotSession.tsx` — Fix navigation

- Line 65: Change `navigate('/organizer/dashboard')` → `navigate('/organize')`

## Files Changed

| File | Change |
|------|--------|
| `src/lib/data.ts` | Add `listBallotsByOrganizer` method |
| `src/pages/organizer/OrganizeLanding.tsx` | Fetch + render ballots in groups |
| `src/pages/player/Events.tsx` | Fetch + render public ballots |
| `src/pages/player/GroupPage.tsx` | Fetch + render group ballots |
| `src/pages/organizer/CreateBallotSession.tsx` | Fix post-create navigation |

No database changes needed.

