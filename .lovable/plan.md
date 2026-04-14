

# Add Reservation Update & Leave Session for Players

## What This Does
Adds two actions for players who have already joined a session:
1. **Update Reservation** — edit special request and phone number on existing booking (overwrites, no new record)
2. **Leave Session** — cancel booking and decrement filled_slots

## Technical Details

### File 1: `src/lib/data.ts` — Add two new methods

```typescript
async updateBooking(bookingId: string, updates: {
  special_request?: string;
  player_phone?: string;
}): Promise<void>
// Updates existing booking record

async cancelBooking(bookingId: string, sessionId: string): Promise<void>
// Sets reservation_status to 'cancelled', decrements filled_slots on the session
```

### File 2: `src/pages/player/EventDetails.tsx` — SupabaseActivityView

**New state** (~line 1081):
- `showUpdateDialog` (boolean) + `updateSessionId` (string)
- `isLeaving` (string | null) for loading state
- `isUpdating` (boolean)

**New handlers**:
- `handleUpdateReservation()` — calls `dataService.updateBooking()` with edited special_request and player_phone, then reloads bookings
- `handleLeaveSession(sessionId)` — confirmation prompt, calls `dataService.cancelBooking()`, reloads bookings, removes from `userBookingIds`

**UI changes** in the session card (lines 1373-1396):
- When `hasBooked && myStatus !== 'rejected'`, replace the static status badge with action buttons:
  - "Update" button → opens update dialog (pre-filled with current special_request and phone)
  - "Leave" button → triggers leave handler with confirmation
- In participant list (line 1455-1464), add "Leave" button next to "I Have Paid" for the user's own row

**Update Dialog**:
- Reuse same modal pattern as join dialog
- Pre-fill special_request and phone from existing booking
- Submit calls `dataService.updateBooking()` (PATCH, not INSERT)

### No database changes needed
- `bookings` UPDATE RLS already allows `auth.uid() = user_id`
- The immutability trigger allows users to update non-protected fields (special_request, player_phone)
- For `cancelBooking`, the trigger now blocks non-organizers from changing `reservation_status` — need to handle via the existing booking owner update path

### Database consideration
The `enforce_booking_payment_immutability` trigger blocks non-organizers from updating `reservation_status`. For "Leave Session", we need to allow users to cancel **their own** booking. This requires a small trigger update:

```sql
-- Allow booking owner to cancel their own reservation
IF NOT _is_organizer THEN
  -- Allow self-cancellation only
  IF NEW.reservation_status = 'cancelled' AND OLD.user_id = auth.uid() THEN
    -- permitted
  ELSE
    NEW.reservation_status := OLD.reservation_status;
  END IF;
  NEW.payment_status := OLD.payment_status;
  NEW.reserved_until := OLD.reserved_until;
END IF;
```

## Files Changed

| File | Change |
|------|--------|
| `src/lib/data.ts` | Add `updateBooking()` and `cancelBooking()` methods |
| `src/pages/player/EventDetails.tsx` | Add Update/Leave buttons, update dialog, handlers |
| New migration SQL | Allow self-cancellation in immutability trigger |

