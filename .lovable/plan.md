# End-to-End Email Delivery Test

## What's actually working today

I queried the email send log directly — **0 emails sent in the last 7 days** (auth or app). That means:

| Flow | Status |
|---|---|
| Signup verification email | Hook deployed, but never invoked (no recent signups completed) |
| Booking confirmation | ❌ No trigger exists in code |
| Activity/announcement update | ❌ No trigger exists in code |
| Organizer alert (new booking) | ❌ No trigger exists in code |
| Feedback email | ✅ Trigger exists in `FeedbackDialog.tsx` |

Only the `feedback` template is wired into the UI. `booking-confirmation` and `welcome` templates exist in the registry but nothing calls them. There are no `activity-update` or `organizer-alert` templates at all.

So before we can run an end-to-end test, the missing pieces need to be built. Then we run a real, automated test that exercises every path and verifies delivery in the send log.

---

## Plan

### Step 1 — Add the missing templates and triggers

**Templates to create** in `supabase/functions/_shared/transactional-email-templates/`:
- `activity-update.tsx` — sent to participants when an organizer posts an announcement on a session
- `organizer-alert.tsx` — sent to the organizer when a new booking is created on their session

Both registered in `registry.ts`. `booking-confirmation` already exists.

**Triggers to wire into `src/lib/data.ts`** (or the booking/announcement helpers):

| Event | Template | Recipient | Idempotency key |
|---|---|---|---|
| `bookings` insert (status=confirmed) | `booking-confirmation` | participant | `booking-confirm-<booking_id>` |
| `bookings` insert (status=confirmed) | `organizer-alert` | session organizer | `organizer-alert-<booking_id>` |
| `announcements` insert on a session | `activity-update` | each confirmed participant | `activity-update-<announcement_id>-<user_id>` |

Recipients are resolved server-side via an Edge Function (`fan-out-activity-update`) because RLS prevents the client from reading other users' emails from `profiles`. The fan-out function uses the service role and calls `send-transactional-email` once per recipient.

### Step 2 — Build the end-to-end test

A single Deno test file at `supabase/functions/send-transactional-email/e2e_test.ts` that runs the full flow against the live backend:

```
1. Sign up a fresh disposable email via supabase.auth.signUp()
   → assert auth.users row created
   → poll email_send_log for template_name='auth_emails', status='sent', recipient=<test email> within 30s

2. Confirm the test user (via service-role admin API) so we can act as them
   Create a test session/activity owned by a separate test organizer

3. Insert a booking for the test user on that session
   → poll email_send_log for booking-confirm-<id>, status='sent'
   → poll email_send_log for organizer-alert-<id>, status='sent'

4. Insert an announcement on that session
   → poll email_send_log for activity-update-<announcement_id>-<user_id>, status='sent'

5. Cleanup: delete announcement, booking, session, both test users
```

Each poll uses `DISTINCT ON (message_id)` ordered by `created_at DESC` so a `pending` row doesn't false-positive as a missing send.

### Step 3 — Run the test

Execute via the edge function test runner. The test reports per-step pass/fail with the specific log row that confirmed (or the timeout that failed) each email.

### Step 4 — Manual receipt confirmation

The send log only proves the email was handed to the provider. To confirm actual inbox delivery, after the automated test passes I'll provide you a one-liner: sign up with your real email at `/signup-player`, then I query the log to show the `sent` row for your address. You then check your inbox.

---

## Success criteria

- All 4 emails appear in `email_send_log` with `status = 'sent'` within 30 seconds of their trigger
- The Deno test file passes end-to-end with no skipped assertions
- A manual signup with your real email produces both a log entry AND a verification email in your inbox

## Files that will change

| File | Change |
|---|---|
| `supabase/functions/_shared/transactional-email-templates/activity-update.tsx` | new |
| `supabase/functions/_shared/transactional-email-templates/organizer-alert.tsx` | new |
| `supabase/functions/_shared/transactional-email-templates/registry.ts` | register 2 new templates |
| `supabase/functions/fan-out-activity-update/index.ts` | new — service-role fan-out for announcements |
| `src/lib/data.ts` (or booking/announcement helpers) | invoke `send-transactional-email` after booking insert and `fan-out-activity-update` after announcement insert |
| `supabase/functions/send-transactional-email/e2e_test.ts` | new — the end-to-end test |

After Step 1 lands, all subsequent emails (real user activity, not just the test) will start flowing too.
