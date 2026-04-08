# Fix Demo Behavior, Ballot Functionality, and Clarity

## Diagnosis

### 1. Ballot Sessions Not Showing (Critical)

- **Root cause**: `OrganizeLanding.tsx` only fetches **activities** (`listActivitiesByOrganizer`), never **ballots**. There is no `listBallotsByOrganizer` method in `dataService`. After creating a ballot, it goes to `/organizer/dashboard` (which redirects to `/organize`), but the Organize page never queries the `ballots` table.
- The Explore page (`player/Events.tsx`) also never fetches ballots — only activities.
- The `GroupPage.tsx` also never fetches ballots for a group.
- **Fix**: Add `listBallotsByOrganizer` to `dataService`, then fetch and display ballots in OrganizeLanding, Explore, and GroupPage.

### 2. CreateBallotSession navigates to wrong route

- Line 65: `navigate('/organizer/dashboard')` — should be `navigate('/organize')` (dashboard redirects anyway, but direct is better).

### 3. Demo Visibility Toggle

- Explore and Organize pages both have `showDemo` toggles that filter by `isDemoItem()`. This works for activities/groups with known demo UUIDs.
- **No issue found** with demo filtering in create flows — create flows don't show demo items.
- The demo toggle correctly filters in Explore, Organize, and Dashboard pages.

### 4. Wording: "players" → "participants"

- `ManageEvent.tsx` uses "Players" in ~15 places and "Release Details (visible to confirmed players)" on line 1302.
- `OrganizerDemo.tsx` uses "Player Attendance" (line 198), "Signed Up" (line 201).
- `PlayerDemo.tsx` uses "Signed Up Players" (line 171).

### 5. Demo Structure

- Currently 4 demo quadrants (Organizer, Player, Chat-Org, Chat-Player). User wants simplification to 2: one Explore demo for participants, one Organize demo.
- No ballot example exists in the organizer demo. Change Player to Participants. 

## Plan

### A. `src/lib/data.ts` — Add ballot organizer query

- Add `listBallotsByOrganizer(organizerId)` method that queries `ballots` where `created_by = organizerId`.

### B. `src/pages/organizer/OrganizeLanding.tsx` — Show ballots

- Import `Ballot` type, fetch `listBallotsByOrganizer` alongside activities.
- Store `ballotsByGroup: Record<string, Ballot[]>` keyed by `group_id`.
- Render ballot rows inside expanded groups (alongside activity rows), with a distinct Shuffle icon and "Ballot" badge.
- Also show unlinked ballots (where `group_id` is null).
- Apply `showDemo` filter to ballots too.
- Fix "Upcoming" card color from amber-50/amber-700 to a lighter, more appealing yellow (`yellow-50`/`yellow-600`).

### C. `src/pages/organizer/CreateBallotSession.tsx` — Fix navigation

- Change `navigate('/organizer/dashboard')` to `navigate('/organize')`.

### D. `src/pages/player/Events.tsx` — Show public ballots in Explore

- Fetch `listPublicBallots()` alongside activities.
- Render a "Ballot Sessions" section below activities with ballot cards showing sport, location, deadline, slots.

### E. `src/pages/player/GroupPage.tsx` — Show group ballots

- Fetch `listBallotsByGroup(groupId)` and display ballot rows alongside activity rows.

### F. `src/pages/organizer/ManageEvent.tsx` — Wording fixes

- Replace "Players" → "Participants" in key UI labels (~8 places).
- Replace "Release Details (visible to confirmed players)" → "Share Session Details (visible to confirmed participants)".
- Replace "Details released to confirmed players" → "Details shared with confirmed participants".

### G. `src/pages/demo/OrganizerDemo.tsx` — Add ballot demo example

- Add a sample ballot card in the Management view showing a "Weekly Court Ballot" with participant attempt tracking.
- Replace "Player Attendance" → "Participant Attendance".

### H. `src/pages/demo/PlayerDemo.tsx` — Wording fix

- Replace "Signed Up Players" → "Signed Up Participants".

### I. `src/pages/DemoPage.tsx` — Simplify demo structure

- Reduce from 4 quadrants to 2: "Player Demo" (Explore) and "Organizer Demo" (Organize).
- Remove chat demo cards from the demo landing page.

## Files Changed


| File                                          | Change                                         |
| --------------------------------------------- | ---------------------------------------------- |
| `src/lib/data.ts`                             | Add `listBallotsByOrganizer`                   |
| `src/pages/organizer/OrganizeLanding.tsx`     | Fetch/display ballots, fix Upcoming card color |
| `src/pages/organizer/CreateBallotSession.tsx` | Fix post-create navigation                     |
| `src/pages/player/Events.tsx`                 | Fetch/display public ballots                   |
| `src/pages/player/GroupPage.tsx`              | Fetch/display group ballots                    |
| `src/pages/organizer/ManageEvent.tsx`         | "players" → "participants" wording             |
| `src/pages/demo/OrganizerDemo.tsx`            | Add ballot demo, wording fix                   |
| `src/pages/demo/PlayerDemo.tsx`               | Wording fix                                    |
| `src/pages/DemoPage.tsx`                      | Simplify to 2 demo options                     |


No database changes required.