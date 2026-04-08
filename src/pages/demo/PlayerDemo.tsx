import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Zap,
  LayoutDashboard,
  ShieldCheck,
  Star,
  Plus,
  Play
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { DEMO_ACTIVITIES, DEMO_GROUPS, DemoActivity } from '../../lib/demoData';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function PlayerDemo() {
  const [activeTab, setActiveTab] = useState<'discover' | 'my-bookee' | 'groups'>('discover');
  const [activities, setActivities] = useState<DemoActivity[]>(DEMO_ACTIVITIES);
  const [joinedActivityIds, setJoinedActivityIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const upcomingActivities = activities.filter(a => a.status !== 'past');
  const myActivities = activities.filter(a => joinedActivityIds.has(a.id));

  const handleJoin = (activity: DemoActivity) => {
    if (joinedActivityIds.has(activity.id)) {
      toast.info('You already joined this activity');
      return;
    }

    if (activity.slots >= activity.maxSlots) {
      toast.success('Added to waitlist! You will be notified if a spot opens up.');
      setJoinedActivityIds(prev => new Set([...prev, activity.id]));
      return;
    }

    toast.success(`Successfully joined ${activity.sport} at ${activity.venue}!`);
    setJoinedActivityIds(prev => new Set([...prev, activity.id]));
    
    // Simulate updating slots locally
    setActivities(prev => prev.map(a => 
      a.id === activity.id ? { ...a, slots: a.slots + 1 } : a
    ));
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Top Nav Simulation */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="container px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">B</div>
            <span className="font-bold text-xl tracking-tighter">Bookee <Badge variant="outline" className="ml-1 bg-primary/5 text-[10px] py-0 h-4 border-primary/20">DEMO</Badge></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs border border-primary/20">P</div>
          </div>
        </div>
        <div className="flex px-2">
          {[
            { id: 'discover', label: 'Discover', icon: Search },
            { id: 'my-bookee', label: 'My Bookee', icon: LayoutDashboard },
            { id: 'groups', label: 'Groups', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all relative ${
                activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className={`h-3.5 w-3.5 ${activeTab === tab.id ? 'scale-110' : ''}`} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="container max-w-2xl px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10 h-12 rounded-2xl bg-white border-primary/10" placeholder="Explore activities..." />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" /> Recommended Games
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs font-bold text-primary" onClick={() => navigate('/demo/chat?role=player&action=explore')}>Explore Activities</Button>
                    <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs font-bold text-primary" onClick={() => setActiveTab('my-bookee')}>My Bookee</Button>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {upcomingActivities.map(activity => (
                    <Card 
                      key={activity.id} 
                      className={`overflow-hidden transition-all duration-300 border-2 ${expandedId === activity.id ? 'border-primary/40 shadow-xl' : 'border-white hover:border-primary/10 shadow-md'}`}
                    >
                      <div 
                        className="p-4 flex gap-4 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                      >
                        <div className="w-16 h-16 rounded-2xl bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl shadow-inner">
                          {activity.sport === 'Badminton' ? '🏸' : 
                           activity.sport === 'Basketball' ? '🏀' : 
                           activity.sport === 'Tennis' ? '🎾' : 
                           activity.sport === 'Volleyball' ? '🏐' : '⚽'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-base leading-tight">{activity.sport}</h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" /> {activity.venue}
                              </p>
                            </div>
                            <Badge variant={activity.slots >= activity.maxSlots ? 'secondary' : 'default'} className={`flex-shrink-0 text-[10px] px-2 py-0 h-5 font-bold ${activity.slots >= activity.maxSlots ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none' : ''}`}>
                              {activity.slots >= activity.maxSlots ? 'WAITLIST' : `${activity.maxSlots - activity.slots} SLOTS LEFT`}
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm font-black text-primary">{activity.price}</span>
                            <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {activity.date}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {activity.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedId === activity.id && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="border-t overflow-hidden bg-muted/5"
                          >
                            <div className="p-4 space-y-4">
                              <div className="space-y-2">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Signed Up Participants</p>
                                <div className="flex flex-wrap gap-2">
                                  {activity.players.slice(0, 5).map(p => (
                                    <div key={p.id} className="flex items-center gap-1.5 bg-white border px-2 py-1 rounded-full shadow-sm">
                                      <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">{p.name.charAt(0)}</div>
                                      <span className="text-[10px] font-bold">{p.name}</span>
                                      {p.status === 'paid' && <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />}
                                    </div>
                                  ))}
                                  {activity.players.length > 5 && (
                                    <div className="text-[10px] font-bold text-muted-foreground self-center ml-1">+{activity.players.length - 5} more</div>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1 rounded-xl font-bold h-10 shadow-lg active:scale-95 transition-transform"
                                  onClick={() => handleJoin(activity)}
                                  disabled={joinedActivityIds.has(activity.id)}
                                >
                                  {joinedActivityIds.has(activity.id) ? 'Already Joined' : activity.slots >= activity.maxSlots ? 'Join Waitlist' : 'Book My Slot'}
                                </Button>
                                <Button variant="outline" className="rounded-xl h-10 border-2 aspect-square p-0">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'my-bookee' && (
            <motion.div
              key="my-bookee"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-xl">My Activities</h2>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs font-bold text-primary" onClick={() => navigate('/demo/chat?role=player&action=explore')}>Explore Activities</Button>
                    <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs font-bold text-primary" onClick={() => setActiveTab('my-bookee')}>My Bookee</Button>
                  </div>
                </div>
                {myActivities.length === 0 ? (
                  <Card className="p-12 text-center border-dashed bg-white/50">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <p className="font-bold">No bookings yet</p>
                    <p className="text-sm text-muted-foreground mb-6">Discover games around you and start playing.</p>
                    <Button onClick={() => setActiveTab('discover')} className="rounded-full px-8 font-bold">Find a Game</Button>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {myActivities.map(activity => (
                      <Card key={activity.id} className="p-5 border-l-4 border-l-primary shadow-md hover:shadow-lg transition-all">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-bold text-lg">{activity.sport}</h3>
                            <p className="text-xs text-muted-foreground font-medium">{activity.venue}</p>
                            <div className="flex items-center gap-3 mt-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {activity.date}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {activity.time}</span>
                            </div>
                          </div>
                          <Badge className="bg-green-500 border-none px-3 py-0.5 rounded-full font-bold">CONFIRMED</Badge>
                        </div>
                        <div className="mt-5 pt-4 border-t flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black uppercase text-primary tracking-widest">Verified Organizer</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 rounded-xl text-xs font-bold px-4">
                            Details <ChevronRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h2 className="font-bold text-xl">Group Activities</h2>
                <div className="grid gap-4">
                  {DEMO_ACTIVITIES.filter(a => a.groupName === 'Weekend Warriors').map(a => (
                    <Card key={a.id} className="p-4 border-l-4 border-l-amber-500">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-black text-[10px] uppercase tracking-widest text-amber-600 mb-1">{a.groupName}</p>
                          <h3 className="font-bold text-sm">{a.sport} – {a.venue}</h3>
                          <p className="text-[10px] text-muted-foreground">{a.date} • {a.time}</p>
                        </div>
                        <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs font-bold" onClick={() => handleJoin(a)}>Join</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="font-bold text-xl">My Communities</h2>
                <div className="grid gap-4">
                  {DEMO_GROUPS.slice(0, 1).map(group => (
                    <Card key={group.id} className="p-4 border-none shadow-sm bg-white">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl shadow-inner">
                          {group.sport === 'Badminton' ? '🏸' : '⚽'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm leading-tight">{group.name}</h3>
                          <div className="mt-1 flex items-center gap-3">
                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" /> {group.members} members
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {group.activitiesCount} events
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted transition-colors">
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'groups' && (
            <motion.div
              key="groups"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xl">Community Groups</h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs font-bold text-primary" onClick={() => navigate('/demo/chat?role=player&action=explore')}>Explore Activities</Button>
                  <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs font-bold text-primary" onClick={() => setActiveTab('my-bookee')}>My Bookee</Button>
                </div>
              </div>
              <div className="grid gap-6">
                {DEMO_GROUPS.map(group => (
                  <Card key={group.id} className="overflow-hidden hover:shadow-xl transition-all border-2 border-primary/5 shadow-md">
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl overflow-hidden shadow-inner border">
                            {group.sport === 'Badminton' ? '🏸' : 
                             group.sport === 'Football' ? '⚽' : '🏆'}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg tracking-tight">{group.name}</h3>
                            <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] font-bold border-none px-2">{group.sport.toUpperCase()}</Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-full font-bold text-xs h-8 border-2" onClick={() => toast.success('Joined group!')}>Join</Button>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed font-medium">{group.description}</p>
                      <div className="pt-4 border-t flex justify-between items-center">
                        <div className="flex items-center gap-4 text-xs font-black text-muted-foreground uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {group.members}</span>
                          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {group.activitiesCount}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Star className="h-3.5 w-3.5 fill-amber-600" /> 4.8
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
