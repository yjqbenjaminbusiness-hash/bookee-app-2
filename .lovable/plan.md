
## Goal

Guarantee an email is sent for **every signup** (email/password, Google, Apple) and for **every meaningful account/activity update** (join session, update reservation, leave session). Today, OAuth signups bypass verification entirely, and only the initial booking sends an email.

---

## Part 1 — Signup Emails (Universal)

### A. Email/password signups → mandatory verification email
- Re-enable Supabase "Confirm email" so the existing `auth-email-hook` `signup` template is triggered by every email/password signup.
- Update `src/hooks/useAuth.tsx` (`signupPlayerSupabase` / `signupOrganizerSupabase`):
  - Keep `emailRedirectTo: ${window.location.origin}/`.
  - After signup, do **not** assume the user is logged in — show a "Check your email to confirm" toast and route to `/login`.
- Update `src/pages/SignupPlayerPage.tsx` and `src/pages/SignupOrganizerPage.tsx` accordingly (no auto-redirect to dashboard until session exists).
- Update memory `mem://auth/onboarding-flow` to reflect that mandatory email verification is now ON for password signups.

### B. Google/Apple signups → branded "welcome" email (auto-confirmed accounts)
OAuth users are auto-confirmed by the provider, so Supabase does NOT fire a `signup` auth email. We need to detect first-time OAuth signups and send our own `welcome` transactional email.

Implementation:
1. **New edge function `notify-signup`** (`verify_jwt = true`):
   - Authenticated call from the client right after `onAuthStateChange` fires `SIGNED_IN`.
   - Reads `auth.users.created_at` vs `last_sign_in_at` to detect first sign-in (or checks a new `profiles.welcome_email_sent_at` column to ensure idempotency).
   - If first-time AND welcome not yet sent → invoke `send-transactional-email` with `templateName: 'welcome'`, `idempotencyKey: welcome-${user.id}`.
   - Stamp `profiles.welcome_email_sent_at = now()` so it never fires twice.
2. **DB migration**: add `welcome_email_sent_at timestamptz` to `profiles`.
3. **Client wiring** in `src/hooks/useAuth.tsx`: inside the `onAuthStateChange` handler, after profile load, if `welcome_email_sent_at` is null → `supabase.functions.invoke('notify-signup')`. This covers Google, Apple, AND email/password (after they confirm and first sign in).
4. **Welcome template tweak** (`supabase/functions/_shared/transactional-email-templates/welcome.tsx`): personalize with `displayName`, set subject "Welcome to Bookee 🎉", include CTA to `/player/events` or `/organize` depending on role.

This guarantees: every new account — regardless of provider — receives at least one branded email from us.

---

## Part 2 — Activity / Account Update Emails

### Already wired (verified)
- `createBooking` → `notify-booking` → sends `booking-confirmation` (participant) + `organizer-alert` (organizer). ✅
- Announcements → `notify-activity-update` → emails all confirmed participants. ✅

### Gaps to close
1. **Reservation update** (player edits phone / special request via `dataService.updateBooking`):
   - Add a `notify-booking-updated` invocation (reuse `notify-booking` with a new `event: 'updated'` flag, or new function).
   - Send `activity-update` template to participant: "Your booking for [Activity] was updated".
   - Optionally notify organizer.

2. **Leave session / cancel booking** (`dataService.cancelBooking`):
   - Invoke a new `notify-booking-cancelled` flow that emails:
     - Participant: confirmation that they left.
     - Organizer: alert that a slot opened up (reuse `organizer-alert` template with a `cancelled: true` variant, or add a small `booking-cancelled.tsx` template).

3. **Organizer-side actions** (already protected by RLS): when an organizer confirms/rejects a booking (`updateBookingPaymentStatus` or status change), send the participant a `booking-confirmation` (status: confirmed) or `activity-update` (status: rejected) email.

4. **New template files** to add under `supabase/functions/_shared/transactional-email-templates/`:
   - `booking-cancelled.tsx` (participant + organizer variants via a `role` prop).
   - Register in `registry.ts`.

---

## Part 3 — Verification & Testing

After implementation, run live verification:
1. Sign up via email/password → expect `signup` row in `email_send_log` (status `sent`).
2. Sign up via Google → expect `welcome` row in `email_send_log`.
3. Join an activity → expect `booking-confirmation` + `organizer-alert`.
4. Update the booking → expect `activity-update` (or new "booking-updated") row.
5. Leave the activity → expect `booking-cancelled` rows for both participant and organizer.
6. Post an announcement → expect `activity-update` rows for all participants.

Pull `email_send_log` for each test and report a clean table.

---

## Files to be created / changed

**New**
- `supabase/functions/notify-signup/index.ts` (welcome trigger for OAuth + first sign-in)
- `supabase/functions/notify-booking-updated/index.ts` (or extend `notify-booking`)
- `supabase/functions/notify-booking-cancelled/index.ts`
- `supabase/functions/_shared/transactional-email-templates/booking-cancelled.tsx`
- DB migration: `profiles.welcome_email_sent_at`

**Modified**
- `src/hooks/useAuth.tsx` — invoke `notify-signup` on first sign-in; switch password signup flow to "check your email"
- `src/pages/SignupPlayerPage.tsx`, `src/pages/SignupOrganizerPage.tsx` — reflect verification flow
- `src/lib/data.ts` — invoke update/cancel notification functions in `updateBooking` and `cancelBooking`
- `supabase/functions/_shared/transactional-email-templates/welcome.tsx` — personalize
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — register new template
- `supabase/config.toml` — add `verify_jwt = true` for `notify-signup` and the new notification functions
- Re-enable "Confirm email" in Auth settings (via `cloud--configure_auth`)
- `mem://auth/onboarding-flow` — update to reflect mandatory verification for email/password signups

---

## Success criteria
- Every new account (email/password, Google, Apple) receives at least one branded email (verification OR welcome).
- Every booking lifecycle event (join, update, leave) results in an email to the participant AND an alert to the organizer.
- `email_send_log` shows zero gaps across all test scenarios.
