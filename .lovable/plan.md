

# Fix Auth, Price Bug, Share, and Help Page

## 1. Signup Pages — Add Google/Apple OAuth

**Files**: `src/pages/SignupPlayerPage.tsx`, `src/pages/SignupOrganizerPage.tsx`

Both signup pages only show email/password. Add Google and Apple OAuth buttons (same UI as LoginPage) above the email form, with an "Or continue with email" divider. Import `signInWithGoogle` and `signInWithApple` from `useAuth`. Use real Supabase signup (`signupPlayerSupabase` / `signupOrganizerSupabase`) instead of mock `signupPlayer` / `signupOrganizer`.

## 2. Price Bug — Fix Telegram Bot Division

**File**: `supabase/functions/telegram-poll/index.ts`

Lines 733 and 1514 incorrectly divide price by 100:
- Line 733: `$${(s.price / 100).toFixed(2)}` → `$${Number(s.price).toFixed(2)}`
- Line 1514: `$${(s.price / 100).toFixed(2)}` → `$${Number(s.price).toFixed(2)}`

Line 501 is already correct. Price is stored as dollars in DB, no division needed.

## 3. Organizer Share Button

**File**: `src/pages/organizer/OrganizeLanding.tsx`

Add a share icon button to each activity/ballot row that copies `https://bookee-app.com/player/events/{activityId}` to clipboard and shows a toast. Also add WhatsApp/Telegram share options via `window.open`.

## 4. Help Page Cleanup

**File**: `src/pages/HelpPage.tsx`

Remove the "Direct Contact" and "Safety & Trust" cards. Keep only the "Join our Beta Community" section with the email link and a brief intro paragraph.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/SignupPlayerPage.tsx` | Add Google/Apple buttons, use Supabase signup |
| `src/pages/SignupOrganizerPage.tsx` | Add Google/Apple buttons, use Supabase signup |
| `supabase/functions/telegram-poll/index.ts` | Fix price/100 → price on lines 733, 1514 |
| `src/pages/organizer/OrganizeLanding.tsx` | Add share button to activity rows |
| `src/pages/HelpPage.tsx` | Remove redundant cards, simplify |

No database changes needed. Edge function redeployment needed for telegram-poll.

