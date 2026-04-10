# Fix Dashboard Routing, Role Restrictions, and Contact Buttons

## Root Cause

The "My Bookee" blank page is caused by a role mismatch: the default role was changed to `'user'` but the route at `/player/dashboard` still has `allowedRoles={['player']}`. Users with role `'user'` hit the ProtectedRoute, fail the role check, and get redirected in a loop.

## Plan

### 1. Fix route role restrictions in `src/App.tsx`

Update all `allowedRoles={['player']}` to `allowedRoles={['player', 'user']}` on player routes (dashboard, bookings, payment, special-request, groups). This is the minimal fix — no route renaming needed since `/player/` is an internal path convention, not user-facing.

### 2. Add `/dashboard` redirect in `src/App.tsx`

Add `<Route path="/dashboard" element={<Navigate to="/player/dashboard" replace />} />` as a convenience alias so any stale `/dashboard` links work.

### 3. Update Navbar dashboard path

In `src/components/Navbar.tsx` line 29: change `dashboardPath` to always use `/player/dashboard` for `'user'` role (already does this, just confirm).

### 4. Contact buttons — already implemented

WhatsApp and Telegram buttons both exist in `EventDetails.tsx` (lines 1206-1225) with correct logic: WhatsApp uses `organizerProfile.phone`, Telegram uses `organizerProfile.username`. The UI for the session needs to have both buttons present, add them so that users can interact with the buttons and directly contact organizers. 

## Files Changed


| File                      | Change                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `src/App.tsx`             | Change `allowedRoles` on player routes to include `'user'`; add `/dashboard` redirect |
| `src/pages/LoginPage.tsx` | Ensure `getDashboardPath` returns `/player/dashboard` for `'user'` role               |


No database or schema changes. No UI refactoring.