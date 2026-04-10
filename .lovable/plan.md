

# Fix Contact Buttons Position in Session UI

## Diagnosis

The WhatsApp and Telegram contact buttons **do exist** in `SupabaseActivityView` (lines 1297-1329) but are placed after the announcements section, not directly below the banner image as requested. The user wants them immediately visible below the hero banner, before any other content.

## Plan

### 1. Move contact buttons below banner in `SupabaseActivityView`

**File**: `src/pages/player/EventDetails.tsx`

Move the "Contact Organizer" section (lines 1297-1329) from its current position (after announcements) to directly after the banner image section (after line 1276, before the description paragraph).

This ensures:
- Buttons are the first actionable element users see after the banner
- Visible without scrolling past announcements
- No conditional change needed — existing `organizerProfile && (phone || username)` check is correct

### 2. No other files need changes

The mock event view (lines 18-948) uses a different rendering path with its own contact logic. The Supabase view is what renders for real database activities, which is what the user is viewing at `/player/events/:id`.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/player/EventDetails.tsx` | Move contact buttons section from after announcements to directly below banner image |

No database changes. No new components. Existing conditional rendering (hide if no contact data) preserved.

