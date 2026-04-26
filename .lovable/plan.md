# Fix Welcome Email Trigger & Backfill Missed Signups

## Test Results Summary

I ran an end-to-end audit of the email pipeline. Most flows work correctly, but the **server-side welcome email trigger for OAuth (Google/Apple) signups is broken**.

### ✅ Confirmed Working (via `email_send_log`)
- Email/password signup → verification email (`signup` template)
- Welcome email after password verification 
- Booking confirmation → participant
- Organizer alert → organizer
- Activity update / announcement → participants
- Booking cancellation & update notifications
- Recovery / feedback emails

### ❌ Confirmed Broken
**Google/Apple OAuth signups receive NO welcome email.**

Evidence from `net._http_response` (the trigger's HTTP call log):
- Most calls **time out at 5000 ms** (the configured `timeout_milliseconds`)
- Calls that complete return **HTTP 403** — the Vault service-role key is being rejected by `send-transactional-email`

Evidence from `profiles` table:
- Every existing user — including a Google signup at 14:39 today — has `welcome_email_sent_at = NULL`
- The trigger fires but stamps `welcome_email_sent_at` BEFORE the HTTP call, so failures are invisible at the row level (we only see them in `net._http_response`)

---

## Root Cause

The trigger function `send_welcome_email_on_profile()` has two defects:

1. **5-second timeout is too short** for cold-starting edge functions (most calls die before reaching the function)
2. **Vault secret `welcome_trigger_service_role_key` is stale or malformed** — the few requests that complete get 403 from `send-transactional-email`

Additionally, the trigger stamps `welcome_email_sent_at = now()` **before** firing the HTTP call, so a failed call still marks the user as "sent" — silently swallowing the error.

---

## Proposed Fix

### 1. Migration: Repair the trigger function

- **Move the `welcome_email_sent_at` stamp to AFTER a successful enqueue** (use `net.http_post` return ID to verify dispatch was queued, not the response — pg_net is async). Actually keep the stamp but only set it once we've successfully called `net.http_post` (which queues the request); don't pre-stamp.
- **Increase `timeout_milliseconds` to 30000** (30s) to accommodate cold starts.
- **Refresh the Vault secret** `welcome_trigger_service_role_key` with the current `SUPABASE_SERVICE_ROLE_KEY` (the 403 indicates the stored value is wrong/stale).
- Add an `EXCEPTION` block that logs failures via `RAISE WARNING` so we can see them in Postgres logs.

### 2. Backfill existing users who never got a welcome email

Write a one-time SQL block that loops over `profiles WHERE welcome_email_sent_at IS NULL AND email IS NOT NULL` and invokes `send-transactional-email` for each. Targets 6 affected users (per current data).

The backfill will use the same `idempotencyKey` pattern (`welcome-${user_id}`) so `send-transactional-email`'s idempotency layer prevents duplicates if any did sneak through.

### 3. Verification (after migration runs)

- Query `net._http_response` for fresh entries with `status_code = 200`
- Query `email_send_log` for new `welcome` rows matching the backfilled emails
- Confirm `profiles.welcome_email_sent_at` is now populated for all backfilled users

---

## Files Changed

- **New migration** (`supabase/migrations/<ts>_fix_welcome_trigger.sql`):
  - `CREATE OR REPLACE FUNCTION public.send_welcome_email_on_profile()` with 30s timeout, post-stamp logic, and warning logs
  - Refresh Vault secret `welcome_trigger_service_role_key`
  - One-time backfill loop for existing `welcome_email_sent_at IS NULL` profiles

No edge function code changes — `send-transactional-email`, `notify-booking`, `notify-activity-update`, and `notify-signup` are all working correctly per the logs.

---

## What Will NOT Change

- All currently-working flows (booking, announcement, password verification) stay untouched
- No client-side code changes needed — the server-side trigger handles all signup paths
- Email templates unchanged
