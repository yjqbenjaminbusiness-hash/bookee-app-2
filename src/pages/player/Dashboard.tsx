import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { dataService, type Activity, type ActivitySession, type Group } from '../../lib/data';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Calendar, Clock, ChevronRight, Activity as ActivityIcon, Zap, User, TrendingUp, Loader2, Users, CheckCircle2, Eye, EyeOff, MapPin } from 'lucide-react';

export default function PlayerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDemo, setShowDemo] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [bk, grps] = await Promise.all([
          dataService.listBookingsByUser(user.id),
          dataService.listGroupsForUser(user.id),
        ]);
        setBookings(bk);
        setGroups(grps);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#1A7A4A' }} />
      </div>
    );
  }

  const confirmed = bookings.filter(b => b.reservation_status === 'confirmed').length;
  const today = new Date().toISOString().split('T')[0];

  const enriched = bookings.map(b => {
    const session = b.activity_sessions;
    const activity = session?.activities;
    return {
      id: b.id,
      activityId: activity?.id,
      title: activity?.title || 'Unknown',
      venue: activity?.venue || 'Unknown',
      timeLabel: session?.time_label || '',
      date: activity?.date || '',
      isPast: activity ? activity.date < today : false,
      status: b.reservation_status,
      amount: b.amount || 0,
      groupName: null as string | null, // Could enrich later
    };
  });

  const upcomingGames = enriched.filter(b => !b.isPast).sort((a, b) => a.date.localeCompare(b.date));
  const pastGames = enriched.filter(b => b.isPast);
  const displayedGames = activeTab === 'upcoming' ? upcomingGames : pastGames;

  // Demo data
  const demoGroup = dataService.getDemoGroup();
  const demoActivity = dataService.getDemoActivity();

  // All groups including demo
  const allGroups = showDemo ? [...groups, demoGroup] : groups;

  return (
    <div className="container py-10 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold" style={{ color: '#111' }}>My Bookee</h1>
          <p className="text-muted-foreground">Welcome back, {user.displayName || 'Athlete'}!</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all hover:bg-muted"
            style={{ color: showDemo ? '#888' : '#1A7A4A' }}
          >
            {showDemo ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showDemo ? 'Hide Demo' : 'Show Demo'}
          </button>
          <Button size="lg" className="rounded-full shadow-elegant px-8 font-bold" style={{ background: '#1A7A4A', color: '#fff' }}
            onClick={() => navigate('/player/events')}>
            <Zap className="mr-2 h-5 w-5" /> Find a Game
          </Button>
        </div>
      </div>

      {/* My Groups - horizontal scroll */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#111' }}>
            <Users className="h-5 w-5" style={{ color: '#1A7A4A' }} /> My Groups
          </h2>
          <Button variant="ghost" size="sm" className="text-primary font-bold" onClick={() => navigate('/player/my-groups')}>
            Discover Groups <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {allGroups.length === 0 ? (
          <Card className="p-10 text-center border-dashed bg-white/50">
            <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-bold text-lg">No groups yet</p>
            <p className="text-sm text-muted-foreground mb-4">Join a community to see group activities.</p>
            <Button size="sm" variant="outline" className="rounded-full font-bold" onClick={() => navigate('/player/my-groups')}>
              Find Groups
            </Button>
          </Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {allGroups.map(group => {
              const isDemo = group.id === 'demo-group-001';
              return (
                <div
                  key={group.id}
                  className={`flex-shrink-0 w-64 rounded-2xl border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg ${isDemo ? 'opacity-60 border-dashed' : 'border-primary/10'}`}
                  style={isDemo ? { background: '#f5f5f5' } : {}}
                  onClick={() => !isDemo && navigate(`/player/groups/${group.id}`)}
                >
                  {/* Banner */}
                  <div className="h-24 overflow-hidden bg-muted relative">
                    {group.image_url ? (
                      <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary/20" style={{ background: 'linear-gradient(135deg, #E8F7EF, #C8E8F8)' }}>
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isDemo && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-white">DEMO</span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm truncate" style={{ color: '#111' }}>{group.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{group.sport} • {group.member_count || 0} members</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* My Bookee - Activities */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#111' }}>
            <ActivityIcon className="h-5 w-5" style={{ color: '#1A7A4A' }} /> My Bookee
          </h2>
          <div className="flex bg-muted p-1 rounded-full w-fit">
            <button onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'upcoming' ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              style={activeTab === 'upcoming' ? { background: '#1A7A4A' } : {}}>
              Upcoming ({upcomingGames.length})
            </button>
            <button onClick={() => setActiveTab('past')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'past' ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              style={activeTab === 'past' ? { background: '#1A7A4A' } : {}}>
              Past ({pastGames.length})
            </button>
          </div>
        </div>

        {/* Demo activity card */}
        {showDemo && activeTab === 'upcoming' && (
          <div className="mb-4 p-5 rounded-2xl border-2 border-dashed opacity-50" style={{ background: '#f9f9f9' }}>
            <div className="flex justify-between items-center gap-4">
              <div className="flex gap-4 items-center">
                <div className="p-3 rounded-2xl" style={{ background: '#e5e5e5' }}>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base" style={{ color: '#555' }}>{demoActivity.title}</h3>
                    <Badge className="text-[9px]" style={{ background: '#888', color: '#fff', border: 'none' }}>DEMO</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> {demoActivity.venue} • <Calendar className="h-3 w-3" /> 31 Dec 2033
                  </p>
                  <p className="text-xs text-muted-foreground">Group: {demoGroup.name}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Horizontal scroll for activities */}
        {displayedGames.length === 0 && !showDemo ? (
          <Card className="p-16 text-center border-dashed bg-white/50">
            <div className="p-4 rounded-full bg-[#C8E8F8]/40 w-fit mx-auto mb-4">
              <Calendar className="h-8 w-8" style={{ color: '#1B5F8C', opacity: 0.4 }} />
            </div>
            <h3 className="font-bold text-lg" style={{ color: '#111' }}>No {activeTab} bookings</h3>
            <p className="text-muted-foreground mb-6">
              {activeTab === 'upcoming' ? "You don't have any upcoming games." : "Past games will appear here."}
            </p>
            <Button className="rounded-full px-8 font-bold" style={{ background: '#1A7A4A', color: '#fff' }}
              onClick={() => navigate('/player/events')}>
              Explore Activities
            </Button>
          </Card>
        ) : displayedGames.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {displayedGames.map(b => (
              <div key={b.id}
                className="flex-shrink-0 w-72 p-5 rounded-2xl border-2 bg-white hover:border-[#1A7A4A]/40 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => b.activityId && navigate(`/player/events/${b.activityId}`)}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-xl"
                      style={{ background: b.status === 'confirmed' ? '#E8F7EF' : '#FEF3C7', color: b.status === 'confirmed' ? '#1A7A4A' : '#C47A00' }}>
                      {b.status === 'confirmed' ? (b.isPast ? <CheckCircle2 className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />) : <Clock className="h-5 w-5" />}
                    </div>
                    <Badge style={{ background: b.status === 'confirmed' ? '#1A7A4A' : '#C47A00', color: '#fff', border: 'none' }}>
                      {b.status?.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: '#111' }}>{b.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {b.date ? new Date(b.date).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {b.timeLabel}
                    </p>
                  </div>
                  <div className="text-lg font-bold" style={{ color: '#111' }}>${b.amount}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
        <Card className="border-2 bg-[#C8E8F8]/40 border-[#1B5F8C]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest" style={{ color: '#1B5F8C' }}>Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" style={{ color: '#1B5F8C' }}>{bookings.length}</div>
          </CardContent>
        </Card>
        <Card className="border-2 bg-[#E8F7EF] border-[#1A7A4A]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest" style={{ color: '#1A7A4A' }}>Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" style={{ color: '#1A7A4A' }}>{confirmed}</div>
          </CardContent>
        </Card>
        <Card className="border-2 bg-[#FEF3C7] border-[#C47A00]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest" style={{ color: '#C47A00' }}>Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" style={{ color: '#C47A00' }}>{bookings.length - confirmed}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
