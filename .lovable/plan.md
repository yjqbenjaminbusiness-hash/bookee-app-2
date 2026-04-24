
# Manage Sessions, Past/Upcoming Sorting & Share Session

## Goal
Make organizing simpler: let organizers attach/detach sessions from groups, hide past clutter from the main organizer view, and bring back a clear "Share Session" action that copies a useful preformatted message (not just a bare link).

## Scope (UI + a tiny data helper — no schema changes, no flow changes)

### 1. Manage Sessions inside Groups (organizer)
**Where**: `src/pages/organizer/OrganizeLanding.tsx` (the expanded group panel).

For each activity row inside a group, add a small **"Remove from group"** action (icon button, confirm via `toast`). It calls a new `dataService.updateActivityGroup(activityId, null)` which simply runs `supabase.from('activities').update({ group_id: null })`. The activity then shows up under "Unlinked Activities".

For attaching, add an **"Add to group"** control on each unlinked activity row that opens a small dropdown of the organizer's groups; selecting one calls `dataService.updateActivityGroup(activityId, groupId)`.

The existing per-group "Quick Create" buttons (Activity / Ballot / Event with `?group=<id>`) already handle "add a brand-new session to a group" — keep them as-is.

**No new pages, no migrations.** RLS already allows organizers to update their own activities (`auth.uid() = organizer_id`).

### 2. Sort Activities: Upcoming vs Past (CRITICAL)
**Where**: `src/pages/organizer/OrganizeLanding.tsx`.

Currently the expanded group panel and the "Unlinked Activities" section render every activity regardless of date. Change to:

- **Default view per group**: render only `date >= today` activities.
- Add a collapsed **"Past Activities (N)"** disclosure at the bottom of each group panel — clicking expands to show past sessions in a muted style. Same for the "Unlinked Activities" / "Unlinked Ballots" sections (split into upcoming list + collapsed "Past" group).
- Sort upcoming **ascending** by date (soonest first), past **descending** (most recent first).

Player views (`Dashboard.tsx`, `GroupPage.tsx`) already separate upcoming/past via tabs — no change needed there.

### 3. Restore + rename "Find Participants" → "Share Session"
**Where**: `src/pages/organizer/ManageEvent.tsx` (header area of `SupabaseManageView`, around the "Players Visible / Public" buttons, lines ~978–996).

Add a single primary **"Share Session"** button (with a `Share2` icon) next to the visibility toggles. Clicking it builds and copies a preformatted message based on the activity + its sessions:

```
Wed 8pm · Badminton @ ActiveSG Bishan

6/8 slots filled · 2 slots left

Join here:
https://bookee-app.com/player/events/<activity-id>
```

Implementation:
- One handler `handleShareSession()` that composes the string from `activity.title`, formatted date, `venue`, aggregated `filledSlots`/`totalSlots`, and the canonical link `https://bookee-app.com/player/events/${activity.id}`.
- Copies via `navigator.clipboard.writeText(...)` and `toast.success('Session details copied — paste in WhatsApp/Telegram')`.
- Add a small dropdown next to it with two optional deep-link shortcuts: **WhatsApp** (`https://wa.me/?text=<encoded>`) and **Telegram** (`https://t.me/share/url?url=<link>&text=<encoded>`). Both open in a new tab. Direct copy remains the primary path.

### 4. Reduce ManageEvent UI clutter
**Where**: `src/pages/organizer/ManageEvent.tsx` (`SupabaseManageView` only — the legacy mock view stays untouched).

- Keep: Share Session, Players Visible toggle, Public/Private toggle, Add Timeslot, slot adjusters, per-row Confirm / Mark Paid / Waitlist / Remove, Add Guest, Announcements, bulk actions bar.
- Remove the redundant **"Remind"** bulk action (no working notification path; consistent with prior cleanup of broken broadcast buttons).
- Keep the existing row "Status" badge logic ("✓ Joined" / "✓ Confirmed" / "✕ Rejected") — already correct from the previous iteration.

### 5. Things explicitly NOT changed
- ❌ No DB schema/migration.
- ❌ No changes to `enforce_booking_defaults` trigger or RLS.
- ❌ No changes to email/notification system.
- ❌ No changes to payment gating.
- ❌ Player Dashboard / GroupPage past/upcoming tabs already exist — left as-is.
- ❌ Existing `Share2` icon link in OrganizeLanding rows (copies bare URL) is replaced by the same preformatted message used in ManageEvent, for consistency.

## Files touched
- `src/lib/data.ts` — add `updateActivityGroup(activityId: string, groupId: string | null): Promise<void>` and a small shared helper `buildShareMessage(activity, sessions): string`.
- `src/pages/organizer/OrganizeLanding.tsx` — add per-row "Remove from group" / "Add to group" actions; split each section into upcoming + collapsible "Past Activities (N)"; switch the row Share button to copy the preformatted message.
- `src/pages/organizer/ManageEvent.tsx` (`SupabaseManageView`) — add **"Share Session"** button + WhatsApp/Telegram quick-share dropdown in the header; remove the "Remind" bulk action.

## Success criteria
- Organizer can move any activity into or out of a group from `/organize` without leaving the page.
- The default `/organize` view shows only upcoming activities; past ones are tucked into a collapsed "Past Activities (N)" section per group / unlinked list.
- "Share Session" appears on the activity manage page; clicking copies a multi-line message with title, date/venue, slot fill, and canonical link.
- Optional WhatsApp / Telegram quick-share opens a prefilled compose window.
- "Copy Link" / share UX in OrganizeLanding rows now copies the same useful preformatted message instead of a bare URL.
- No new broken/dead buttons; no DB migrations; no regressions to payment, RLS, or email flows.
