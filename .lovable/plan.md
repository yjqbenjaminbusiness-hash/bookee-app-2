

# Telegram Post Game + Demo Hide Persistence

## Overview
Two changes:
1. **Post Game to Telegram**: Add a button in the Manage Sessions view that lets organizers select sessions and post a formatted message to their linked Telegram chat via BookeeAppBot
2. **Demo Hide Persistence**: Persist the "hide demo" toggle across page refreshes using localStorage

## Technical Details

### 1. Edge Function: `post-game-telegram`

New edge function `supabase/functions/post-game-telegram/index.ts` that:
- Accepts `{ chat_id, message }` in the request body
- Validates the user is authenticated (checks JWT)
- Sends the formatted message via the existing Telegram connector gateway (`sendMessage`)
- Returns success/error

The organizer's `telegram_chat_id` from their profile is used as the target chat. If the organizer hasn't linked their Telegram account, show an error prompting them to link via BookeeAppBot.

### 2. UI: ManageEvent.tsx (`SupabaseManageView`)

**Add "Post to Telegram" button** near the existing "Post Game" / "Find Participants" buttons (~line 999):
- New state: `showTelegramPostDialog`, `selectedPostSessions` (Set), `isPostingTelegram`
- Dialog with session checkboxes (all sessions listed with time labels)
- "Select All" toggle
- Preview of the combined message
- "Post" button that calls the edge function

**Message format** (combined, one message for all selected sessions):
```
🏆 {activity.title}
📅 {date}
📍 {venue}

⏰ {session1.time_label} — {available} slot(s) left (${price})
⏰ {session2.time_label} — {available} slot(s) left (${price})

👉 Join: {link}
```

**Error handling**:
- If organizer has no `telegram_chat_id`: show toast error "Link your Telegram account first via @BookeeAppBot"
- If posting fails: show toast error with message
- If posting succeeds: show toast success

### 3. Demo Hide Persistence

**localStorage key**: `bookee_hide_demo`

**Files changed**:
- `src/pages/player/Events.tsx` (~line 39): Initialize `showDemo` from `localStorage.getItem('bookee_hide_demo') !== 'true'`, and update localStorage when toggling
- `src/pages/organizer/OrganizeLanding.tsx` (~line 24): Same pattern

Both pages read/write the same key so the preference is consistent.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/post-game-telegram/index.ts` | New edge function to send message via Telegram gateway |
| `src/pages/organizer/ManageEvent.tsx` | Add "Post to Telegram" button + session selection dialog in `SupabaseManageView` |
| `src/pages/player/Events.tsx` | Persist `showDemo` to localStorage |
| `src/pages/organizer/OrganizeLanding.tsx` | Persist `showDemo` to localStorage |

No database migrations needed. No changes to existing booking/session logic.

