

# Fix Plan: Participant Status Badge, Contact Buttons, Special Request Visibility

## Diagnosis

### 1. Participant Status Bug — Participant List Badge (Line 1329-1333)
**Root cause found**: In the **participant list** (not `getMyStatus` — that's already fixed), the badge rendering at line 1333 does NOT check for `reservation_status === 'rejected'`. The logic is:
```
confirmed → "✓ Going"
payment_status === 'pending' → "⏳ Payment Sent"
payment_status === 'paid' → "✓ Paid"
else → "○ Pending"
```
A rejected participant whose booking somehow remains in `activeBookings` (or is rendered elsewhere) will show "Payment Sent" or "Pending" instead of "Rejected".

Additionally, `activeBookings` at line 1236 already filters out `rejected` bookings, so rejected users should NOT appear in the participant list at all. However, the `hasBooked` check at line 1239 uses `userBookingIds` which already correctly excludes rejected (line 1015). The user's own status badge via `getMyStatus()` at line 1121-1129 already handles rejected correctly.

**The remaining bug**: The participant list badge (line 1333) lacks a `rejected` guard. While `activeBookings` filters them out, defense-in-depth is needed. Also, the **user's own status display** at line 1256 shows `hasBooked && myStatus` — if a user is rejected, `hasBooked` is false (excluded at line 1015), so the rejected badge won't show. The user simply sees the "Sign Up" button again, which is correct behavior.

**Actual issue**: The user reports seeing "pending payment" for a rejected participant. This could happen if the booking data hasn't refreshed after rejection. The real fix is ensuring the participant badge always checks `reservation_status` before `payment_status`.

### 2. Special Request — Already Present
The join dialog (line 1456-1463) has the special request textarea. The organizer sees it at line 1112-1116 with the 📝 icon. **Working correctly.**

### 3. Contact Buttons — Already Present
WhatsApp (line 1201-1208) and Telegram (line 1210-1219) buttons exist and are clickable. **Working correctly.**

### 4. Organizer View — Already Correct
ManageEvent line 1118-1121 shows rejected status with destructive badge. **Working correctly.**

## Remaining Fix

The only actual bug is the **participant list badge** in EventDetails.tsx at line 1333. It needs to check `reservation_status` before `payment_status` to prevent a rejected booking from ever showing "Payment Sent".

### Fix in `src/pages/player/EventDetails.tsx`

**Line 1333** — Update the badge text logic to add rejected check:
```
{b.reservation_status === 'rejected' ? '✕ Rejected' :
 b.reservation_status === 'confirmed' ? '✓ Going' :
 b.payment_status === 'pending' ? '⏳ Payment Sent' :
 b.payment_status === 'paid' ? '✓ Paid' : '○ Pending'}
```

And update the badge styling at lines 1329-1331 to handle rejected:
```
color: b.reservation_status === 'rejected' ? 'hsl(var(--destructive))' :
       b.reservation_status === 'confirmed' ? 'hsl(var(--primary))' :
       b.payment_status === 'pending' ? '#C47A00' : undefined,
borderColor: b.reservation_status === 'rejected' ? 'hsl(var(--destructive))' :
             b.reservation_status === 'confirmed' ? 'hsl(var(--primary))' :
             b.payment_status === 'pending' ? '#C47A00' : undefined,
```

Also hide the "I Have Paid" button for rejected bookings (line 1335):
```
{isMe && b.payment_status === 'unpaid' && b.reservation_status !== 'rejected' && (
```

## Files Modified

| File | Change |
|------|--------|
| `src/pages/player/EventDetails.tsx` | Fix participant list badge to check `reservation_status` before `payment_status`; hide "I Have Paid" for rejected |

No database changes needed. No other files affected.

