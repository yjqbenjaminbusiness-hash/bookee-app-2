

# Fix: Participant Confirmation Action Not Updating

## Root Cause

The database trigger `enforce_booking_payment_immutability()` silently blocks ALL updates to `reservation_status`, `payment_status`, `stripe_payment_id`, and `reserved_until` for non-service_role users. This includes organizers.

```sql
-- Current trigger (problematic):
IF current_setting('role') != 'service_role' THEN
    NEW.payment_status := OLD.payment_status;
    NEW.stripe_payment_id := OLD.stripe_payment_id;
    NEW.reservation_status := OLD.reservation_status;  -- blocks confirm!
    NEW.reserved_until := OLD.reserved_until;
END IF;
```

The organizer clicks "Confirm" → Supabase update runs → trigger reverts the value → no error returned → toast shows "confirmed" → but nothing actually changed.

## Fix

Modify the trigger to allow organizers (the activity owner) to update these fields, while still blocking regular users from self-escalating. The trigger will check if the current user owns the activity linked to the booking's session.

**Only `stripe_payment_id` remains immutable for non-service_role users** (financial reference should never be changed by any client). `payment_status` and `reservation_status` become updatable by organizers.

### Database Migration

```sql
CREATE OR REPLACE FUNCTION public.enforce_booking_payment_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _is_organizer boolean;
BEGIN
  IF current_setting('role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Check if the current user is the organizer of this booking's activity
  SELECT EXISTS (
    SELECT 1 FROM activity_sessions s
    JOIN activities a ON a.id = s.activity_id
    WHERE s.id = NEW.session_id AND a.organizer_id = auth.uid()
  ) INTO _is_organizer;

  -- Organizers can update reservation_status and payment_status
  IF NOT _is_organizer THEN
    NEW.payment_status := OLD.payment_status;
    NEW.reservation_status := OLD.reservation_status;
    NEW.reserved_until := OLD.reserved_until;
  END IF;

  -- stripe_payment_id is always immutable for non-service_role
  NEW.stripe_payment_id := OLD.stripe_payment_id;

  RETURN NEW;
END;
$$;
```

## Files Changed

| File | Change |
|------|--------|
| New migration SQL | Update `enforce_booking_payment_immutability` trigger function |

No UI code changes needed. The existing handlers (`handleConfirmBooking`, `handleBulkConfirm`, `handleMarkPaid`, etc.) are already correct — they just need the trigger to stop blocking them.

## Verification

1. Organizer confirms a player → `reservation_status` updates to `confirmed` in DB
2. Organizer marks paid → `payment_status` updates to `paid` in DB
3. Regular user cannot self-confirm or self-mark-paid (trigger still blocks)
4. `stripe_payment_id` remains immutable for all non-service_role users

