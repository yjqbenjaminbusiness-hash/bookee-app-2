# Email System Live Verification Plan

## Current Status (Already Verified ✅)

| System | Status | Evidence |
|---|---|---|
| Domain `notify.bookee-app.com` | ✅ Verified | DNS active |
| Auth emails (signup) | ✅ Working | 3/3 sent successfully in last week |
| Queue processor | ✅ Running | All `pending` → `sent` within 10s |
| Auth templates (6) | ✅ Installed | signup, magic-link, recovery, invite, email-change, reauthentication |
| Transactional templates (5) | ✅ Registered | welcome, booking-confirmation, organizer-alert, activity-update, feedback |
| Trigger code paths | ✅ Wired | `notify-booking`, `notify-activity-update`, `FeedbackDialog` |

## ⚠️ Gap Identified

`email_send_log` contains **zero transactional emails** — only signup auth emails. We cannot confirm app emails actually deliver until one is triggered live.

## Proposed Test Plan

I'll need to switch out of read-only mode to execute these. Please provide a real email address you can check (or I'll use one you specify).

### Test 1: Auth — Password Recovery
Trigger `supabase.auth.resetPasswordForEmail()` against your test email and verify:
- Row appears in `email_send_log` with `template_name='recovery'`
- Status reaches `sent` within 30s
- Email arrives in your inbox with branded template

### Test 2: Transactional — Booking Confirmation
Invoke `notify-booking` edge function with a real booking ID and verify:
- Two log rows: `booking-confirmation` (to participant) + `organizer-alert` (to organizer)
- Both reach `sent` status
- Both emails arrive

### Test 3: Transactional — Activity Announcement
Invoke `notify-activity-update` with an existing announcement ID and verify:
- One log row per confirmed participant with `template_name='activity-update'`
- All reach `sent` status

### Test 4: Transactional — Feedback
Submit feedback via the FeedbackDialog UI and verify:
- Log row with `template_name='feedback'` reaches `sent`
- Email arrives at support address (`yjqbenjaminbusiness@gmail.com`)

### Test 5: Edge Function Health Check
- Pull recent logs from `send-transactional-email`, `notify-booking`, `notify-activity-update`, `process-email-queue`
- Confirm no silent errors, auth failures, or rate-limits

## Deliverable

A summary table showing each email type, its log status, delivery time, and inbox confirmation — plus any fixes if a test fails (e.g., redeploy a function, fix a template, adjust queue config).

## What I'll NOT Do

- Won't modify any templates unless a test reveals a bug
- Won't change queue config unless throughput issues appear
- Won't touch the verified domain or DNS settings
