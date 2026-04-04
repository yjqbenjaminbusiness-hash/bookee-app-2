import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { dataService, type Activity, type ActivitySession, type Group } from '../../lib/data';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Calendar, Users, ArrowRight, Activity as ActivityIcon, Loader2, Star, UsersRound } from 'lucide-react';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sessions, setSessions] = useState<Record<string, ActivitySession[]>>({});
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [acts, grps] = await Promise.all([
          dataService.listActivitiesByOrganizer(user.id),
          dataService.listGroupsByOrganizer(user.id),
        ]);
        setActivities(acts);
        setGroups(grps);

        const sessMap: Record<string, ActivitySession[]> = {};
        await Promise.all(acts.map(async (a) => {
          sessMap[a.id] = await dataService.listSessionsByActivity(a.id);
        }));
        setSessions(sessMap);
      } catch (err) {
        console.error('Error loading organizer dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#C47A00' }} />
      </div>
    );
  }

  const totalBookings = Object.values(sessions).flat().reduce((acc, s) => acc + s.filled_slots, 0);

  return (
    <div className="container py-10 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold" style={{ color: '#111' }}>My Bookee</h1>
          <p className="text-muted-foreground">Welcome back, {user.displayName}. Manage your communities.</p>
        </div>
        <Button size="lg" className="rounded-full shadow-elegant px-8 font-bold" style={{ background: '#C47A00', color: '#fff' }}
          onClick={() => navigate('/organize')}>
          <Plus className="mr-2 h-5 w-5" /> Create New
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="border-2 bg-[#C8E8F8]/40 border-[#1B5F8C]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1B5F8C' }}>Active Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: '#1B5F8C' }}>{activities.length}</div>
          </CardContent>
        </Card>
        <Card className="border-2 bg-[#E8F7EF] border-[#1A7A4A]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A7A4A' }}>Total Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: '#1A7A4A' }}>{totalBookings}</div>
          </CardContent>
        </Card>
        <Card className="border-2 bg-white border-border cursor-pointer hover:shadow-elegant hover:border-[#C47A00]/30 transition-all"
          onClick={() => navigate('/organizer/groups')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#C47A00' }}>
              <UsersRound className="h-3.5 w-3.5" /> My Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold" style={{ color: '#C47A00' }}>{groups.length}</div>
              <ArrowRight className="h-4 w-4" style={{ color: '#C47A00' }} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 bg-[#FEF3C7] border-[#C47A00]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C47A00' }}>Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: '#C47A00' }}>{Object.values(sessions).flat().length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activities list */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#111' }}>
            <ActivityIcon className="h-6 w-6" style={{ color: '#C47A00' }} /> My Activities
          </h2>
        </div>

        {activities.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed bg-white/50">
            <div className="p-6 rounded-3xl bg-[#C8E8F8]/40 w-fit mx-auto mb-6">
              <Calendar className="h-12 w-12" style={{ color: '#1B5F8C', opacity: 0.4 }} />
            </div>
            <h3 className="text-2xl font-bold" style={{ color: '#1B5F8C' }}>No activities created yet</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Start hosting sports sessions and build your community today.</p>
            <Button size="lg" className="rounded-full px-10 font-bold" style={{ background: '#C47A00', color: '#fff' }}
              onClick={() => navigate('/organize')}>
              Host Your First Session
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {activities.map(activity => {
              const actSessions = sessions[activity.id] || [];
              const totalCap = actSessions.reduce((a, s) => a + s.max_slots, 0);
              const filledCap = actSessions.reduce((a, s) => a + s.filled_slots, 0);
              const pct = totalCap > 0 ? Math.round((filledCap / totalCap) * 100) : 0;
              const linkedGroup = activity.group_id ? groups.find(g => g.id === activity.group_id) : null;

              return (
                <Card key={activity.id} className="group overflow-hidden hover:shadow-elegant transition-all bg-white border-2 border-border hover:border-[#C47A00]/30">
                  {activity.image_url && (
                    <div className="h-32 overflow-hidden">
                      <img src={activity.image_url} alt={activity.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="bg-[#C8E8F8]/20 pb-6 relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge style={{ background: '#1A7A4A', color: '#fff', border: 'none' }}>
                          {activity.status?.toUpperCase() || 'ACTIVE'}
                        </Badge>
                        {linkedGroup && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#E8F7EF', color: '#1A7A4A' }}>
                            {linkedGroup.name}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xl font-bold" style={{ color: '#1A7A4A' }}>{pct}%</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Filled</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl line-clamp-1 font-bold" style={{ color: '#111' }}>{activity.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 font-medium">
                      <Calendar className="h-3 w-3" style={{ color: '#C47A00' }} />
                      {new Date(activity.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                      {activity.venue && <> · {activity.venue}</>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-6">
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Attendance</span>
                        <span>{filledCap} / {totalCap} Players</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#1A7A4A' }} />
                      </div>
                      <div className="pt-2 flex gap-4">
                        <div className="flex-1 p-2 rounded-xl bg-[#C8E8F8]/40 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: '#1B5F8C' }}>Sessions</p>
                          <p className="font-bold" style={{ color: '#1B5F8C' }}>{actSessions.length}</p>
                        </div>
                        <div className="flex-1 p-2 rounded-xl bg-[#E8F7EF] text-center">
                          <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: '#1A7A4A' }}>Sport</p>
                          <p className="font-bold text-sm" style={{ color: '#1A7A4A' }}>{activity.sport}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 border-t bg-white">
                    <Button size="sm" className="w-full rounded-full font-bold shadow-sm" style={{ background: '#C47A00', color: '#fff' }}
                      onClick={() => navigate(`/organizer/events/${activity.id}`)}>
                      Manage
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
