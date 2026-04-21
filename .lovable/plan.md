

# Fix Email Delivery (Auth + Transactional)

## Diagnosis

| Check | Result |
|---|---|
| Domain `notify.bookee-app.com` verified | ✅ Yes |
| Edge functions deployed (`auth-email-hook`, `send-transactional-email`, `process-email-queue`) | ✅ Yes |
| `email_send_log` rows | ❌ 0 (no email ever enqueued) |
| `auth-email-hook` invocation logs | ❌ 0 (Supabase Auth not calling hook) |
| `process-email-queue` invocation logs | ❌ 0 (cron not firing) |
| `email_send_state` | ✅ exists |

**Conclusion:** Signup works at the Auth layer, but emails are never enqueued or sent because (a) the auth email hook is not activated in **Cloud → Emails**, and (b) the queue dispatcher cron job is missing.

## Fix Steps

### Step 1 — Re-run email infrastructure setup
Call `email_domain--setup_email_infra`. This is idempotent and will:
- Recreate the `process-email-queue` pg_cron job (every 5s)
- Refresh the Vault secret used by the cron job to authenticate
- Verify pgmq queues `auth_emails` and `transactional_emails` exist

### Step 2 — Redeploy the email edge functions
Deploy `auth-email-hook`, `send-transactional-email`, and `process-email-queue` to ensure the latest code is live.

### Step 3 — Activate the auth hook
The `auth-email-hook` exists in code but Supabase Auth must be told to route emails to it. This activation lives in the **Cloud → Emails** panel (which you currently have open). After Step 1+2 finish, the system will reconcile and activate the hook automatically. If it stays inactive, you'll click **Rerun Setup** in Cloud → Emails.

### Step 4 — Verify end-to-end
- Trigger a signup with a real inbox
- Query `email_send_log` — expect `pending` row, then `sent`
- Check `auth-email-hook` logs — expect 200 response
- Check `process-email-queue` logs — expect "processed N messages"
- Test a transactional email by submitting the in-app feedback dialog (calls `send-transactional-email` with the `feedback` template)

### Step 5 — If still failing
Inspect `email_send_log.error_message` for the exact failure (rate limit, suppression, render error). Re-scaffold the auth hook with overwrite if it's still using an outdated direct-send pattern.

## Files / Changes

No code changes expected. All work is infrastructure-level (cron job + hook activation). If Step 5 reveals a hook code issue, `auth-email-hook/index.ts` will be re-scaffolded.

## Success Criteria

- New signup produces a `sent` row in `email_send_log` within 10 seconds
- Recipient receives the verification email at `notify.bookee-app.com` From: address
- Feedback dialog submission produces a `sent` row for `template_name = 'feedback'`

