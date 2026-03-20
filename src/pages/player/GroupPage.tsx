import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { store } from '../../lib/mockData';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import MemoriesCarousel from '../../components/MemoriesCarousel';
import { ArrowLeft, Calendar, Clock, Users, Star, ChevronRight, ArrowRight, UserPlus, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ── Sport category colour map ─────────────────────────────────────────────────
const SPORT_STYLES: Record<string, { color: string; bg: string; emoji: string }> = {
  Badminton:      { color: '#1A7A4A', bg: '#E8F7EF', emoji: '🏸' },
  Basketball:     { color: '#C47A00', bg: '#FEF9EC', emoji: '🏀' },
  Pickleball:     { color: '#1A6FA8', bg: '#E6F0FA', emoji: '🎾' },
  Soccer:         { color: '#7C3AED', bg: '#F3F0FF', emoji: '⚽' },
  Swimming:       { color: '#0891B2', bg: '#ECFEFF', emoji: '🏊' },
  'Dragon Boating': { color: '#B91C1C', bg: '#FEF2F2', emoji: '🚣' },
  Volleyball:     { color: '#D97706', bg: '#FFFBEB', emoji: '🏐' },
  Running:        { color: '#059669', bg: '#ECFDF5', emoji: '🏃' },
  Tennis:         { color: '#7C3AED', bg: '#F3F0FF', emoji: '🎾' },
  default:        { color: '#1A7A4A', bg: '#E8F7EF', emoji: '🏅' },
};

// ── Group-specific photo pools ────────────────────────────────────────────────
const GROUP_PHOTO_POOLS: Record<string, Array<{ id: string; src: string; caption: string; event: string; month: string }>> = {
  'grp-1': [
    { id: 'g1-m1', src: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=1000&q=80',  caption: 'Badminton Social Jan 2026',      event: 'Senja Cashew Sports Hall', month: 'Jan 2026' },
    { id: 'g1-m2', src: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=1000&q=80',  caption: 'Jump Smash Highlights',          event: 'Jurong East CC',           month: 'Feb 2026' },
    { id: 'g1-m3', src: 'https://images.unsplash.com/photo-1519162952575-c6c7199502a3?w=1000&q=80',  caption: 'Friday Pickup Game',             event: 'Senja Cashew Sports Hall', month: 'Jan 2026' },
    { id: 'g1-m4', src: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1000&q=80',  caption: 'Evening Badminton Social',       event: 'Bishan Sports Hall',       month: 'Feb 2026' },
    { id: 'g1-m5', src: 'https://images.unsplash.com/photo-1551958219-acbc630e2914?w=1000&q=80',  caption: 'Coaching Session — Feb 2026',    event: 'Senja Cashew Sports Hall', month: 'Feb 2026' },
  ],
  'grp-2': [
    { id: 'g2-m1', src: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=1000&q=80',  caption: 'Basketball Night Feb 2026',      event: 'CCAB Indoor Court',        month: 'Feb 2026' },
    { id: 'g2-m2', src: 'https://images.unsplash.com/photo-1546519638405-a9f894ef8a4b?w=1000&q=80',  caption: 'Community League Kickoff',       event: 'Toa Payoh Sports Hall',    month: 'Feb 2026' },
    { id: 'g2-m3', src: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1000&q=80',  caption: 'Mini-Game Award Ceremony',       event: 'CCAB Indoor Court',        month: 'Jan 2026' },
    { id: 'g2-m4', src: 'https://images.unsplash.com/photo-1504450758481-73389ba7524a?w=1000&q=80',  caption: 'Group Celebration — Hoops SG',   event: 'CCAB',                     month: 'Feb 2026' },
  ],
};

// ── Demo events per group ─────────────────────────────────────────────────────
const GROUP_EVENTS: Record<string, Array<{
  id: string; venue: string; date: string; displayDate: string;
  time: string; slots: string; price: string; isPast: boolean;
}>> = {
  'grp-1': [
    { id: 'ge-1', venue: 'Senja Cashew Sports Hall', date: '2026-03-01', displayDate: 'Sun, 1 Mar 2026', time: '5–7pm', slots: '3/6', price: '$12', isPast: false },
    { id: 'ge-2', venue: 'Jurong East CC',           date: '2026-03-08', displayDate: 'Sun, 8 Mar 2026', time: '5–7pm', slots: '5/8', price: '$10', isPast: false },
    { id: 'ge-3', venue: 'Bishan Sports Hall',       date: '2026-03-15', displayDate: 'Sun, 15 Mar 2026', time: '4–6pm', slots: '2/6', price: '$12', isPast: false },
    { id: 'ge-4', venue: 'Senja Cashew Sports Hall', date: '2026-02-15', displayDate: 'Sun, 15 Feb 2026', time: '5–7pm', slots: '6/6', price: '$12', isPast: true  },
    { id: 'ge-5', venue: 'Jurong East CC',           date: '2026-02-08', displayDate: 'Sun, 8 Feb 2026',  time: '5–7pm', slots: '8/8', price: '$10', isPast: true  },
  ],
  'grp-2': [
    { id: 'ge-6', venue: 'CCAB Indoor Court',        date: '2026-03-02', displayDate: 'Mon, 2 Mar 2026',  time: '7–9pm', slots: '4/10', price: '$15', isPast: false },
    { id: 'ge-7', venue: 'Toa Payoh Sports Hall',    date: '2026-03-09', displayDate: 'Mon, 9 Mar 2026',  time: '7–9pm', slots: '7/10', price: '$15', isPast: false },
    { id: 'ge-8', venue: 'CCAB Indoor Court',        date: '2026-02-20', displayDate: 'Fri, 20 Feb 2026', time: '7–9pm', slots: '10/10', price: '$15', isPast: true },
  ],
};

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const handleJoinGroup = () => {
    if (!user) { toast.error('Please log in to join a group'); return; }
    if (!groupId) return;
    const group = store.getGroup(groupId);
    if (!group) return;
    if (group.memberIds.includes(user.id)) {
      toast.info('You are already a member of this group');
      return;
    }
    setIsJoining(true);
    setTimeout(() => {
      store.joinGroup(user.id, groupId);
      setHasJoined(true);
      setIsJoining(false);
      toast.success(`You joined ${group.name}! You'll now see their upcoming sessions.`);
    }, 700);
  };

  const group = groupId ? store.getGroup(groupId) : undefined;
  const photos = (groupId && GROUP_PHOTO_POOLS[groupId]) || GROUP_PHOTO_POOLS['grp-1'];
  const allEvents = (groupId && GROUP_EVENTS[groupId]) || [];
  const upcomingEvents = allEvents.filter(e => !e.isPast).sort((a, b) => a.date.localeCompare(b.date));
  const pastEvents = allEvents.filter(e => e.isPast).sort((a, b) => b.date.localeCompare(a.date));
  const displayedEvents = tab === 'upcoming' ? upcomingEvents : pastEvents;

  const sportStyle = SPORT_STYLES[group?.sport || 'default'] || SPORT_STYLES.default;

  if (!group) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Group not found.</p>
        <Button variant="link" className="mt-4" onClick={() => navigate('/player/events')}>
          ← Back to Events
        </Button>
      </div>
    );
  }

  const organizer = store.getUser(group.organizerId);

  return (
    <div className="flex flex-col w-full">
      {/* ── Back nav ── */}
      <div className="border-b bg-white sticky top-16 z-30">
        <div className="container px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => navigate('/player/events')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Browse Events
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-bold" style={{ color: '#111' }}>{group.name}</span>
        </div>
      </div>

      <div className="container px-4 py-8 space-y-8 max-w-3xl">

        {/* ── Group header card ── */}
        <div className="flex items-start gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold" style={{ color: '#111' }}>{group.name}</h1>
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: sportStyle.bg, color: sportStyle.color }}
              >
                {sportStyle.emoji} {group.sport}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#FEF9EC', color: '#C47A00' }}>
                👥 Community
              </span>
            </div>
            {group.description && (
              <p className="text-muted-foreground text-sm mt-1">{group.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {group.memberIds.length} member{group.memberIds.length !== 1 ? 's' : ''}</span>
              {organizer && <span>Organised by <span className="font-bold" style={{ color: '#111' }}>{organizer.displayName}</span></span>}
            </div>
            {/* Join Group CTA */}
            {user && !hasJoined && !group.memberIds.includes(user.id) && user.id !== group.organizerId && (
              <div className="mt-3">
                <Button
                  onClick={handleJoinGroup}
                  disabled={isJoining}
                  className="rounded-full font-bold px-6"
                  style={{ background: '#C47A00', color: '#fff' }}
                >
                  {isJoining ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</>
                  ) : (
                    <><UserPlus className="mr-2 h-4 w-4" /> Join This Group</>
                  )}
                </Button>
              </div>
            )}
            {user && (hasJoined || group.memberIds.includes(user.id)) && user.id !== group.organizerId && (
              <div className="mt-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" style={{ background: '#E8F7EF', color: '#1A7A4A' }}>
                  <Check className="h-4 w-4" /> You are a member of this group
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Memory Carousel ── */}
        <section>
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: sportStyle.color }}>Group Gallery</p>
            <h2 className="text-lg font-bold" style={{ color: '#111' }}>Memories</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Up to 12 photos &amp; 1 video per year · Auto-slides · Click to expand</p>
          </div>
          <MemoriesCarousel
            title={group.name}
            subtitle={`${sportStyle.emoji} ${group.sport} · ${group.memberIds.length} members`}
            photos={photos}
            showSocialLinks={false}
          />
        </section>

        {/* ── Events with tabs ── */}
        <section>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#1A7A4A' }}>Sessions</p>
            <h2 className="text-lg font-bold" style={{ color: '#111' }}>Group Events</h2>
          </div>

          {/* Tab pills */}
          <div className="flex gap-2 mb-5">
            {(['upcoming', 'past'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-6 py-2 rounded-full text-sm font-bold border-2 transition-all"
                style={
                  tab === t
                    ? { background: '#1A7A4A', color: '#fff', borderColor: '#1A7A4A' }
                    : { background: 'transparent', color: '#555', borderColor: 'rgba(0,0,0,0.12)' }
                }
              >
                {t === 'upcoming' ? `Upcoming (${upcomingEvents.length})` : `Past (${pastEvents.length})`}
              </button>
            ))}
          </div>

          {/* Event list */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {displayedEvents.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border-2 border-dashed bg-muted/10">
                  <span className="text-3xl mb-3 block">{tab === 'upcoming' ? '📅' : '📂'}</span>
                  <p className="font-bold" style={{ color: '#111' }}>
                    {tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tab === 'upcoming' ? 'Check back later for new sessions.' : 'Past sessions will appear here.'}
                  </p>
                </div>
              ) : (
                displayedEvents.map((evt, i) => {
                  const fillParts = evt.slots.split('/');
                  const taken = parseInt(fillParts[0]);
                  const total = parseInt(fillParts[1]);
                  const fillPct = total > 0 ? (taken / total) * 100 : 0;

                  return (
                    <motion.div
                      key={evt.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group p-4 rounded-2xl border-2 bg-white hover:shadow-md transition-all cursor-pointer"
                      style={{
                        borderColor: tab === 'upcoming' ? 'rgba(26,122,74,0.14)' : 'rgba(0,0,0,0.08)',
                        opacity: tab === 'past' ? 0.85 : 1,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className="p-2 rounded-xl flex-shrink-0"
                            style={{ background: tab === 'upcoming' ? '#E8F7EF' : '#f5f5f5' }}
                          >
                            <Calendar className="h-4 w-4" style={{ color: tab === 'upcoming' ? '#1A7A4A' : '#888' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm leading-snug" style={{ color: '#111' }}>{evt.venue}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" /> {evt.displayDate} · {evt.time}
                            </p>
                            {/* Capacity bar */}
                            <div className="mt-2">
                              <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Users className="h-2.5 w-2.5" /> {evt.slots} booked
                                </span>
                                {tab === 'upcoming' && (
                                  <span className="font-bold" style={{ color: fillPct >= 90 ? '#B91C1C' : '#1A7A4A' }}>
                                    {fillPct >= 100 ? 'Full' : `${total - taken} left`}
                                  </span>
                                )}
                                {tab === 'past' && (
                                  <span className="text-muted-foreground font-bold">Completed</span>
                                )}
                              </div>
                              <div className="h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-1 rounded-full"
                                  style={{
                                    width: `${Math.min(fillPct, 100)}%`,
                                    background: tab === 'past' ? '#ccc' : fillPct >= 90 ? '#B91C1C' : '#1A7A4A',
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-base font-bold" style={{ color: tab === 'upcoming' ? '#1A7A4A' : '#888' }}>
                            {evt.price}
                          </span>
                          {tab === 'upcoming' && fillPct < 100 && (
                            <Button
                              size="sm"
                              className="rounded-full px-4 font-bold text-white text-xs hover:scale-105 transition-transform"
                              style={{ background: '#1A7A4A' }}
                            >
                              Book <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                          {tab === 'upcoming' && fillPct >= 100 && (
                            <Badge className="text-[10px] font-bold" style={{ background: '#FEF9EC', color: '#C47A00', border: 'none' }}>
                              Waitlist
                            </Badge>
                          )}
                          {tab === 'past' && (
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className="h-3 w-3" style={{ color: '#C47A00', fill: s <= 4 ? '#C47A00' : 'none' }} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ── Members preview ── */}
        <section className="pb-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold" style={{ color: '#111' }}>Members</h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {group.memberIds.slice(0, 8).map(memberId => {
              const member = store.getUser(memberId);
              if (!member) return null;
              const isOrg = memberId === group.organizerId;
              return (
                <div key={memberId} className="flex flex-col items-center gap-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2"
                    style={{
                      background: isOrg ? '#E8F7EF' : '#FEF9EC',
                      color: isOrg ? '#1A7A4A' : '#C47A00',
                      borderColor: isOrg ? '#1A7A4A' : '#C47A00',
                    }}
                  >
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium max-w-[48px] text-center truncate">
                    {isOrg ? 'Host' : member.displayName.split(' ')[0]}
                  </span>
                </div>
              );
            })}
            {group.memberIds.length > 8 && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground">
                  +{group.memberIds.length - 8}
                </div>
                <span className="text-[9px] text-muted-foreground">more</span>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}