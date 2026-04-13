

# Add Organizer & Participant Contact Handling with PDPA Compliance

## What This Does

1. **Settings page**: Allow users to edit their phone number and Telegram handle (currently read-only display)
2. **Join dialog**: Add optional phone number field with PDPA consent text
3. **Organizer manage view**: Show participant phone numbers (organizer-only, already RLS-protected)
4. **No new database changes needed** — `profiles.phone`, `profiles.username`, and `bookings.player_phone` columns already exist

## Technical Details

### File 1: `src/pages/SettingsPage.tsx`
- Replace the read-only phone display (lines 120-127) with editable phone and Telegram handle fields
- Add state for `phone` and `telegramHandle`, initialized from `user.phone` and `user.username`
- Add a save handler that updates `profiles` table with both fields
- Add PDPA note: "Your phone number may be shared with activity organizers for session coordination."

### File 2: `src/pages/player/EventDetails.tsx` — Join Dialog (~line 1590)
- Add optional phone number input field after the special request textarea
- Add PDPA consent text: "By providing your contact, you agree it may be used by the organizer for session coordination."
- Pass `player_phone` to `dataService.createBooking()` call (line 1156-1164)

### File 3: `src/pages/organizer/ManageEvent.tsx` — SupabaseManageView participant list
- In the organizer's booking/participant list, display `player_phone` when present (small muted text next to player name)
- This is already organizer-only due to the view being restricted to the activity owner

### Security Verification
- **Player event view** (lines 1427-1464): Participant list shows `player_username` or `player_name` only — phone is NOT exposed. No change needed.
- **RLS on bookings**: SELECT policy restricts to own bookings or organizer of the activity. Phone data is already protected.
- **No new columns or tables needed**

## Files Changed

| File | Change |
|------|--------|
| `src/pages/SettingsPage.tsx` | Add editable phone + Telegram handle fields with PDPA text |
| `src/pages/player/EventDetails.tsx` | Add optional phone input + PDPA consent in join dialog |
| `src/pages/organizer/ManageEvent.tsx` | Show participant phone in organizer booking list |

No database migrations. No new components.

