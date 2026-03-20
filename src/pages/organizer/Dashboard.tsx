import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { store } from '../../lib/mockData';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Calendar, Users, ArrowRight, Activity, Loader2, Star, MessageSquare, UsersRound } from 'lucide-react';
import MemoriesCarousel from '../../components/MemoriesCarousel';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#C47A00' }} />
      </div>
    );
  }

  const events = store.listEventsByUser(user.id);
  const allTimeslots = events.flatMap(e => store.listTimeslotsByEvent(e.id));
  const totalBookings = allTimeslots.reduce((acc, ts) => acc + ts.currentCapacity, 0);
  const totalRevenue = allTimeslots.reduce((acc, ts) => acc + (ts.currentCapacity * ts.price), 0);
  const specialRequests = store.listSpecialRequests().filter(r => r.status === 'pending');
  const orgRating = store.getOrganizerAverageRating(user.id);
  const groups = store.listGroupsByOrganizer(user.id);
  const orgReviews = store.listReviewsByOrganizer(user.id);
  const totalReviews = orgReviews.length;

  const getDisplayName = (u: { displayName?: string; email?: string } | undefined) => {
    if (!u) return 'Anonymous';
    return u.displayName || u.email || 'User';
  };

  return (
    <div className="container py-10 px-4 max-w-6xl">
      {/* Memories Carousel */}
      <div className="mb-10">
        <MemoriesCarousel title="Your Community Memories" subtitle="Photos from your organized sessions" compact />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold" style={{ color: '#111' }}>My Bookee</h1>
          <p className="text-muted-foreground">Welcome back, {user.displayName}. Manage your communities.</p>
        </div>
        <Button
          size="lg"
          className="rounded-full shadow-elegant px-8 font-bold"
          style={{ background: '#C47A00', color: '#fff' }}
          onClick={() => navigate('/organizer/events/new')}
        >
          <Plus className="mr-2 h-5 w-5" /> Create New Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        <Card className="border-2 bg-[#C8E8F8]/40 border-[#1B5F8C]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1B5F8C' }}>Active Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: '#1B5F8C' }}>{events.length}</div>
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
        <Card className="border-2 bg-[#FEF3C7] border-[#C47A00]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C47A00' }}>Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold" style={{ color: '#C47A00' }}>{orgRating > 0 ? orgRating : 'N/A'}</div>
              {orgRating > 0 && <Star className="h-5 w-5 mb-1" style={{ color: '#C47A00', fill: '#C47A00' }} />}
              <span className="text-[10px] text-muted-foreground mb-1">({totalReviews} revs)</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 bg-white border-border cursor-pointer hover:shadow-elegant hover:border-[#C47A00]/30 transition-all" onClick={() => navigate('/organizer/groups')}>
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
        <Card className={`border-2 ${specialRequests.length > 0 ? 'bg-amber-50 border-[#C47A00]/30' : 'bg-white border-border'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C47A00' }}>New Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold" style={{ color: '#C47A00' }}>{specialRequests.length}</div>
              {specialRequests.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 font-bold p-0"
                  style={{ color: '#C47A00' }}
                  onClick={() => navigate('/organizer/special-requests')}
                >
                  Review <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#111' }}>
            <Activity className="h-6 w-6" style={{ color: '#C47A00' }} /> Management Hub
          </h2>
          <Button variant="link" className="font-bold" style={{ color: '#C47A00' }} onClick={() => navigate('/organizer/bookings')}>
            View All Bookings
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_350px] gap-10">
          <div className="space-y-8">
            {events.length === 0 ? (
              <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed bg-white/50">
                <div className="p-6 rounded-3xl bg-[#C8E8F8]/40 w-fit mx-auto mb-6 transform -rotate-3">
                  <Calendar className="h-12 w-12" style={{ color: '#1B5F8C', opacity: 0.4 }} />
                </div>
                <h3 className="text-2xl font-bold" style={{ color: '#1B5F8C' }}>No events organized yet</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Start hosting sports sessions and build your community today.</p>
                <Button
                  size="lg"
                  className="rounded-full px-10 font-bold"
                  style={{ background: '#C47A00', color: '#fff' }}
                  onClick={() => navigate('/organizer/events/new')}
                >
                  Host Your First Session
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {events.map(event => {
                  const slots = store.listTimeslotsByEvent(event.id);
                  const totalCap = slots.reduce((a, s) => a + s.maxCapacity, 0);
                  const filledCap = slots.reduce((a, s) => a + s.currentCapacity, 0);
                  const pct = Math.round((filledCap / totalCap) * 100) || 0;

                  return (
                    <Card key={event.id} className="group overflow-hidden hover:shadow-elegant transition-all bg-white border-2 border-border hover:border-[#C47A00]/30">
                      <CardHeader className="bg-[#C8E8F8]/20 pb-6 relative">
                        <div className="flex justify-between items-start mb-4">
                          <Badge style={{ background: '#1A7A4A', color: '#fff', border: 'none' }}>ACTIVE</Badge>
                          <div className="flex flex-col items-end">
                            <span className="text-xl font-bold" style={{ color: '#1A7A4A' }}>{pct}%</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Filled</span>
                          </div>
                        </div>
                        <CardTitle className="text-xl line-clamp-1 font-bold" style={{ color: '#111' }}>{event.venue}</CardTitle>
                        <CardDescription className="flex items-center gap-2 font-medium">
                          <Calendar className="h-3 w-3" style={{ color: '#C47A00' }} />
                          {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
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
                              <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: '#1B5F8C' }}>Slots</p>
                              <p className="font-bold" style={{ color: '#1B5F8C' }}>{slots.length}</p>
                            </div>
                            <div className="flex-1 p-2 rounded-xl bg-[#E8F7EF] text-center">
                              <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: '#1A7A4A' }}>Waitlist</p>
                              <p className="font-bold" style={{ color: '#1A7A4A' }}>{slots.reduce((a, s) => a + store.listWaitlistByTimeslot(s.id).length, 0)}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 border-t bg-white grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full font-bold"
                          style={{ borderColor: '#C47A00', color: '#C47A00' }}
                          onClick={() => navigate(`/organizer/events/${event.id}/manage`)}
                        >
                          Bookings
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-full font-bold shadow-sm"
                          style={{ background: '#C47A00', color: '#fff' }}
                          onClick={() => navigate(`/organizer/events/${event.id}/manage`)}
                        >
                          Manage Hub
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar for Recent Reviews */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2" style={{ color: '#111' }}>
                <MessageSquare className="h-5 w-5" style={{ color: '#C47A00' }} /> Recent Reviews
              </h3>
              {orgRating > 0 && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold" style={{ background: '#FEF3C7', color: '#C47A00' }}>
                  <Star className="h-4 w-4" style={{ fill: '#C47A00', color: '#C47A00' }} /> {orgRating}
                </div>
              )}
            </div>

            {orgReviews.length === 0 ? (
              <Card className="p-10 text-center border-dashed bg-muted/5">
                <p className="text-xs text-muted-foreground">No community feedback yet.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {orgReviews.slice(0, 3).map(rev => {
                  const revUser = store.getUser(rev.userId);
                  const revEvent = store.getEvent(rev.eventId);
                  return (
                    <Card key={rev.id} className="border hover:border-[#C47A00]/30 transition-all bg-white">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`h-2.5 w-2.5`} style={{ color: s <= rev.rating ? '#C47A00' : '#e5e7eb', fill: s <= rev.rating ? '#C47A00' : '#e5e7eb' }} />
                            ))}
                          </div>
                          <span className="text-[8px] uppercase font-bold text-muted-foreground">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] font-bold truncate" style={{ color: '#1B5F8C' }}>Re: {revEvent?.venue}</p>
                        <p className="text-xs italic line-clamp-2 text-foreground">"{rev.comment}"</p>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[10px] text-muted-foreground">{getDisplayName(revUser)}</span>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-[10px] font-bold"
                            style={{ color: '#C47A00' }}
                            onClick={() => navigate(`/organizer/events/${rev.eventId}/manage`)}
                          >
                            View & Reply
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {orgReviews.length > 3 && (
                  <p className="text-center text-[10px] text-muted-foreground">See event management for more reviews</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
