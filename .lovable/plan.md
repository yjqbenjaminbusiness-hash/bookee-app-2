

# Enhance Session Functionality: Guest Sign-Up, Session Unlock, Contact Organizer

## Diagnosis

**What already exists:**
- Special request field during join -- DONE (join dialog with textarea in EventDetails.tsx)
- Waitlist auto-join when full -- DONE
- Participant status system (Confirmed/Pending/Waitlisted) -- DONE
- Slot adjustment per session -- DONE (ManageEvent.tsx)
- Bulk actions per session -- DONE

**What is missing:**
1. **Guest sign-up**: No "+ Add Guest" option in the join dialog. No guest booking concept tied to a main user.
2. **Session-level unlock**: No locked/unlocked details per session. No `details_released` flag on `activity_sessions`. The `location` field on activities is always visible.
3. **Organizer "Release Details" control**: No toggle per session to release court/location info.
4. **Contact Organizer button**: No button in the player's session view to contact the organizer via Telegram or WhatsApp.

## Schema Change Required

Add one column to `activity_sessions`:

```sql
ALTER TABLE activity_sessions ADD COLUMN IF NOT EXISTS
  released_details text;  -- nullable; when set, contains unlocked info (court number, notes, etc.)
```

This avoids a boolean flag and instead stores the actual details to release. When `NULL`, details are locked; when set, they are shown to confirmed participants only.

No other schema changes needed -- guest bookings will reuse the existing `bookings` table with a naming convention (`player_name = "Guest of [user]"`).

## Implementation Plan

### 1. Guest Sign-Up (EventDetails.tsx join dialog)

In the existing join dialog (`showJoinDialog` modal):
- Add a "+ Add Guest" button below the special request textarea
- When clicked, show a guest name input field
- On submit, create TWO bookings: one for the user, one for the guest
  - Guest booking: `player_name = "Guest of [username]"`, `user_id = same user`, `player_username = null`
  - Guest `reservation_status` = `'pending'` (requires organizer approval)
- Guest counts toward slot limit
- If session is full after user booking, guest goes to waitlist

### 2. Organizer Guest Approval (ManageEvent.tsx)

- In the participant table, guest bookings are identifiable by `player_name` starting with "Guest of"
- Show a "Guest" badge next to these entries
- Existing Confirm/Reject buttons already work for approval
- No additional code needed beyond the badge indicator

### 3. Session-Level Unlock (EventDetails.tsx player view)

- After the migration adds `released_details` to `activity_sessions`, update the `ActivitySession` type in `data.ts`
- In the player's session card, show a locked section:
  - If user is NOT confirmed: show lock icon + "Details available after confirmation"
  - If user IS confirmed AND `released_details` is set: show the details
  - If user IS confirmed AND `released_details` is null: show "Details not yet released"

### 4. Organizer Release Details Control (ManageEvent.tsx)

- Per session card, add an input field + "Release Details" button
- Organizer types court number / location notes, clicks release
- Updates `activity_sessions.released_details` via Supabase
- Shows current released details with option to clear

### 5. Contact Organizer Button (EventDetails.tsx)

- Fetch the organizer's profile (phone, telegram_chat_id) using `activity.organizer_id`
- Below each session or in the activity header, add a "Contact Organizer" button
- Opens a dropdown with available options:
  - WhatsApp: `https://wa.me/[phone]` (if phone exists)
  - Telegram: `https://t.me/[username]` or deep link (if telegram info exists)
- Only show if user has joined at least one session

## Files Modified

| File | Changes |
|------|---------|
| Migration SQL | Add `released_details` column to `activity_sessions` |
| `src/lib/data.ts` | Update `ActivitySession` interface to include `released_details` |
| `src/pages/player/EventDetails.tsx` | Add guest field in join dialog, locked details section per session, contact organizer button |
| `src/pages/organizer/ManageEvent.tsx` | Add guest badge in participant table, release details input per session |

## Risk Assessment
- Guest bookings reuse existing `bookings` table -- no schema risk
- `released_details` column is nullable text, additive only
- Contact button is read-only UI, no data risk
- Lock/unlock is purely display logic based on existing `reservation_status`

