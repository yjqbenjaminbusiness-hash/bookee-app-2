
# Instant "Joined" Status & UI Cleanup

## Goal
Make joining feel instant (WhatsApp-style) and remove broken/misleading buttons. No DB schema changes, no flow changes, no email rework.

## Approach (UI-layer only)

We will **not** modify the `enforce_booking_defaults` DB trigger or the `reservation_status` enum. The trigger still forces new bookings into `pending` (this protects payment integrity). Instead, we relabel `pending` to **"Joined"** wherever a participant sees it, so users feel immediately included while organizers retain `pending → confirmed/rejected` controls underneath.

### Status display mapping

| DB status     | Player sees   | Organizer sees           |
|---------------|---------------|--------------------------|
| `pending`     | ✓ Joined (green) | ✓ Joined (neutral)    |
| `confirmed`   | ✓ Confirmed   | ✓ Confirmed              |
| `waitlisted`  | Waitlist      | Waitlist                 |
| `rejected`    | (hidden)      | Removed                  |
| `cancelled`   | (hidden)      | Cancelled                |

## Changes

### 1. Player-facing status relabel
- **`src/pages/player/EventDetails.tsx`** — In `getBookingDisplayStatus` / status badge logic and the `SupabaseActivityView` participant rendering, render `pending` as "✓ Joined" with green styling (instead of "⏳ Pending" / yellow).
- **`src/pages/player/Dashboard.tsx`** — In the "My Bookee" activity cards (the badge + icon block), treat `pending` the same as `confirmed` for display: green pill labeled "JOINED", check icon. Stats card "Pending" → "Joined".
- **`src/pages/player/Bookings.tsx`** — Status badge for `pending` becomes "JOINED" with the green (`bg-jade-green`) style; keep "Pay Now" CTA logic untouched (payment still required for paid sessions).

### 2. Organizer-facing relabel (lightweight)
- **`src/pages/organizer/ManageEvent.tsx`** — Replace "⏳ Pending" badge with neutral "✓ Joined" badge in the participant row. Keep all existing per-row actions intact: **Confirm**, **Move to Waitlist**, **Remove** (reject). No new approval workflow.

### 3. Remove non-functional buttons
In **`src/pages/organizer/ManageEvent.tsx`** (Supabase view, around the action button row):
- Remove **"Post to Telegram"** button + the `TelegramPostDialog` component and related state (`showTelegramPostDialog`, `telegramSessionId`, etc.)
- Remove **"Post Game"** button and its handler invocation of `post-game-telegram`.
- Remove **"Find Participants"** button if present and not wired to a working flow.
- Keep the **"Copy Link"** / share functionality fully intact.

### 4. Things explicitly NOT changed
- ❌ No DB migration. `reservation_status` enum stays. `enforce_booking_defaults` trigger stays.
- ❌ No changes to the email/notification system (deferred).
- ❌ No changes to payment gating (paid sessions still need payment to confirm).
- ❌ No changes to organizer "Confirm/Reject/Waitlist" controls — they remain available for cases where the organizer needs to step in.
- ❌ "Copy Link" sharing is preserved as-is.

## Success criteria
- A user joining a session immediately sees "✓ Joined" (green) — no "Pending" anywhere player-facing.
- Organizer sees the same participant as "Joined" with Confirm / Waitlist / Remove actions still available.
- "Post to Telegram" / "Post Game" / "Find Participants" buttons are gone; no dead dialogs remain.
- "Copy Link" still works.
- No regressions to payment flow or email triggers.

## Files touched
- `src/pages/player/EventDetails.tsx`
- `src/pages/player/Dashboard.tsx`
- `src/pages/player/Bookings.tsx`
- `src/pages/organizer/ManageEvent.tsx`
