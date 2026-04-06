

# Feedback System + Button Visibility + Color Fixes

## What We're Building

1. A reusable **FeedbackDialog** component (dialog with message + optional category)
2. Feedback buttons on My Bookee and Organize pages
3. Submission sends email via the existing email infrastructure
4. Visual fixes for button contrast and the "Upcoming" card color on Organize page

## Diagnosis

- **Email**: The project has Lovable email infrastructure set up (`notify.bookee-app.com`). We can use `send-transactional-email` to deliver feedback to the support email.
- **Support email**: `yjqbenjaminbusiness@gmail.com` (already shown on Help page).
- **Button visibility issue**: On OrganizeLanding, buttons like "Manage Groups", "View More", "Expand" use `variant="outline"` or `variant="ghost"` which blend into the light background. Need stronger borders/colors.
- **"Upcoming" card color**: Uses `bg-accent/30` with accent being mustard (`40 95% 40%`). The resulting yellow-brown is unappealing. Need a softer, lighter yellow.

## Plan

### 1. New Component: `src/components/FeedbackDialog.tsx`
- Dialog with:
  - Category select (Bug, Feature Request, Payment Issue, Other) — optional
  - Message textarea (required)
  - Support email shown at bottom: "Or email us: yjqbenjaminbusiness@gmail.com"
- On submit: call `supabase.functions.invoke('send-transactional-email', ...)` with a `feedback` template
- Include user ID, page context (current path), timestamp in the email body
- Show toast on success/failure

### 2. New Email Template: `supabase/functions/_shared/transactional-email-templates/feedback.tsx`
- Simple template showing: category, message, user info, page context, timestamp
- Recipient: `yjqbenjaminbusiness@gmail.com`
- Register in `registry.ts`

### 3. Add Feedback Button to Pages
- **Player Dashboard** (`src/pages/player/Dashboard.tsx`): Add a "Feedback" button in the header area next to "Find a Game"
- **Organize Landing** (`src/pages/organizer/OrganizeLanding.tsx`): Add a "Feedback" button in the header area

### 4. Visual Fixes — Button Contrast (OrganizeLanding.tsx)
- "Manage Groups" button (line 109-115): Add stronger border color `border-primary text-primary`
- "View More" button (line 247-254): Add `border-primary/40 text-primary` styling
- Quick create inner buttons (line 283-291): Add `border-primary/30 text-primary` styling

### 5. Visual Fix — "Upcoming" Card Color (OrganizeLanding.tsx)
- Change the "Upcoming" metrics card (line 137-146) from `bg-accent/30 border-accent/30` to a softer yellow: `bg-amber-50 border-amber-200/60` with `text-amber-700` for the text

## Files Modified

| File | Changes |
|------|---------|
| `src/components/FeedbackDialog.tsx` | New — reusable feedback dialog component |
| `supabase/functions/_shared/transactional-email-templates/feedback.tsx` | New — feedback email template |
| `supabase/functions/_shared/transactional-email-templates/registry.ts` | Register feedback template |
| `src/pages/player/Dashboard.tsx` | Add feedback button |
| `src/pages/organizer/OrganizeLanding.tsx` | Add feedback button + fix button contrast + fix Upcoming card color |

Deploy `send-transactional-email` after template changes.

## Notes
- No database changes needed
- No ticket system, no dashboards — just email delivery
- Feedback works for both logged-in and logged-out users (logged-in includes user context)

