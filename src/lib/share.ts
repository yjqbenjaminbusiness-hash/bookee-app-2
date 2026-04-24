import type { Activity, ActivitySession } from './data';

const SITE_BASE = 'https://bookee-app.com';

function formatDateShort(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Build a preformatted, WhatsApp/Telegram-friendly share message for a session.
 * Example:
 *   Wed, 24 Apr · Friday Night Badminton
 *   📍 Sports Hub Court 3
 *
 *   6/8 slots filled · 2 slots left
 *
 *   Join here:
 *   https://bookee-app.com/player/events/<id>
 */
export function buildShareMessage(activity: Activity, sessions: ActivitySession[] = []): string {
  const link = `${SITE_BASE}/player/events/${activity.id}`;
  const totalSlots = sessions.reduce((a, s) => a + (s.max_slots || 0), 0);
  const filledSlots = sessions.reduce((a, s) => a + (s.filled_slots || 0), 0);
  const remaining = Math.max(0, totalSlots - filledSlots);

  const lines: string[] = [];
  lines.push(`${formatDateShort(activity.date)} · ${activity.title}`);
  if (activity.venue) lines.push(`📍 ${activity.venue}`);
  lines.push('');
  if (totalSlots > 0) {
    lines.push(
      remaining > 0
        ? `${filledSlots}/${totalSlots} slots filled · ${remaining} slot${remaining === 1 ? '' : 's'} left`
        : `${filledSlots}/${totalSlots} slots filled · FULL`,
    );
    lines.push('');
  }
  lines.push('Join here:');
  lines.push(link);
  return lines.join('\n');
}

export function shareLink(activity: Activity): string {
  return `${SITE_BASE}/player/events/${activity.id}`;
}

export function whatsappShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function telegramShareUrl(activity: Activity, message: string): string {
  // Telegram's share URL takes a `url` + a `text`. We pass the canonical link
  // as the URL and the rest of the formatted message as text.
  const link = shareLink(activity);
  return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`;
}