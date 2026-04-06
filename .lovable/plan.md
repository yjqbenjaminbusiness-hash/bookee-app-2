

# Enhance Group Management & Contact UX

## Diagnosis

### 1. Sport Field — Currently Dropdown
Both create and edit forms in `Groups.tsx` use a `<select>` with hardcoded `SPORTS` array (line 14, 166-169, 229-232). This prevents custom sport names.

### 2. Group Banner Image — Create Works, Edit Missing
- **Create**: Image upload exists (lines 181-194) with `handleImageChange`, uploads via `dataService.uploadGroupImage`. Working.
- **Edit**: No image upload option. The edit form (lines 225-240) only has name, sport, description. No way to change/add a banner after creation.

### 3. Banner Display — Working
- Groups.tsx shows banner (line 219-222)
- GroupPage.tsx shows banner (line 121-124)
- OrganizeLanding doesn't show group banners (it's a compact list view — acceptable)

### 4. Contact Buttons — Working but Could Be Clearer
Both WhatsApp and Telegram buttons exist in EventDetails.tsx (lines 1201-1219). They work correctly. The request asks for a "preferred" label when both methods exist.

## Plan

### File: `src/pages/organizer/Groups.tsx`

**Change 1 — Sport field: dropdown → text input**
- Remove the `SPORTS` constant
- Replace both `<select>` elements (create form line 166-169 and edit form line 229-232) with `<Input>` components
- Add placeholder text: `"e.g. Badminton, Futsal, Tennis"`
- Change default `newGroup.sport` from `'Badminton'` to `''` (line 23)
- Existing stored values are untouched — text input just displays whatever is already in the DB

**Change 2 — Add image upload to edit mode**
- Add `editImageFile` and `editImagePreview` state
- In the edit form (line 226-240), add image upload UI (reuse same pattern as create form lines 181-194)
- In `handleSaveEdit`, if `editImageFile` is set, call `dataService.uploadGroupImage(editImageFile, groupId)` then include `image_url` in the update
- Show current banner preview if it exists, with option to replace

### File: `src/pages/player/EventDetails.tsx`

**Change 3 — Contact button clarity**
- When both WhatsApp and Telegram are available, add a small "Preferred" badge on the WhatsApp button (since phone-based contact is typically primary)
- When only one method exists, show just that button with no "preferred" label
- No structural change to existing buttons

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/organizer/Groups.tsx` | Replace sport dropdowns with text inputs; add image upload to edit mode |
| `src/pages/player/EventDetails.tsx` | Add "Preferred" label to primary contact button when both methods available |

No database changes needed. Sport column is already `text` type.

