

# Fix Session Creation Visibility Bug

## Root Cause

In `CreateEvent.tsx` (used for Activity/Event/Ballot sessions via `?type=`), line 114 hardcodes `visibility: 'public'` in the `createActivity` payload. There is **no `visibility` state variable** and **no visibility toggle UI** in this form — only a `participantVisibility` toggle (which controls whether other players can see the participant list, a separate concern).

The `CreateBallotSession.tsx` page correctly has both a `visibility` state and a toggle UI, so ballots created from that route work. But sessions created via `CreateEvent.tsx` are always public regardless of user intent.

## Fix

### `src/pages/organizer/CreateEvent.tsx` — 3 changes

1. **Add visibility state** (near line 63):
   - Add `const [visibility, setVisibility] = useState<'public' | 'private'>('public');`

2. **Pass visibility to createActivity** (line 114):
   - Change `visibility: 'public'` → `visibility`

3. **Add visibility toggle UI** (insert after the Participant List Visibility card, before Payment Policy):
   - Add a "Session Visibility" card with public/private toggle buttons, identical in style to the existing participant visibility card. Public = "Visible in explore and listings", Private = "Only accessible via shared link".

This is the same pattern already used in `CreateBallotSession.tsx` lines 133-163. No new components needed.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/organizer/CreateEvent.tsx` | Add `visibility` state, pass it in payload, add visibility toggle card |

No database or other file changes needed.

