

# Verify Email Delivery End-to-End

## What I Found

| Component | Status |
|---|---|
| Email infrastructure (cron, queues, tables, domain) | ✅ Healthy |
| `auth-email-hook` invocations | ❌ Never called by Supabase Auth |
| `send-transactional-email` invocations | ❌ Never called by frontend |
| New signups in last 24h | ❌ 0 (signup is failing client-side) |

## Root Causes

1. **Auth hook not activated** — The custom hook exists but Supabase Auth isn't routing to it. Activation lives in Cloud → Emails.
2. **Signup never reached the backend** — `auth.users` shows 0 new rows in 24h, so the signup attempt failed before email could be triggered.

## Fix Steps

### Step 1 — Activate the auth hook
Open **Cloud → Emails** and confirm the auth hook shows as **Active**. If it shows **Inactive** or **Setup pending**, click **Rerun Setup**. This is a one-click activation in the Cloud UI — no code changes.

### Step 2 — Diagnose the signup failure
Inspect the signup flow to find why no user was created:
- Read `src/pages/SignupPlayerPage.tsx` and `src/hooks/useAuth.tsx` (`signupPlayerSupabase`) to confirm the call shape
- Check browser console + network logs from a fresh signup attempt for the actual error (rate limit, validation, RLS on profiles, missing redirect URL, etc.)
- Verify `emailRedirectTo` is set to a valid URL in `supabase.auth.signUp(...)` — missing or wrong redirect URL is the most common reason auth signup silently fails in Lovable projects

### Step 3 — Add a test verification email
Once the hook is active, send a one-time test from Cloud → Emails ("Send test email") to the user's inbox to confirm the full pipeline (hook → enqueue → cron → send) without needing a real signup.

### Step 4 — Verify transactional path
Open the in-app feedback dialog and submit a test message. Then query `email_send_log` for `template_name = 'feedback'` — expect a `pending` row followed by `sent` within ~10 seconds.

### Step 5 — If signup still fails after Step 2
Likely culprit is a missing/invalid `emailRedirectTo` in the signup call. Patch `signupPlayerSupabase` and `signupOrganizerSupabase` in `src/hooks/useAuth.tsx` to pass `{ emailRedirectTo: \`${window.location.origin}/\` }`.

## Success Criteria

- Cloud → Emails shows auth hook **Active**
- A new signup creates a row in `auth.users` AND a `sent` row in `email_send_log` within 10s
- The recipient receives the verification email from `notify.bookee-app.com`
- A feedback submission produces a `sent` row for `template_name = 'feedback'`

## Files Potentially Changed

| File | Change |
|---|---|
| `src/hooks/useAuth.tsx` | Add `emailRedirectTo` to `signUp()` calls (only if Step 2 confirms it's missing) |

No other code changes expected — the rest is Cloud UI activation + verification.

