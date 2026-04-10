# Simplify Roles, Fix Auth Flow, Improve Explore UX

## Diagnosis

1. **"Player" role display**: When a user has no entry in `user_roles`, `useAuth` defaults to `'player'`. This label shows in the Navbar dropdown, Settings page badge, and mobile menu. The user wants to remove this tagging. 
2. **Email confirmation blocking access**: After signup, users get `verification_status: 'unverified'` on their profile and may see "Pending Review" badges. The `ProtectedRoute` no longer blocks on verification, but the UI still shows misleading "Pending Review" status. Email confirmation for Supabase auth is a separate concern — if emails aren't being delivered, users get stuck.
3. **Explore sport filters**: The `SPORT_CATEGORIES` buttons take up significant space. User wants search-only filtering.
4. **WhatsApp button**: The Supabase activity view already has WhatsApp + Telegram contact buttons. The mock event view also has WhatsApp sharing. However, on the session page, there should be a contact organizer WhatsApp & telegram button. This is missing and needs to be added in the UI. 

## Plan

### 1. Remove "Player" role label from UI

**Files**: `src/hooks/useAuth.tsx`, `src/components/Navbar.tsx`, `src/pages/SettingsPage.tsx`

- In `useAuth.tsx`: Change default role from `'player'` to `'user'` (lines 91, 116, 243). Update `MockUser` type to include `'user'`.
- In `Navbar.tsx`: 
  - Change `dashboardPath` (line 29): if role is `'user'`, go to `/player/dashboard` (keep same destination, just don't label it "Player").
  - Line 101: Hide role text when role is `'user'`, only show for `organizer`/`admin`.
  - Line 149: Same for mobile menu — show "Account" instead of "player account".
- In `SettingsPage.tsx`: 
  - Line 86: Don't show role badge when role is `'user'`.
  - Lines 132-143: Remove the "Pending organizer" notice (no longer relevant since all users can organize).

### 2. Fix email confirmation flow

**Action**: Use `configure_auth` to disable mandatory email confirmation (auto-confirm signups). This prevents blocked access when email delivery isn't working.

- In `src/pages/SignupPlayerPage.tsx` and `src/pages/SignupOrganizerPage.tsx`: After successful signup, navigate directly to dashboard instead of showing "check your email" message.

### 3. Remove sport category filters from Explore

**File**: `src/pages/player/Events.tsx`

- Remove `SPORT_CATEGORIES` constant (lines 11-21).
- Remove `selectedSport` state (line 41).
- Remove the sport filter button row (lines 188-199).
- Update `filteredActivities` and `filteredBallotActivities` to remove `matchesSport` — only use search text matching (which already searches by sport name).

### 4. WhatsApp button — Already implemented

The Supabase activity detail view (EventDetails.tsx lines 1206-1214) already has a WhatsApp contact button next to Telegram. No changes needed.

## Files Changed


| File                                | Change                                            |
| ----------------------------------- | ------------------------------------------------- |
| `src/hooks/useAuth.tsx`             | Default role `'user'` instead of `'player'`       |
| `src/lib/mockData.ts`               | Add `'user'` to MockUser role type                |
| `src/components/Navbar.tsx`         | Hide role label for regular users                 |
| `src/pages/SettingsPage.tsx`        | Hide role badge + remove pending organizer notice |
| `src/pages/player/Events.tsx`       | Remove sport filter buttons, keep search          |
| `src/pages/SignupPlayerPage.tsx`    | Navigate to dashboard on signup success           |
| `src/pages/SignupOrganizerPage.tsx` | Navigate to dashboard on signup success           |
| `src/components/ProtectedRoute.tsx` | Handle `'user'` role in dashboard redirect        |


Auth config change: Enable auto-confirm email signups.