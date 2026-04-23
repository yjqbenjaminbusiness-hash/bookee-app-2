
# Email Status Check + Fix Plan

## What’s happening now

### Auth emails
Auth emails are not currently working the way you expect because the app is configured for auto-confirm signup, not verification-email signup.

Evidence from the project:
- The sender domain `notify.bookee-app.com` is verified.
- The email queue cron job exists and is active.
- `auth-email-hook`, `send-transactional-email`, and `process-email-queue` have no recent invocation logs.
- Recent signup records in the backend show users being created with `email_confirmed_at` already set and `confirmation_sent_at` empty.
- Project memory explicitly says mandatory email verification is disabled for a low-friction flow.
- The signup pages currently show “Account created! Welcome to Bookee.” and immediately navigate into the app.

Result: signup is succeeding, but no verification email is supposed to be sent in the current setup.

### App emails
The app email system is not fully wired for the scenarios you mentioned.

What exists now:
- There is one existing app email trigger: the `FeedbackDialog` calls the shared email sender.
- The email templates registry contains `feedback`, `booking-confirmation`, and `welcome`.

What is missing:
- No frontend/backend trigger currently sends `booking-confirmation`.
- No code path currently sends activity update emails when organizers post announcements/updates.
- No code path currently sends organizer alert emails for new bookings or related activity.
- The current organizer “announcements” flow in `ManageEvent.tsx` is still local/demo-style and not connected to a real participant email pipeline.

Result: feedback email may work once triggered, but booking confirmations, activity updates, and organizer alerts are not implemented end-to-end yet.

## Approved direction based on your choices
You chose:
- Require verification email on signup
- Make these app emails work first:
  - Booking confirmations
  - Activity updates
  - Organizer alerts

## Implementation plan

### 1. Restore real verification-email signup
Update authentication so new email/password signups require email confirmation instead of instant access.

Work:
- Change the backend auth setting from auto-confirm to email verification required.
- Verify the auth email hook is active and receiving auth events.
- Keep the existing branded auth email templates and queue flow in place.

Code/UI updates:
- Update player and organizer signup flows so they no longer route users straight into the dashboard after signup.
- Replace the current success message with a “Check your email to verify your account” flow.
- Make post-signup UX consistent for both player and organizer signups.
- Review magic-link and OAuth behavior so they still work correctly alongside required verification.

Expected outcome:
- New email/password signups create unconfirmed users.
- Verification emails are generated and logged.
- Users only continue after verifying.

### 2. Verify and harden the auth email pipeline
After switching signup mode, validate the full auth email path.

Work:
- Confirm auth events reach the email hook.
- Confirm messages are written to the email log as `pending` then `sent`.
- Check for any hook activation/config gap if logs still remain empty after a fresh signup.
- If needed, refresh the auth email setup so the managed hook is fully active again.

Expected outcome:
- Signup produces a real verification email.
- Password reset and magic link emails can use the same pipeline.

### 3. Wire booking confirmation app emails
Implement a real booking-confirmation trigger where a participant expects an email immediately after booking.

Work:
- Find the authoritative booking creation path(s) in the live booking flow.
- Invoke the existing app email sender after a successful booking insert/update.
- Pass real booking/session/activity details into the `booking-confirmation` template.
- Use an idempotency key derived from the booking record so retries never duplicate sends.

Expected outcome:
- Every successful booking can enqueue one confirmation email to the participant.
- Email status is visible in the send log.

### 4. Implement activity update emails to participants
Connect organizer activity/session updates to participant notifications.

Work:
- Replace the current local/demo announcement behavior with a backend-backed flow where needed.
- Identify the participant list for the affected session/activity.
- Send one app email per participant when an organizer posts a relevant update.
- Keep the content clearly transactional: session change/update notification, not marketing.
- Add filtering so cancelled/rejected participants are excluded.

Important note:
- This requires real backend-backed announcement/update data for the live activity flow, not just local mock state.

Expected outcome:
- Participants receive update emails when organizers publish important session/activity changes.

### 5. Implement organizer alert emails
Send app emails to organizers for key operational events.

First alerts to support:
- New booking received
- Important booking status change if applicable

Work:
- Add email triggers on the relevant booking lifecycle events.
- Route organizer notifications to the activity owner/organizer email.
- Create or extend template coverage if an existing template is not appropriate.
- Use event-based idempotency keys to prevent duplicates.

Expected outcome:
- Organizers receive timely operational emails for real activity changes.

### 6. Add delivery visibility and test checkpoints
Make the system easy to verify during rollout.

Work:
- Validate each new email path against the send log.
- Check inbox delivery and spam-folder behavior for test messages.
- Confirm that failures, suppressions, or DLQ cases are visible for debugging.
- Optionally add a lightweight admin-facing delivery view later if you want ongoing monitoring.

## Files likely to change

### Auth flow
- `src/hooks/useAuth.tsx`
- `src/pages/SignupPlayerPage.tsx`
- `src/pages/SignupOrganizerPage.tsx`
- Possibly auth configuration / managed email activation

### App email triggers
- Booking flow files in `src/pages/player/*` and/or shared data hooks where the real booking write happens
- `src/pages/organizer/ManageEvent.tsx` for organizer update triggers
- Possibly additional organizer/player pages where real activity updates are created

### Email templates / functions
- `supabase/functions/send-transactional-email/index.ts` only if template wiring needs extension
- `supabase/functions/_shared/transactional-email-templates/*.tsx`
- `supabase/functions/_shared/transactional-email-templates/registry.ts`
- Possibly auth email setup if the hook needs reactivation/re-scaffolding

## Technical notes
- No evidence suggests the verified sender domain is the current blocker.
- The main auth blocker is product configuration: signup is set to auto-confirm, so no verification email is emitted.
- The main app-email blocker is missing trigger wiring for the flows you want.
- Only the feedback email path currently invokes the app email sender from the UI.
- Booking confirmations, activity updates, and organizer alerts need explicit trigger implementation.

## Success criteria
- A fresh email/password signup sends a verification email and does not auto-enter the app.
- The send log records auth email activity.
- A successful booking sends one booking confirmation email to the participant.
- Posting an activity/session update sends emails to the relevant participants.
- A new booking sends an alert email to the organizer.
- Each flow appears in the email send log with final status visible.
