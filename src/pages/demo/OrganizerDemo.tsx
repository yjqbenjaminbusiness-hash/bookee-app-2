import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Plus,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  MessageSquare,
  Search,
  MoreVertical,
  CreditCard,
  UserCheck,
  UserX,
  ShieldCheck,
  Star
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { DEMO_ACTIVITIES, DemoActivity } from '../../lib/demoData';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function OrganizerDemo() {
  const [searchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as 'management' | 'my-bookee') || 'management';
  const [activities, setActivities] = useState<DemoActivity[]>(DEMO_ACTIVITIES);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'management' | 'my-bookee'>(initialView);
  const navigate = useNavigate();

  const upcomingActivities = activities.filter(a => a.status !== 'past');
  const pastActivities = activities.filter(a => a.status === 'past');

  const handleTogglePayment = (activityId: string, playerId: string) => {
    setActivities(prev => prev.map(a => {
      if (a.id === activityId) {
        return {
          ...a,
          players: a.players.map(p => {
            if (p.id === playerId) {
              return { ...p, status: p.status === 'paid' ? 'pending' : 'paid' };
            }
            return p;
          })
        };
      }
      return a;
    }));
    toast.success('Payment status updated');
  };

  const handleToggleWaitlist = (activityId: string, playerId: string) => {
    // Promotion logic simulation
    toast.success('Player promoted from waitlist!');
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Top Banner Simulation */}
      <div className="bg-[#1A7A4A] text-white pt-12 pb-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="container max-w-5xl relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-2xl border border-white/30 shadow-lg">
                A
              </div>
              <div>
                <h1 className="font-bold text-2xl tracking-tight">Alex Organizer</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-white/20 text-white border-none text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">Verified</Badge>
                  <span className="text-white/60 text-xs font-medium">Joined Jan 2026</span>
                </div>
              </div>
            </div>
            <Button className="rounded-full bg-white text-[#1A7A4A] font-bold hover:bg-white/90 shadow-xl border-none h-12 px-6">
              <Plus className="mr-2 h-5 w-5" /> Host Activity
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Revenue', value: '$1,240', icon: CreditCard, color: '#7FFFC4' },
              { label: 'Total Players', value: '42', icon: Users, color: '#7FFFC4' },
              { label: 'Active Games', value: upcomingActivities.length, icon: Calendar, color: '#7FFFC4' },
              { label: 'Avg Rating', value: '4.9', icon: Star, color: '#FBBF24' },
            ].map(stat => (
              <div key={stat.label} className="p-4 rounded-3xl bg-black/20 backdrop-blur-md border border-white/10 group hover:bg-black/30 transition-colors">
                <stat.icon className="h-4 w-4 mb-2 opacity-70 group-hover:scale-110 transition-transform" style={{ color: stat.color }} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-5xl px-4 -mt-12 space-y-8 relative z-20">
        {/* Navigation Tabs */}
        <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-lg max-w-sm mx-auto">
          <button 
            onClick={() => setActiveView('management')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'management' ? 'bg-[#1A7A4A] text-white shadow-md' : 'text-muted-foreground hover:bg-white/50'}`}
          >
            Management
          </button>
          <button 
            onClick={() => setActiveView('my-bookee')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'my-bookee' ? 'bg-[#1A7A4A] text-white shadow-md' : 'text-muted-foreground hover:bg-white/50'}`}
          >
            My Bookee
          </button>
        </div>

        {activeView === 'management' ? (
          <>
            {/* Active Activities Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#1A7A4A]" /> Timeslot Checklist
                </h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs font-bold text-primary" onClick={() => navigate('/demo/chat?role=organizer&action=explore')}>Explore Activities</Button>
                  <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs font-bold text-primary" onClick={() => setActiveView('my-bookee')}>My Bookee</Button>
                  <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest">Filter</Button>
                </div>
              </div>

              <div className="space-y-4">
                {upcomingActivities.map(activity => (
                  <Card 
                    key={activity.id} 
                    className={`overflow-hidden transition-all duration-300 border-2 ${expandedId === activity.id ? 'border-primary/40 shadow-2xl ring-4 ring-primary/5' : 'border-white hover:border-primary/20 shadow-md'}`}
                  >
                    {/* Collapsed View / Header */}
                    <div 
                      className={`p-5 flex items-center justify-between cursor-pointer ${expandedId === activity.id ? 'bg-primary/5' : 'bg-white'}`}
                      onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-xl shadow-inner">
                          {activity.sport === 'Badminton' ? '🏸' : activity.sport === 'Basketball' ? '🏀' : '🎾'}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-none mb-1">{activity.sport} – {activity.venue}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                            <Calendar className="h-3.5 w-3.5" /> {activity.date} <span className="opacity-20">•</span> <Clock className="h-3.5 w-3.5" /> {activity.time}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                          <p className="text-xs font-bold uppercase tracking-tighter text-muted-foreground mb-1">Slots Filled</p>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${activity.slots >= activity.maxSlots ? 'bg-amber-500' : 'bg-primary'}`} 
                                style={{ width: `${(activity.slots / activity.maxSlots) * 100}%` }}
                              />
                            </div>
                            <span className={`text-sm font-bold ${activity.slots >= activity.maxSlots ? 'text-amber-600' : 'text-primary'}`}>
                              {activity.slots}/{activity.maxSlots}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          {expandedId === activity.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded View */}
                    <AnimatePresence>
                      {expandedId === activity.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t overflow-hidden bg-white"
                        >
                          <div className="p-6 space-y-8">
                            {/* Player List */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                  <Users className="h-3.5 w-3.5" /> Player Attendance
                                </h4>
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">
                                  {activity.players.length} Signed Up
                                </Badge>
                              </div>
                              
                              <div className="grid gap-3">
                                {activity.players.map(player => (
                                  <div key={player.id} className="flex items-center justify-between p-4 rounded-2xl border bg-muted/10 group hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center font-bold text-sm shadow-sm">
                                        {player.name.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm">{player.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1">
                                          <ShieldCheck className="h-3 w-3 text-primary" /> Regular Player
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-right hidden sm:block">
                                        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground">Payment</p>
                                        <p className={`text-[10px] font-bold ${player.status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                                          {player.status.toUpperCase()}
                                        </p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className={`h-9 w-9 rounded-xl ${player.status === 'paid' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-amber-100 text-amber-600 hover:bg-amber-200 shadow-sm'}`}
                                          onClick={() => handleTogglePayment(activity.id, player.id)}
                                          title={player.status === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
                                        >
                                          {player.status === 'paid' ? <UserCheck className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted">
                                          <MessageSquare className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive">
                                          <UserX className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Waitlist */}
                            {activity.waitlist.length > 0 && (
                              <div className="space-y-4 pt-6 border-t">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5" /> Waitlist Members
                                  </h4>
                                  <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                                    {activity.waitlist.length} Waiting
                                  </Badge>
                                </div>
                                <div className="grid gap-2">
                                  {activity.waitlist.map((player, idx) => (
                                    <div key={player.id} className="flex items-center justify-between p-3 rounded-xl border border-dashed bg-amber-50/30">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                                          #{idx + 1}
                                        </div>
                                        <p className="font-bold text-sm">{player.name}</p>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-8 rounded-lg text-xs font-bold border-amber-200 text-amber-700 hover:bg-amber-100"
                                        onClick={() => handleToggleWaitlist(activity.id, player.id)}
                                      >
                                        Promote to Slot
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions Footer */}
                            <div className="flex flex-wrap gap-3 pt-6 border-t">
                              <Button className="rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                <Settings className="h-4 w-4 mr-2" /> Manage Slots
                              </Button>
                              <Button className="rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                <TrendingUp className="h-4 w-4 mr-2" /> Analytics
                              </Button>
                              <Button variant="ghost" className="rounded-xl font-bold text-destructive hover:bg-destructive/5 ml-auto">
                                <XCircle className="h-4 w-4 mr-2" /> Cancel Session
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}
              </div>
            </section>

            {/* Groups Simulation Link */}
            <section className="bg-primary/5 rounded-3xl p-8 border border-primary/10 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Users className="h-24 w-24 text-primary" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight">Your Community Groups</h3>
                  <p className="text-muted-foreground text-sm max-w-md">You are an organizer for 3 active groups. Manage your members and group-exclusive activities.</p>
                </div>
                <div className="flex gap-4">
                  <Button className="rounded-full bg-primary text-white font-bold h-10 px-6">View Groups</Button>
                  <Button variant="outline" className="rounded-full border-primary/20 font-bold h-10 px-6">Create New Group</Button>
                </div>
              </div>
            </section>

            {/* Past Sessions Summary */}
            <section className="space-y-4">
              <h2 className="font-bold text-lg text-muted-foreground">Recent Completed Sessions</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastActivities.map(activity => (
                  <Card key={activity.id} className="p-4 bg-muted/20 border-none group hover:bg-muted/40 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-sm">{activity.sport}</h3>
                      <span className="text-[10px] font-bold text-muted-foreground bg-white px-2 py-0.5 rounded-full shadow-sm">{activity.date}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {activity.players.length} players</span>
                      <span className="text-green-600 font-bold flex items-center gap-1"><CreditCard className="h-3 w-3" /> $120.00</span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-2xl">My Bookee</h2>
                <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs font-bold text-primary" onClick={() => navigate('/demo/chat?role=organizer&action=explore')}>Explore Activities</Button>
              </div>
              
              <div className="grid gap-6">
                <Card className="p-6 border-l-4 border-l-[#1A7A4A] shadow-md">
                  <h3 className="font-black text-xs uppercase tracking-[0.2em] text-[#1A7A4A] mb-4">Activities Created</h3>
                  <div className="space-y-3">
                    {upcomingActivities.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-black/5">
                        <div>
                          <p className="font-bold text-sm">{a.sport} – {a.venue}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{a.date} • {a.time}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{a.slots}/{a.maxSlots} SLOTS</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-amber-500 shadow-md">
                  <h3 className="font-black text-xs uppercase tracking-[0.2em] text-amber-600 mb-4">Activities Joined</h3>
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground italic">You haven't joined any activities as a player yet.</p>
                    <Button variant="link" className="text-primary font-bold mt-2" onClick={() => navigate('/')}>Find something to play</Button>
                  </div>
                </Card>
              </div>
            </section>
          </motion.div>
        )}
      </div>
    </div>
  );
}
