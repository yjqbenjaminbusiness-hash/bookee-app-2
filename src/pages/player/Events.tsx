import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../../lib/mockData';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Search, ArrowRight, Users, Star, Calendar, MapPin, ChevronRight, Clock, UserPlus, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// ── Sport categories ──────────────────────────────────────────────────────────
const SPORT_CATEGORIES = [
  { id: 'all', label: 'All Sports', emoji: '🏅', color: '#1A7A4A', bg: '#E8F7EF' },
  { id: 'Badminton', label: 'Badminton', emoji: '🏸', color: '#1A7A4A', bg: '#E8F7EF' },
  { id: 'Basketball', label: 'Basketball', emoji: '🏀', color: '#C47A00', bg: '#FEF9EC' },
  { id: 'Pickleball', label: 'Pickleball', emoji: '🎾', color: '#1A6FA8', bg: '#E6F0FA' },
  { id: 'Soccer', label: 'Soccer', emoji: '⚽', color: '#7C3AED', bg: '#F3F0FF' },
  { id: 'Swimming', label: 'Swimming', emoji: '🏊', color: '#0891B2', bg: '#ECFEFF' },
  { id: 'Dragon Boating', label: 'Dragon Boating', emoji: '🚣', color: '#B91C1C', bg: '#FEF2F2' },
  { id: 'Volleyball', label: 'Volleyball', emoji: '🏐', color: '#D97706', bg: '#FFFBEB' },
  { id: 'Running', label: 'Running', emoji: '🏃', color: '#059669', bg: '#ECFDF5' },
  { id: 'Tennis', label: 'Tennis', emoji: '🎾', color: '#7C3AED', bg: '#F3F0FF' },
];

// Sport thumbnail images
const SPORT_PHOTOS: Record<string, string> = {
  Badminton: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800&q=80',
  Basketball: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80',
  Pickleball: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80',
  Soccer: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  Swimming: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&q=80',
  'Dragon Boating': 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80',
  Volleyball: 'https://images.unsplash.com/photo-1592656094267-764a45159575?w=800&q=80',
  Running: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
  Tennis: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
};

// Determine sport from event description/venue
function inferSport(event: { venue: string; description: string }): string {
  const text = `${event.venue} ${event.description}`.toLowerCase();
  if (text.includes('badminton')) return 'Badminton';
  if (text.includes('basketball')) return 'Basketball';
  if (text.includes('pickleball')) return 'Pickleball';
  if (text.includes('soccer') || text.includes('football') || text.includes('futsal')) return 'Soccer';
  if (text.includes('swim')) return 'Swimming';
  if (text.includes('dragon') || text.includes('rowing')) return 'Dragon Boating';
  if (text.includes('volleyball')) return 'Volleyball';
  if (text.includes('tennis')) return 'Tennis';
  if (text.includes('run') || text.includes('marathon')) return 'Running';
  return 'Badminton'; // default for demo
}

function getEventPhoto(sport: string): string {
  return SPORT_PHOTOS[sport] || SPORT_PHOTOS.default;
}

// Group thumbnail images (for group cards)
const GROUP_THUMBNAILS = [
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80',
  'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=400&q=80',
  'https://images.unsplash.com/photo-1546519638405-a9f894ef8a4b?w=400&q=80',
];

function getGroupThumbnail(groupId: string): string {
  const idx = groupId.charCodeAt(groupId.length - 1) % GROUP_THUMBNAILS.length;
  return GROUP_THUMBNAILS[idx];
}

// ── Demo upcoming events per group ────────────────────────────────────────────
const DEMO_GROUP_EVENTS: Record<string, Array<{ venue: string; date: string; time: string; slots: string; price: string }>> = {
  'grp-1': [
    { venue: 'Senja Cashew Sports Hall', date: '1 Mar (Sun)', time: '5–7pm', slots: '3/6', price: '$12' },
    { venue: 'Jurong East CC', date: '8 Mar (Sun)', time: '5–7pm', slots: '5/8', price: '$10' },
    { venue: 'Bishan Sports Hall', date: '15 Mar (Sun)', time: '4–6pm', slots: '2/6', price: '$12' },
  ],
  'grp-2': [
    { venue: 'Demo Activity CCAB Indoor Court', date: '2 Mar (Mon)', time: '7–9pm', slots: '4/10', price: '$15' },
    { venue: 'Toa Payoh Sports Hall', date: '9 Mar (Mon)', time: '7–9pm', slots: '7/10', price: '$15' },
  ],
};

export default function PlayerEvents() {
  const [selectedSport, setSelectedSport] = useState('all');
  const [search, setSearch] = useState('');
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const events = store.listEvents();
  const allGroups = store.groups;

  const handleJoinGroup = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please log in to join a group');
      return;
    }
    const group = store.getGroup(groupId);
    if (!group) return;
    if (group.memberIds.includes(user.id)) {
      toast.info('You are already a member of this group');
      return;
    }
    setJoiningGroupId(groupId);
    setTimeout(() => {
      store.joinGroup(user.id, groupId);
      setJoinedGroupIds(prev => new Set([...prev, groupId]));
      setJoiningGroupId(null);
      toast.success(`Joined ${group.name}! You can now view their upcoming sessions.`);
    }, 600);
  };

  // Filter events by sport and search
  const filteredEvents = events.filter(e => {
    const sport = inferSport(e);
    const matchesSport = selectedSport === 'all' || sport === selectedSport;
    const matchesSearch = !search ||
      e.venue.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase());
    return matchesSport && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full">

      {/* ── Page Header ── */}
      <div className="border-b bg-white sticky top-16 z-30">
        <div className="container px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#111' }}>Explore</h1>
            <p className="text-sm text-muted-foreground">Discover public sessions & community groups</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search by venue or sport..."
              className="w-full pl-10 pr-4 py-2 rounded-full border bg-muted/40 text-sm outline-none focus:border-primary/50 transition-colors"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container px-4 py-8 space-y-12">

        {/* ═══════════════════════════════════════════════
            SECTION 1 – PUBLIC SPORTS DISCOVERY
        ═══════════════════════════════════════════════ */}
        <section>
          {/* Section label */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#1A7A4A' }}>Open to Everyone</p>
              <h2 className="text-xl font-bold" style={{ color: '#111' }}>Public Events</h2>
            </div>
            <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-muted/60 font-medium">
              {filteredEvents.length} session{filteredEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Sport filter carousel */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-3 mb-6 scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {SPORT_CATEGORIES.map(sport => (
              <button
                key={sport.id}
                onClick={() => setSelectedSport(sport.id)}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all hover:scale-105 active:scale-95"
                style={
                  selectedSport === sport.id
                    ? { background: sport.color, color: '#fff', borderColor: sport.color }
                    : { background: sport.bg, color: sport.color, borderColor: `${sport.color}33` }
                }
              >
                <span>{sport.emoji}</span>
                <span>{sport.label}</span>
              </button>
            ))}
          </div>

          {/* Events grid */}
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border-2 border-dashed bg-muted/20">
              <span className="text-4xl mb-3">🔍</span>
              <h3 className="font-bold text-lg" style={{ color: '#111' }}>No events found</h3>
              <p className="text-muted-foreground text-sm mt-1">Try a different sport or clear your search.</p>
              <Button variant="link" className="mt-3 text-primary font-bold" onClick={() => { setSearch(''); setSelectedSport('all'); }}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map((event, i) => {
                const sport = inferSport(event);
                const slots = store.listTimeslotsByEvent(event.id);
                const minPrice = slots.length > 0 ? Math.min(...slots.map(s => s.price)) : 0;
                const totalSpots = slots.reduce((a, s) => a + s.maxCapacity, 0);
                const takenSpots = slots.reduce((a, s) => a + s.currentCapacity, 0);
                const avgRating = store.getAverageRating(event.id);
                const fillPct = totalSpots > 0 ? (takenSpots / totalSpots) * 100 : 0;
                const sportCat = SPORT_CATEGORIES.find(c => c.id === sport) || SPORT_CATEGORIES[0];

                  const isDemo = event.venue.toLowerCase().includes('demo');

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className={`group rounded-2xl border-2 overflow-hidden hover:shadow-lg transition-all cursor-pointer relative ${isDemo ? 'opacity-75 bg-muted/40' : 'bg-white'}`}
                      style={{ borderColor: isDemo ? 'rgba(0,0,0,0.08)' : 'rgba(26,122,74,0.10)' }}
                      onClick={() => navigate(`/player/events/${event.id}`)}
                    >
                    {/* Image */}
                    <div className="relative h-44 overflow-hidden bg-muted">
                      <img
                        src={getEventPhoto(sport)}
                        alt={event.venue}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { (e.target as HTMLImageElement).src = SPORT_PHOTOS.default; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      {/* Sport badge */}
                      <span
                        className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: sportCat.bg, color: sportCat.color }}
                      >
                        {sportCat.emoji} {sport}
                      </span>
                      {/* Public tag */}
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.92)', color: '#1A7A4A' }}>
                        🌐 Public
                      </span>
                      {isDemo && (
                        <span className="absolute top-3 right-20 text-[10px] font-bold px-2.5 py-1 rounded-full bg-foreground/70 text-white">
                          DEMO
                        </span>
                      )}
                      {avgRating > 0 && (
                        <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: '#1A7A4A', color: '#fff' }}>
                          <Star className="h-2.5 w-2.5 fill-white" /> {avgRating}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-base leading-snug" style={{ color: '#111' }}>{event.venue}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                      </div>

                      {/* Capacity bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {takenSpots}/{totalSpots} booked</span>
                          <span className="font-bold" style={{ color: fillPct >= 90 ? '#B91C1C' : fillPct >= 60 ? '#C47A00' : '#1A7A4A' }}>
                            {fillPct >= 90 ? 'Almost full' : `${totalSpots - takenSpots} left`}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${fillPct}%`,
                              background: fillPct >= 90 ? '#B91C1C' : fillPct >= 60 ? '#C47A00' : '#1A7A4A',
                            }}
                          />
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-xs text-muted-foreground">from </span>
                          <span className="text-lg font-bold" style={{ color: '#111' }}>${minPrice}</span>
                        </div>
                        <Button
                          size="sm"
                          className="rounded-full px-5 font-bold text-white hover:scale-105 transition-transform"
                          style={{ background: '#1A7A4A' }}
                          onClick={e => { e.stopPropagation(); navigate(`/player/events/${event.id}`); }}
                        >
                          View Slots <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-3">Community Groups</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ═══════════════════════════════════════════════
            SECTION 2 – GROUP EVENTS
        ═══════════════════════════════════════════════ */}
        <section>
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#C47A00' }}>Community Specific</p>
            <h2 className="text-xl font-bold" style={{ color: '#111' }}>Groups</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Recurring sports communities — join a group to access their events.</p>
          </div>

          {allGroups.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border-2 border-dashed bg-muted/10">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-bold" style={{ color: '#111' }}>No groups yet</p>
              <p className="text-sm text-muted-foreground mt-1">Groups will appear here once organizers create them.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {allGroups.map((group, i) => {
                const groupEvents = DEMO_GROUP_EVENTS[group.id] || [];
                const previewEvents = groupEvents.slice(0, 2);
                const hasMore = groupEvents.length > 2;
                const sportCat = SPORT_CATEGORIES.find(c => c.id === group.sport) || SPORT_CATEGORIES[1];
                const isDemo = group.name.toLowerCase().includes('demo');

                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                    className={`rounded-2xl border-2 overflow-hidden hover:shadow-lg transition-all relative ${isDemo ? 'opacity-75 bg-muted/40' : 'bg-white'}`}
                    style={{ borderColor: isDemo ? 'rgba(0,0,0,0.08)' : 'rgba(196,122,0,0.14)' }}
                  >
                    {/* Group header */}
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => navigate(`/player/groups/${group.id}`)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2" style={{ borderColor: `${sportCat.color}33` }}>
                          <img
                            src={getGroupThumbnail(group.id)}
                            alt={group.name}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).src = SPORT_PHOTOS.default; }}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-lg leading-tight" style={{ color: '#111' }}>{group.name}</h3>
                            <span
                              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                              style={{ background: sportCat.bg, color: sportCat.color }}
                            >
                              {sportCat.emoji} {group.sport}
                            </span>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#FEF9EC', color: '#C47A00' }}>
                              👥 Community
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{group.description}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {group.memberIds.length} member{group.memberIds.length !== 1 ? 's' : ''} · {groupEvents.length} upcoming event{groupEvents.length !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                          {user && !group.memberIds.includes(user.id) && !joinedGroupIds.has(group.id) ? (
                            <Button
                              size="sm"
                              className="rounded-full font-bold text-xs px-4"
                              style={{ background: '#C47A00', color: '#fff' }}
                              onClick={e => handleJoinGroup(e, group.id)}
                              disabled={joiningGroupId === group.id}
                            >
                              {joiningGroupId === group.id ? (
                                <span className="flex items-center gap-1"><span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Joining...</span>
                              ) : (
                                <span className="flex items-center gap-1"><UserPlus className="h-3 w-3" />Join Group</span>
                              )}
                            </Button>
                          ) : user && (group.memberIds.includes(user.id) || joinedGroupIds.has(group.id)) ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#E8F7EF', color: '#1A7A4A' }}>
                              <Check className="h-3 w-3" /> Joined
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Upcoming events preview */}
                    {previewEvents.length > 0 && (
                      <div className="border-t mx-0">
                        <div className="px-5 py-2 flex items-center justify-between" style={{ background: '#FFFBF0' }}>
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C47A00' }}>
                            Upcoming Sessions
                          </span>
                          <span className="text-[10px] text-muted-foreground">{groupEvents.length} total</span>
                        </div>
                        <div className="divide-y">
                          {previewEvents.map((evt, idx) => (
                            <div
                              key={idx}
                              className="px-5 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors cursor-pointer"
                              onClick={() => navigate(`/player/groups/${group.id}`)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: '#E8F7EF' }}>
                                  <Calendar className="h-3.5 w-3.5" style={{ color: '#1A7A4A' }} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold leading-snug" style={{ color: '#111' }}>{evt.venue}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {evt.date} · {evt.time}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-3">
                                <p className="text-sm font-bold" style={{ color: '#1A7A4A' }}>{evt.price}</p>
                                <p className="text-[10px] text-muted-foreground">{evt.slots} booked</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {hasMore && (
                          <div className="px-5 py-3 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full rounded-xl font-bold text-sm"
                              style={{ color: '#C47A00' }}
                              onClick={() => navigate(`/player/groups/${group.id}`)}
                            >
                              View All {groupEvents.length} Events <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {previewEvents.length === 0 && (
                      <div className="px-5 py-4 border-t text-center">
                        <p className="text-xs text-muted-foreground">No upcoming events yet.</p>
                        <Button variant="link" size="sm" className="text-xs font-bold mt-1" style={{ color: '#C47A00' }} onClick={() => navigate(`/player/groups/${group.id}`)}>
                          View Group Page →
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Special Request CTA ── */}
        <section
          className="p-8 rounded-3xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #1A7A4A 0%, #0d5c35 100%)' }}
        >
          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#fff' }}>Need a specific timing?</h2>
            <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>Can't find a slot? Send a special request to our organizers.</p>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full font-bold"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.1)' }}
              onClick={() => navigate('/player/special-request')}
            >
              <MapPin className="mr-2 h-4 w-4" /> Make a Request
            </Button>
          </div>
        </section>

      </div>
    </div>
  );
}
