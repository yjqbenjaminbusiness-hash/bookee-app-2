import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { store } from '../../lib/mockData';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Calendar, Clock, ChevronRight, Activity, Zap, User, TrendingUp, Loader2, MessageSquare, Star, CheckCircle2, Users } from 'lucide-react';
import { useState } from 'react';
import MemoriesCarousel from '../../components/MemoriesCarousel';

export default function PlayerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#1A7A4A' }} />
      </div>
    );
  }

  const bookings = store.listBookingsByUser(user.id);
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const groups = store.listGroupsForMember(user.id);

  const today = new Date().toISOString().split('T')[0];

  const enriched = bookings.map(b => {
    const slot = store.getTimeslot(b.timeslotId);
    const evt = slot ? store.getEvent(slot.eventId) : undefined;
    const hasReviewed = evt ? store.hasReviewed(user.id, evt.id) : false;
    return {
      ...b,
      eventId: evt?.id,
      venue: evt?.venue || 'Unknown',
      slotLabel: slot?.label || '',
      date: evt?.date || '',
      isPast: evt ? evt.date < today : false,
      hasReviewed
    };
  });

  const upcomingGames = enriched.filter(b => !b.isPast);
  const pastGames = enriched.filter(b => b.isPast);

  const displayedGames = activeTab === 'upcoming' ? upcomingGames : pastGames;

  return (
    <div className="container py-10 px-4 max-w-6xl">
      {/* Memories Carousel */}
      <div className="mb-10">
        <MemoriesCarousel title="Your Game Memories" subtitle="Moments from sessions you attended" compact />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold" style={{ color: '#111' }}>My Bookee</h1>
          <p className="text-muted-foreground">Welcome back, {user.displayName || 'Athlete'}!</p>
        </div>
        <Button
          size="lg"
          className="rounded-full shadow-elegant px-8 font-bold"
          style={{ background: '#1A7A4A', color: '#fff' }}
          onClick={() => navigate('/player/events')}
        >
          <Zap className="mr-2 h-5 w-5" /> Find a Game
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
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

      <div className="grid md:grid-cols-[1fr_300px] gap-10">
        <div className="space-y-12">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#111' }}>
                <Activity className="h-6 w-6" style={{ color: '#1A7A4A' }} /> My Activities
              </h2>
              <div className="flex bg-muted p-1 rounded-full w-fit">
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'upcoming' ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  style={activeTab === 'upcoming' ? { background: '#1A7A4A' } : {}}
                >
                  Upcoming ({upcomingGames.length})
                </button>
                <button
                  onClick={() => setActiveTab('past')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'past' ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  style={activeTab === 'past' ? { background: '#1A7A4A' } : {}}
                >
                  Past Games ({pastGames.length})
                </button>
              </div>
            </div>

            {displayedGames.length === 0 ? (
              <Card className="p-16 text-center border-dashed bg-white/50">
                <div className="p-4 rounded-full bg-[#C8E8F8]/40 w-fit mx-auto mb-4">
                  <Calendar className="h-8 w-8" style={{ color: '#1B5F8C', opacity: 0.4 }} />
                </div>
                <h3 className="font-bold text-lg" style={{ color: '#111' }}>No {activeTab} bookings</h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === 'upcoming'
                    ? "You don't have any upcoming games scheduled."
                    : "Your past games will appear here after they are completed."}
                </p>
                <Button
                  className="rounded-full px-8 font-bold"
                  style={{ background: '#1A7A4A', color: '#fff' }}
                  onClick={() => navigate('/player/events')}
                >
                  Explore Events
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {displayedGames.map(b => (
                  <div
                    key={b.id}
                    className="group relative p-6 rounded-2xl border-2 bg-white hover:border-[#1A7A4A]/40 hover:shadow-elegant transition-all cursor-pointer"
                    onClick={() => {
                      if (b.status === 'pending') navigate(`/player/payment/${b.id}`);
                      else if (b.eventId) navigate(`/player/events/${b.eventId}`);
                    }}
                  >
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex gap-4 items-center">
                        <div
                          className="p-4 rounded-2xl"
                          style={{
                            background: b.status === 'confirmed' ? '#E8F7EF' : '#FEF3C7',
                            color: b.status === 'confirmed' ? '#1A7A4A' : '#C47A00',
                          }}
                        >
                          {b.status === 'confirmed' ? (
                            b.isPast ? <CheckCircle2 className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />
                          ) : (
                            <Clock className="h-6 w-6" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg" style={{ color: '#111' }}>{b.venue}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" /> {b.date ? new Date(b.date).toLocaleDateString() : 'N/A'} • <Clock className="h-3 w-3" /> {b.slotLabel}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-2xl font-bold" style={{ color: '#111' }}>${b.amount}</div>
                        <Badge
                          style={{
                            background: b.status === 'confirmed' ? '#1A7A4A' : '#C47A00',
                            color: '#fff',
                            border: 'none',
                          }}
                        >
                          {b.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {b.isPast && b.status === 'confirmed' && !b.hasReviewed && (
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: '#1A7A4A' }}>
                          <Star className="h-3 w-3" style={{ fill: '#1A7A4A', color: '#1A7A4A' }} /> How was your game?
                        </p>
                        <Button
                          size="sm"
                          className="h-9 rounded-full px-6 font-bold shadow-sm"
                          style={{ background: '#C47A00', color: '#fff' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (b.eventId) navigate(`/player/events/${b.eventId}#reviews`);
                          }}
                        >
                          Leave a Review <MessageSquare className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {b.status === 'pending' && !b.isPast && (
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#C47A00' }}>Payment Required within 5 hours</p>
                        <Button
                          size="sm"
                          className="h-9 rounded-full px-6 font-bold shadow-sm"
                          style={{ background: '#1A7A4A', color: '#fff' }}
                        >
                          Pay Now <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Groups Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#111' }}>
                <Users className="h-6 w-6" style={{ color: '#1A7A4A' }} /> My Groups
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary font-bold"
                onClick={() => navigate('/player/my-groups')}
              >
                Discover Groups <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {groups.length === 0 ? (
              <Card className="p-10 text-center border-dashed bg-white/50">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-bold text-lg">No groups yet</p>
                <p className="text-sm text-muted-foreground mb-4">Join a community to see group activities.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full font-bold"
                  onClick={() => navigate('/player/my-groups')}
                >
                  Find Groups
                </Button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {groups.map(group => (
                  <Card
                    key={group.id}
                    className="p-5 hover:shadow-lg transition-all cursor-pointer border-2 border-primary/5 group"
                    onClick={() => navigate(`/player/groups/${group.id}`)}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{group.name}</h3>
                          <p className="text-xs text-primary font-bold uppercase tracking-wider">{group.sport}</p>
                        </div>
                        <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px]">MEMBER</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                      <div className="flex items-center gap-3 pt-3 border-t text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {group.memberIds.length} members
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Athlete Progress Card */}
          <Card className="overflow-hidden border-none shadow-elegant" style={{ background: 'linear-gradient(135deg, #1A7A4A 0%, #0d5c35 100%)' }}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2" style={{ color: '#fff' }}>Athlete Progress</h3>
              <Badge style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>LVL 1</Badge>
            </div>
            <CardContent className="p-6 text-center space-y-6">
              <div className="mx-auto w-28 h-28 rounded-3xl border-4 border-white/20 flex items-center justify-center bg-white/10 relative transform rotate-3">
                <User className="h-14 w-14" style={{ color: '#fff' }} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-xl" style={{ color: '#fff' }}>Rookie Athlete</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>
                  {bookings.length >= 5 ? "Goal Reached!" : `Book ${5 - bookings.length} more to level up`}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.70)' }}>
                  <span>Progress</span>
                  <span>{Math.min(100, Math.round((bookings.length / 5) * 100))}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all" style={{ width: `${Math.min(100, (bookings.length / 5) * 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#C8E8F8]/40 border-2 border-[#1B5F8C]/20 p-6">
            <h4 className="font-bold mb-2" style={{ color: '#1B5F8C' }}>Need Help?</h4>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Questions about your booking or the venue? Contact the organizer directly from the event page.</p>
            <Button
              variant="outline"
              className="w-full rounded-full font-bold"
              style={{ borderColor: '#1B5F8C', color: '#1B5F8C' }}
              onClick={() => navigate('/player/events')}
            >
              Browse Events
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
