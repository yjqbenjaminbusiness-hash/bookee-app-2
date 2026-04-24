
## Root cause

There are two independent ways the app computes "how many people joined a session":

1. **Activity page (`EventDetails.tsx`)** — counts real rows in `bookings` filtered as `reservation_status NOT IN ('rejected','cancelled')`. This is the **truth**.
2. **Explore page (`Events.tsx`)**, **Organizer dashboard**, and several cards — read `activity_sessions.filled_slots`, a denormalized counter column.

`filled_slots` is **never automatically incremented** when a booking is inserted (no DB trigger maintains it; it only gets decremented in `cancelBooking`). So Explore shows 0 while the Activity page correctly shows 3. Same root cause for any other view reading `filled_slots`.

Additionally, **Explore shows past activities** because there is no `date >= today` filter on either Public Activities or Ballot Sessions.

## Fix strategy (UI-layer, no DB migration)

Make `bookings` the single source of truth for participant counts everywhere. Compute counts client-side from the bookings table (which is already what the Activity page does and trusts). This guarantees Activity and Explore match.

### 1. Add a shared helper in `src/lib/data.ts`

```ts
// Returns counts keyed by session_id, counting only active bookings
async listActiveBookingCountsByActivity(activityId: string): Promise<Record<string, number>> {
  // join via activity_sessions.activity_id
  const { data: sess } = await supabase
    .from('activity_sessions').select('id').eq('activity_id', activityId);
  const ids = (sess || []).map(s => s.id);
  if (!ids.length) return {};
  const { data: bks } = await supabase
    .from('bookings')
    .select('session_id, reservation_status')
    .in('session_id', ids)
    .not('reservation_status', 'in', '(rejected,cancelled)');
  const counts: Record<string, number> = {};
  ids.forEach(id => counts[id] = 0);
  (bks || []).forEach(b => { counts[b.session_id] = (counts[b.session_id] || 0) + 1; });
  return counts;
}
```

(RLS already permits SELECT on bookings for "participant or organizer or admin", but we only need the count — not the rows. Since unauth users can't see other users' bookings under current RLS, we will instead expose the count via a public read path: see step 2.)

### 2. Make counts publicly visible (small DB function, no schema change)

Create a `SECURITY DEFINER` SQL function `public.get_active_booking_counts(p_activity_id uuid)` that returns `(session_id uuid, count int)` aggregated from `bookings` where `reservation_status NOT IN ('rejected','cancelled')`. Call via `supabase.rpc('get_active_booking_counts', { p_activity_id })`. This bypasses RLS safely because it returns only counts (no PII), matching what the Activity page already shows.

This keeps Activity and Explore numerically identical for **any** viewer (logged in or not).

### 3. Update Explore (`src/pages/player/Events.tsx`)

- After loading sessions, also call the new RPC for each activity and store `Record<activityId, Record<sessionId, number>>`.
- Replace `s.filled_slots` in the cards with the RPC count (fallback to `filled_slots` if RPC fails).
- Add **upcoming-only** filter: `a.date >= todayISO` for both Public Activities and Ballot Sessions (sorted ascending by date).
- Add a collapsed "Past Activities" disclosure at the bottom that lists past public activities (descending), styled muted — same pattern already used on `OrganizeLanding.tsx`.

### 4. Update Organizer landing (`src/pages/organizer/OrganizeLanding.tsx`)

- Use the same RPC counts to compute `totalParticipants` instead of summing `filled_slots`. This keeps the dashboard metric consistent with the Activity page.

### 5. Apply the same source on Group page cards (`src/pages/player/GroupPage.tsx`)

- Same RPC-driven counts so a session shown inside a group card matches the Activity page.

## What stays the same

- DB schema and existing triggers (`enforce_booking_defaults`, `enforce_booking_payment_immutability`) — untouched.
- "Copy Link" / Share Session flow — untouched.
- "Joined" relabeling on bookings — untouched.
- Email infrastructure — untouched.
- `filled_slots` column remains in place as a fallback and continues to be decremented on cancel; we just stop relying on it as the display value.

## Files changed

- `supabase/migrations/<new>.sql` — add `get_active_booking_counts(uuid)` SECURITY DEFINER function (returns only counts).
- `src/lib/data.ts` — add `listActiveBookingCountsByActivity` wrapper around the RPC.
- `src/pages/player/Events.tsx` — use RPC counts; add upcoming/past split for both Public and Ballot sections.
- `src/pages/organizer/OrganizeLanding.tsx` — switch `totalParticipants` metric to RPC counts.
- `src/pages/player/GroupPage.tsx` — switch session card counts to RPC counts.

## Success criteria mapping

- **Counts match across pages** → both pages now read the same source (active bookings via RPC).
- **Past activities hidden in Explore by default** → date filter + collapsed "Past Activities" section.
- **Real-time consistency** → counts are computed from live `bookings` rows on each page load, no stale denormalized field.
- **No conflicting info** → single source of truth.
