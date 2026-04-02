import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { dataService, type Group, type Activity, type ActivitySession } from '../../lib/data';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Clock, Shuffle, CalendarDays, Plus, ChevronDown, ChevronRight, Users, MapPin, Calendar, ArrowRight, Loader2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function OrganizeLanding() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activitiesByGroup, setActivitiesByGroup] = useState<Record<string, Activity[]>>({});
  const [sessionsByActivity, setSessionsByActivity] = useState<Record<string, ActivitySession[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  if (!isAuthenticated) {
    navigate('/login?redirect=/organize');
    return null;
  }

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const grps = await dataService.listGroupsByOrganizer(user.id);
        setGroups(grps);

        const actMap: Record<string, Activity[]> = {};
        const sessMap: Record<string, ActivitySession[]> = {};
        await Promise.all(grps.map(async (g) => {
          const acts = await dataService.listActivitiesByGroup(g.id);
          actMap[g.id] = acts.sort((a, b) => a.date.localeCompare(b.date));
          await Promise.all(acts.map(async (a) => {
            sessMap[a.id] = await dataService.listSessionsByActivity(a.id);
          }));
        }));
        setActivitiesByGroup(actMap);
        setSessionsByActivity(sessMap);
      } catch (err) {
        console.error('Failed to load organizer data:', err);
        toast.error('Failed to load your groups');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  const createOptions = [
    { title: 'Activity', icon: Clock, route: '/organizer/create-event' },
    { title: 'Ballot', icon: Shuffle, route: '/organizer/create-ballot' },
    { title: 'Event', icon: CalendarDays, route: '/organizer/create-event?type=event' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Organize</h1>
          <p className="text-muted-foreground mt-1">Manage your groups and activities</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/organizer/groups')}
            className="rounded-full"
          >
            <Settings className="mr-2 h-4 w-4" /> Manage Groups
          </Button>
          <Button
            onClick={() => navigate('/organizer/groups')}
            className="rounded-full"
            style={{ background: '#1A7A4A', color: '#fff' }}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Group
          </Button>
        </div>
      </div>

      {/* Quick Create */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Quick Create</p>
        <div className="flex gap-3">
          {createOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <Button
                key={opt.title}
                variant="outline"
                className="rounded-full"
                onClick={() => navigate(opt.route)}
              >
                <Icon className="mr-2 h-4 w-4" /> {opt.title}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed bg-muted/10">
          <span className="text-4xl mb-4 block">📋</span>
          <p className="font-bold text-foreground text-lg">No groups yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create a group to start organizing activities</p>
          <Button onClick={() => navigate('/organizer/groups')} style={{ background: '#1A7A4A', color: '#fff' }} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" /> Create Your First Group
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Your Groups ({groups.length})
          </p>
          {groups.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const groupActivities = activitiesByGroup[group.id] || [];
            const today = new Date().toISOString().split('T')[0];
            const upcoming = groupActivities.filter(a => a.date >= today);

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border-2 overflow-hidden bg-card transition-all"
                style={{ borderColor: isExpanded ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))' }}
              >
                {/* Group Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleGroup(group.id)}
                >
                  {/* Group image or placeholder */}
                  {group.image_url ? (
                    <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground truncate">{group.name}</p>
                      <Badge variant="secondary" className="text-xs">{group.sport}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {group.member_count || 0} members · {upcoming.length} upcoming
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs rounded-full"
                      onClick={(e) => { e.stopPropagation(); navigate(`/player/groups/${group.id}`); }}
                    >
                      View Page
                    </Button>
                    {isExpanded
                      ? <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      : <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    }
                  </div>
                </div>

                {/* Expanded Activities */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t px-4 pb-4 pt-3 bg-muted/10 space-y-2">
                        {/* Create inside group */}
                        <div className="flex gap-2 mb-3">
                          {createOptions.map((opt) => {
                            const Icon = opt.icon;
                            return (
                              <Button
                                key={opt.title}
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs"
                                onClick={() => navigate(`${opt.route}${opt.route.includes('?') ? '&' : '?'}group=${group.id}`)}
                              >
                                <Icon className="mr-1 h-3 w-3" /> {opt.title}
                              </Button>
                            );
                          })}
                        </div>

                        {groupActivities.length === 0 ? (
                          <div className="text-center py-6 rounded-xl border border-dashed bg-background">
                            <p className="text-sm text-muted-foreground">No activities in this group yet</p>
                          </div>
                        ) : (
                          groupActivities.map((act) => {
                            const actSessions = sessionsByActivity[act.id] || [];
                            const totalSlots = actSessions.reduce((a, s) => a + s.max_slots, 0);
                            const filledSlots = actSessions.reduce((a, s) => a + s.filled_slots, 0);
                            const isPast = act.date < today;

                            return (
                              <div
                                key={act.id}
                                className="flex items-center gap-3 p-3 rounded-xl border bg-background hover:shadow-sm transition-all cursor-pointer"
                                onClick={() => navigate(`/player/events/${act.id}`)}
                              >
                                <div className="p-2 rounded-lg flex-shrink-0" style={{ background: isPast ? '#f5f5f5' : 'hsl(var(--primary) / 0.08)' }}>
                                  <Calendar className="h-4 w-4" style={{ color: isPast ? '#888' : 'hsl(var(--primary))' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-foreground truncate">{act.title}</p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(act.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" /> {act.venue}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" /> {filledSlots}/{totalSlots}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge variant={isPast ? 'secondary' : 'default'} className="text-xs">
                                    {isPast ? 'Past' : act.status === 'active' ? 'Active' : act.status}
                                  </Badge>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
