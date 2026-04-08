

# Fix Telegram Domain + Email Inbox Question

## Findings

### 1. Telegram Bot — Stale Domain (Bug)
`supabase/functions/telegram-poll/index.ts` line 6 still has:
```
const SITE_URL = "https://bookee-app.lovable.app";
```
This is used in ~10+ places throughout the bot (login links, activity links, "View more on web", help text). It was supposed to be updated to the production domain but wasn't deployed or the change was lost.

**Fix**: Change `SITE_URL` to `https://bookee-app.com` and redeploy the edge function.

### 2. Email Inbox — Not Possible with Lovable Email
The `notify.bookee-app.com` subdomain is configured for **sending** emails only. Lovable's email infrastructure does not provide an inbox or mailbox. You cannot receive emails at `support@bookee-app.com` through Lovable.

To receive emails at your custom domain (e.g., `support@bookee-app.com`), you'd need a separate email hosting provider like Google Workspace, Zoho Mail, or similar — configured with MX records on your root domain. This doesn't conflict with Lovable's email sending (which uses the `notify.` subdomain).

Your current feedback system works correctly: the feedback form sends an email **to** your Gmail address via the transactional email system. Gmail continues to be the inbox where you receive those messages.

### 3. No Code Errors Found
- Registry correctly imports the feedback template
- FeedbackDialog correctly invokes `send-transactional-email`
- All email edge functions are properly configured in `config.toml`
- No `lovable.app` references exist in the frontend code

## Plan

### File: `supabase/functions/telegram-poll/index.ts`
- **Line 6**: Change `SITE_URL` from `"https://bookee-app.lovable.app"` to `"https://bookee-app.com"`
- Redeploy the `telegram-poll` edge function

### No other changes needed
- Frontend code has no stale domain references
- Email infrastructure is correctly configured

## Summary
One fix (Telegram domain), one clarification (no inbox capability with Lovable — keep Gmail or set up a separate email hosting service for receiving mail).

