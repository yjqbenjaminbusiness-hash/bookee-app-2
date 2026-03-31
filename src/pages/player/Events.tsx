import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService, type Activity, type ActivitySession, type Group } from '../../lib/data';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Search, ArrowRight, Users, Star, Calendar, MapPin, ChevronRight, Clock, UserPlus, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const SPORT_CATEGORIES = [
  { id: 'all', label: 'All Sports', emoji: '🏅', color: '#1A7A4A', bg: '#E8F7EF' },
  { id: 'Badminton', label: 'Badminton', emoji: '🏸', color: '#1A7A4A', bg: '#E8F7EF' },
  { id: 'Basketball', label: 'Basketball', emoji: '🏀', color: '#C47A00', bg: '#FEF9EC' },
  { id: 'Pickleball', label: 'Pickleball', emoji: '🎾', color: '#1A6FA8', bg: '#E6F0FA' },
  { id: 'Soccer', label: 'Soccer', emoji: '⚽', color: '#7C3AED', bg: '#F3F0FF' },
  { id: 'Swimming', label: 'Swimming', emoji: '🏊', color: '#0891B2', bg: '#ECFEFF' },
  { id: 'Volleyball', label: 'Volleyball', emoji: '🏐', color: '#D97706', bg: '#FFFBEB' },
  { id: 'Running', label: 'Running', emoji: '🏃', color: '#059669', bg: '#ECFDF5' },
  { id: 'Tennis', label: 'Tennis', emoji: '🎾', color: '#7C3AED', bg: '#F3F0FF' },
];

const SPORT_PHOTOS: Record<string, string> = {
  Badminton: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800&q=80',
  Basketball: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80',
  Pickleball: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80',
  Soccer: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  Swimming: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&q=80',
  Volleyball: 'https://images.unsplash.com/photo-1592656094267-764a45159575?w=800&q=80',
  Running: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
  Tennis: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
};

function getEventPhoto(sport: string, imageUrl?: string | null): string {
  if (imageUrl) return imageUrl;
  return SPORT_PHOTOS[sport] || SPORT_PHOTOS.default;
}

export default function PlayerEvents() {
  const [selectedSport, setSelectedSport] = useState('all');
  const [search, setSearch] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sessions, setSessions] = useState<Record<string, ActivitySession[]>>({});
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMap, setGroupMap] = useState<Record<string, Group>>({});
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showDemo, setShowDemo] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [acts, grps] = await Promise.all([
          dataService.listActivities(),
          dataService.listGroups(),
        ]);
        setActivities(acts);
        setGroups(grps);

        // Load sessions for all activities
        const sessMap: Record<string, ActivitySession[]> = {};
        await Promise.all(acts.map(async (a) => {
          sessMap[a.id] = await dataService.listSessionsByActivity(a.id);
        }));
        setSessions(sessMap);

        // Check group membership
        if (user) {
          const userGroups = await dataService.listGroupsForUser(user.id);
          setJoinedGroupIds(new Set(userGroups.map(g => g.id)));
        }
      } catch (err) {
        console.error('Error loading explore data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleJoinGroup = async (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    if (!user) { toast.error('Please log in to join a group'); return; }
    if (joinedGroupIds.has(groupId)) { toast.info('You are already a member of this group'); return; }
    setJoiningGroupId(groupId);
    try {
      await dataService.joinGroup(user.id, groupId);
      setJoinedGroupIds(prev => new Set([...prev, groupId]));
      const group = groups.find(g => g.id === groupId);
      toast.success(`Joined ${group?.name || 'group'}!`);
    } catch (err) {
      toast.error('Failed to join group');
    } finally {
      setJoiningGroupId(null);
    }
  };

  const filteredActivities = activities.filter(a => {
    const matchesSport = selectedSport === 'all' || a.sport === selectedSport;
    const matchesSearch = !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.venue.toLowerCase().includes(search.toLowerCase()) ||
      a.sport.toLowerCase().includes(search.toLowerCase());
    return matchesSport && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
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
        {/* Public Activities */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#1A7A4A' }}>Open to Everyone</p>
              <h2 className="text-xl font-bold" style={{ color: '#111' }}>Public Activities</h2>
            </div>
            <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-muted/60 font-medium">
              {filteredActivities.length} session{filteredActivities.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Sport filter */}
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-3 mb-6 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {SPORT_CATEGORIES.map(sport => (
              <button key={sport.id} onClick={() => setSelectedSport(sport.id)}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all hover:scale-105 active:scale-95"
                style={selectedSport === sport.id
                  ? { background: sport.color, color: '#fff', borderColor: sport.color }
                  : { background: sport.bg, color: sport.color, borderColor: `${sport.color}33` }}>
                <span>{sport.emoji}</span>
                <span>{sport.label}</span>
              </button>
            ))}
          </div>

          {/* Activities grid */}
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border-2 border-dashed bg-muted/20">
              <span className="text-4xl mb-3">🔍</span>
              <h3 className="font-bold text-lg" style={{ color: '#111' }}>No activities found</h3>
              <p className="text-muted-foreground text-sm mt-1">Try a different sport or clear your search.</p>
              <Button variant="link" className="mt-3 text-primary font-bold" onClick={() => { setSearch(''); setSelectedSport('all'); }}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredActivities.map((activity, i) => {
                const actSessions = sessions[activity.id] || [];
                const minPrice = actSessions.length > 0 ? Math.min(...actSessions.map(s => s.price)) : 0;
                const totalSpots = actSessions.reduce((a, s) => a + s.max_slots, 0);
                const takenSpots = actSessions.reduce((a, s) => a + s.filled_slots, 0);
                const fillPct = totalSpots > 0 ? (takenSpots / totalSpots) * 100 : 0;
                const sportCat = SPORT_CATEGORIES.find(c => c.id === activity.sport) || SPORT_CATEGORIES[0];

                return (
                  <motion.div key={activity.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="group rounded-2xl border-2 overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-white"
                    style={{ borderColor: 'rgba(26,122,74,0.10)' }}
                    onClick={() => navigate(`/player/events/${activity.id}`)}>
                    <div className="relative h-44 overflow-hidden bg-muted">
                      <img src={getEventPhoto(activity.sport, activity.image_url)} alt={activity.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { (e.target as HTMLImageElement).src = SPORT_PHOTOS.default; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: sportCat.bg, color: sportCat.color }}>
                        {sportCat.emoji} {activity.sport}
                      </span>
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.92)', color: '#1A7A4A' }}>
                        🌐 Public
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-base leading-snug" style={{ color: '#111' }}>{activity.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {activity.venue}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(activity.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      {actSessions.length > 0 && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {takenSpots}/{totalSpots} booked</span>
                            <span className="font-bold" style={{ color: fillPct >= 90 ? '#B91C1C' : fillPct >= 60 ? '#C47A00' : '#1A7A4A' }}>
                              {fillPct >= 90 ? 'Almost full' : `${totalSpots - takenSpots} left`}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-1.5 rounded-full transition-all"
                              style={{ width: `${fillPct}%`, background: fillPct >= 90 ? '#B91C1C' : fillPct >= 60 ? '#C47A00' : '#1A7A4A' }} />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          {actSessions.length > 0 && <>
                            <span className="text-xs text-muted-foreground">from </span>
                            <span className="text-lg font-bold" style={{ color: '#111' }}>${minPrice}</span>
                          </>}
                        </div>
                        <Button size="sm" className="rounded-full px-5 font-bold text-white hover:scale-105 transition-transform" style={{ background: '#1A7A4A' }}
                          onClick={e => { e.stopPropagation(); navigate(`/player/events/${activity.id}`); }}>
                          View <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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

        {/* Groups */}
        <section>
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#C47A00' }}>Community Specific</p>
            <h2 className="text-xl font-bold" style={{ color: '#111' }}>Groups</h2>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border-2 border-dashed bg-muted/10">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-bold" style={{ color: '#111' }}>No groups yet</p>
              <p className="text-sm text-muted-foreground mt-1">Groups will appear here once organizers create them.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((group, i) => {
                const sportCat = SPORT_CATEGORIES.find(c => c.id === group.sport) || SPORT_CATEGORIES[0];
                return (
                  <motion.div key={group.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                    className="rounded-2xl border-2 overflow-hidden hover:shadow-lg transition-all bg-white"
                    style={{ borderColor: 'rgba(196,122,0,0.14)' }}>
                    <div className="p-5 cursor-pointer" onClick={() => navigate(`/player/groups/${group.id}`)}>
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 bg-muted flex items-center justify-center text-2xl font-bold text-primary"
                          style={{ borderColor: `${sportCat.color}33` }}>
                          {group.image_url ? (
                            <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
                          ) : (
                            group.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-lg leading-tight" style={{ color: '#111' }}>{group.name}</h3>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: sportCat.bg, color: sportCat.color }}>
                              {sportCat.emoji} {group.sport}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{group.description}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {group.member_count || 0} member{(group.member_count || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                          {user && !joinedGroupIds.has(group.id) ? (
                            <Button size="sm" className="rounded-full font-bold text-xs px-4" style={{ background: '#C47A00', color: '#fff' }}
                              onClick={e => handleJoinGroup(e, group.id)}
                              disabled={joiningGroupId === group.id}>
                              {joiningGroupId === group.id ? (
                                <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Joining...</span>
                              ) : (
                                <span className="flex items-center gap-1"><UserPlus className="h-3 w-3" />Join Group</span>
                              )}
                            </Button>
                          ) : user && joinedGroupIds.has(group.id) ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#E8F7EF', color: '#1A7A4A' }}>
                              <Check className="h-3 w-3" /> Joined
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Special Request CTA */}
        <section className="p-8 rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #1A7A4A 0%, #0d5c35 100%)' }}>
          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#fff' }}>Need a specific timing?</h2>
            <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>Can't find a slot? Send a special request to our organizers.</p>
            <Button size="lg" variant="outline" className="rounded-full font-bold"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.1)' }}
              onClick={() => navigate('/player/special-request')}>
              <MapPin className="mr-2 h-4 w-4" /> Make a Request
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
