import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataService, type Group, type Activity, type ActivitySession, type Ballot } from '../../lib/data';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Calendar, Clock, Users, ArrowRight, UserPlus, Check, Loader2, MapPin, Share2, Copy, Link, Shield, Settings, Megaphone, Eye, EyeOff, Bell, Trash2, Plus, Minus, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isJoining, setIsJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [ballots, setBallots] = useState<Ballot[]>([]);
  const [sessions, setSessions] = useState<Record<string, ActivitySession[]>>({});
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showManagement, setShowManagement] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [announcementText, setAnnouncementText] = useState('');

  const isOwner = !!(user && group && user.id === group.organizer_id);

  useEffect(() => {
    if (!groupId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        // Demo group is now in DB — no special handling needed

        const [grp, acts, members, blts] = await Promise.all([
          dataService.getGroup(groupId),
          dataService.listActivitiesByGroup(groupId),
          dataService.getGroupMembers(groupId),
          dataService.listBallotsByGroup(groupId),
        ]);
        setGroup(grp);
        setActivities(acts);
        setBallots(blts);
        setMemberCount(members.length);

        if (user) {
          const member = await dataService.isGroupMember(user.id, groupId);
          setIsMember(member);
        }

        // Load sessions
        const sessMap: Record<string, ActivitySession[]> = {};
        await Promise.all(acts.map(async (a) => {
          sessMap[a.id] = await dataService.listSessionsByActivity(a.id);
        }));
        setSessions(sessMap);
      } catch (err) {
        console.error('Error loading group:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [groupId, user]);

  const handleJoinGroup = async () => {
    if (!user) { toast.error('Please log in to join a group'); return; }
    if (!groupId) return;
    setIsJoining(true);
    try {
      await dataService.joinGroup(user.id, groupId);
      setIsMember(true);
      setMemberCount(prev => prev + 1);
      toast.success(`You joined ${group?.name}!`);
    } catch (err) {
      toast.error('Failed to join group');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  const today = new Date().toISOString().split('T')[0];
  const upcomingActivities = activities.filter(a => a.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const pastActivities = activities.filter(a => a.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const displayedActivities = tab === 'upcoming' ? upcomingActivities : pastActivities;

  return (
    <div className="flex flex-col w-full">
      {/* Back nav */}
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
        {/* Group banner */}
        {group.image_url && (
          <div className="h-48 rounded-2xl overflow-hidden -mt-4">
            <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Group header */}
        <div className="flex items-start gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold" style={{ color: '#111' }}>{group.name}</h1>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#E8F7EF', color: '#1A7A4A' }}>
                {group.sport}
              </span>
              {isOwner && (
                <span className="text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1" style={{ background: '#FEF9EC', color: '#C47A00' }}>
                  <Shield className="h-3 w-3" /> Owner
                </span>
              )}
            </div>
            {group.description && (
              <p className="text-muted-foreground text-sm mt-1">{group.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {memberCount} member{memberCount !== 1 ? 's' : ''}</span>
            </div>
            {/* Join CTA */}
            {user && !isMember && (
              <div className="mt-3">
                <Button onClick={handleJoinGroup} disabled={isJoining} className="rounded-full font-bold px-6" style={{ background: '#C47A00', color: '#fff' }}>
                  {isJoining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</> : <><UserPlus className="mr-2 h-4 w-4" /> Join This Group</>}
                </Button>
              </div>
            )}
            {user && isMember && (
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" style={{ background: '#E8F7EF', color: '#1A7A4A' }}>
                  <Check className="h-4 w-4" /> You are a member
                </span>
              </div>
            )}
            {/* Share button for group owner */}
            {user && user.id === group.organizer_id && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full font-bold"
                  onClick={() => {
                    const url = `${window.location.origin}/player/groups/${group.id}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Group link copied to clipboard!');
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" /> Share Group Link
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Owner Management Panel */}
        {isOwner && (
          <section className="p-4 rounded-2xl border-2" style={{ borderColor: 'rgba(196,122,0,0.25)', background: '#FFFBF0' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: '#C47A00' }}>
                <Settings className="h-4 w-4" /> Group Management
              </h2>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowManagement(!showManagement)}>
                {showManagement ? 'Hide' : 'Show Controls'}
              </Button>
            </div>
            <AnimatePresence>
              {showManagement && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                  {/* Bulk select activities */}
                  <div>
                    <p className="text-xs font-bold mb-2" style={{ color: '#555' }}>Select activities for bulk actions:</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {activities.map(act => (
                        <label key={act.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/60 px-2 py-1 rounded-lg">
                          <input
                            type="checkbox"
                            checked={selectedActivities.has(act.id)}
                            onChange={() => {
                              setSelectedActivities(prev => {
                                const next = new Set(prev);
                                next.has(act.id) ? next.delete(act.id) : next.add(act.id);
                                return next;
                              });
                            }}
                            className="accent-primary"
                          />
                          <span className="truncate">{act.title}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{new Date(act.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                        </label>
                      ))}
                      {activities.length === 0 && <p className="text-xs text-muted-foreground italic px-2">No activities yet.</p>}
                    </div>
                  </div>

                  {/* Bulk action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => {
                      if (selectedActivities.size === 0) { toast.error('Select at least one activity'); return; }
                      toast.success(`Reminder sent for ${selectedActivities.size} activity(ies)`);
                      setSelectedActivities(new Set());
                    }}>
                      <Bell className="mr-1 h-3 w-3" /> Send Reminders
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={async () => {
                      if (selectedActivities.size === 0) { toast.error('Select at least one activity'); return; }
                      try {
                        await Promise.all(Array.from(selectedActivities).map(id =>
                          supabase.from('activities').update({ status: 'active' }).eq('id', id)
                        ));
                        setActivities(prev => prev.map(a => selectedActivities.has(a.id) ? { ...a, status: 'active' } : a));
                        toast.success(`${selectedActivities.size} activity(ies) set to Public`);
                        setSelectedActivities(new Set());
                      } catch { toast.error('Failed to update'); }
                    }}>
                      <Eye className="mr-1 h-3 w-3" /> Set Public
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={async () => {
                      if (selectedActivities.size === 0) { toast.error('Select at least one activity'); return; }
                      try {
                        await Promise.all(Array.from(selectedActivities).map(id =>
                          supabase.from('activities').update({ status: 'hidden' }).eq('id', id)
                        ));
                        setActivities(prev => prev.map(a => selectedActivities.has(a.id) ? { ...a, status: 'hidden' } : a));
                        toast.success(`${selectedActivities.size} activity(ies) set to Private`);
                        setSelectedActivities(new Set());
                      } catch { toast.error('Failed to update'); }
                    }}>
                      <EyeOff className="mr-1 h-3 w-3" /> Set Private
                    </Button>
                  </div>

                  {/* Announcement to group */}
                  <div>
                    <p className="text-xs font-bold mb-1" style={{ color: '#555' }}>Send announcement to group:</p>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white"
                        placeholder="Type announcement..."
                        value={announcementText}
                        onChange={e => setAnnouncementText(e.target.value)}
                      />
                      <Button size="sm" className="rounded-full" style={{ background: '#1A7A4A', color: '#fff' }} onClick={() => {
                        if (!announcementText.trim()) { toast.error('Enter an announcement'); return; }
                        toast.success('Announcement sent to group members!');
                        setAnnouncementText('');
                      }}>
                        <Megaphone className="mr-1 h-3 w-3" /> Send
                      </Button>
                    </div>
                  </div>

                  {/* Manage members */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => navigate(`/organizer/groups`)}>
                      <Users className="mr-1 h-3 w-3" /> Manage Members
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => navigate(`/organizer/create-event?group=${groupId}`)}>
                      <Plus className="mr-1 h-3 w-3" /> Create Activity
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* Activities */}
        <section>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#1A7A4A' }}>Sessions</p>
            <h2 className="text-lg font-bold" style={{ color: '#111' }}>Group Activities</h2>
          </div>

          <div className="flex gap-2 mb-5">
            {(['upcoming', 'past'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-6 py-2 rounded-full text-sm font-bold border-2 transition-all"
                style={tab === t ? { background: '#1A7A4A', color: '#fff', borderColor: '#1A7A4A' } : { background: 'transparent', color: '#555', borderColor: 'rgba(0,0,0,0.12)' }}>
                {t === 'upcoming' ? `Upcoming (${upcomingActivities.length})` : `Past (${pastActivities.length})`}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }} className="space-y-3">
              {displayedActivities.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border-2 border-dashed bg-muted/10">
                  <span className="text-3xl mb-3 block">{tab === 'upcoming' ? '📅' : '📂'}</span>
                  <p className="font-bold" style={{ color: '#111' }}>{tab === 'upcoming' ? 'No upcoming activities' : 'No past activities'}</p>
                  <p className="text-sm text-muted-foreground mt-1">{tab === 'upcoming' ? 'Check back later for new sessions.' : 'Past sessions will appear here.'}</p>
                </div>
              ) : (
                displayedActivities.map((act, i) => {
                  const actSessions = sessions[act.id] || [];
                  const totalSlots = actSessions.reduce((a, s) => a + s.max_slots, 0);
                  const filledSlots = actSessions.reduce((a, s) => a + s.filled_slots, 0);
                  const fillPct = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;
                  const minPrice = actSessions.length > 0 ? Math.min(...actSessions.map(s => s.price)) : 0;

                  return (
                    <motion.div key={act.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="group p-4 rounded-2xl border-2 bg-white hover:shadow-md transition-all cursor-pointer"
                      style={{ borderColor: tab === 'upcoming' ? 'rgba(26,122,74,0.14)' : 'rgba(0,0,0,0.08)' }}
                      onClick={() => navigate(`/player/events/${act.id}`)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-xl flex-shrink-0" style={{ background: tab === 'upcoming' ? '#E8F7EF' : '#f5f5f5' }}>
                            <Calendar className="h-4 w-4" style={{ color: tab === 'upcoming' ? '#1A7A4A' : '#888' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm leading-snug" style={{ color: '#111' }}>{act.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" /> {act.venue}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" /> {new Date(act.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                            {actSessions.length > 0 && (
                              <div className="mt-2">
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Users className="h-2.5 w-2.5" /> {filledSlots}/{totalSlots} booked
                                  </span>
                                  {tab === 'upcoming' && (
                                    <span className="font-bold" style={{ color: fillPct >= 90 ? '#B91C1C' : '#1A7A4A' }}>
                                      {fillPct >= 100 ? 'Full' : `${totalSlots - filledSlots} left`}
                                    </span>
                                  )}
                                </div>
                                <div className="h-1 rounded-full bg-muted overflow-hidden">
                                  <div className="h-1 rounded-full" style={{ width: `${Math.min(fillPct, 100)}%`, background: tab === 'past' ? '#ccc' : fillPct >= 90 ? '#B91C1C' : '#1A7A4A' }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {actSessions.length > 0 && (
                            <span className="text-base font-bold" style={{ color: tab === 'upcoming' ? '#1A7A4A' : '#888' }}>
                              ${minPrice}
                            </span>
                          )}
                          {tab === 'upcoming' && (
                            <Button size="sm" className="rounded-full px-4 font-bold text-white text-xs" style={{ background: '#1A7A4A' }}>
                              View <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>

          {/* Ballot Sessions in this group */}
          {ballots.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--accent-foreground))' }}>
                Ballot Sessions ({ballots.length})
              </p>
              <div className="space-y-3">
                {ballots.map((ballot, i) => {
                  const isPast = ballot.ballot_deadline < today;
                  return (
                    <motion.div key={ballot.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="group p-4 rounded-2xl border-2 bg-card hover:shadow-md transition-all cursor-pointer"
                      style={{ borderColor: 'hsl(var(--accent) / 0.2)' }}
                      onClick={() => navigate(`/player/ballots/${ballot.id}`)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-xl bg-accent/10">
                            <Shuffle className="h-4 w-4 text-accent" style={isPast ? { opacity: 0.4 } : undefined} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-bold text-sm leading-snug text-foreground">{ballot.activity_name}</p>
                              <Badge variant="outline" className="text-[10px] border-accent/40 text-accent">Ballot</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" /> {ballot.location}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" /> Deadline: {new Date(ballot.ballot_deadline).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Users className="h-3 w-3" /> {ballot.slots} slots
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge variant={isPast ? 'secondary' : 'default'} className="text-xs">
                            {isPast ? 'Closed' : 'Open'}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Members preview */}
        <section>
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#C47A00' }}>Community</p>
            <h2 className="text-lg font-bold" style={{ color: '#111' }}>Members ({memberCount})</h2>
          </div>
          <div className="flex -space-x-2">
            {Array.from({ length: Math.min(memberCount, 8) }).map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-xs font-bold text-primary">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
            {memberCount > 8 && (
              <div className="w-10 h-10 rounded-full bg-muted border-2 border-white flex items-center justify-center text-xs font-bold text-muted-foreground">
                +{memberCount - 8}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
