import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { dataService, type Activity, type ActivitySession } from '../../lib/data';
import { store, type MockEvent, type MockTimeslot, type MockBooking, type MockWaitlistEntry, getPlayerDisplayName } from '../../lib/mockData';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { MapPin, Calendar, Users, Clock, ArrowLeft, Check, ChevronDown, ChevronUp, Info, Loader2, UserPlus, List, MessageCircle, Phone, Lock, Unlock, Copy, Star, MessageSquare, Share2, Send, UserCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MemoriesCarousel from '../../components/MemoriesCarousel';

interface SlotWithPlayers extends MockTimeslot {
  bookings: MockBooking[];
  waitlistEntries: MockWaitlistEntry[];
}

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<MockEvent | null>(null);
  const [slots, setSlots] = useState<SlotWithPlayers[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAverageRating] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>({});
  const [expandedWaitlist, setExpandedWaitlist] = useState<Record<string, boolean>>({});
  const [isBooking, setIsBooking] = useState(false);
  const [showFullNumber, setShowFullNumber] = useState(false);
  const [userBookings, setUserBookings] = useState<MockBooking[]>([]);

  // Supabase activity state (for real DB data)
  const [supabaseActivity, setSupabaseActivity] = useState<Activity | null>(null);
  const [supabaseSessions, setSupabaseSessions] = useState<ActivitySession[]>([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(true);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Guest sign-up modal
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestUsername, setGuestUsername] = useState('');
  const [guestPhone, setGuestPhone] = useState('+65 ');
  const [isGuestBooking, setIsGuestBooking] = useState(false);
  const [guestSlotId, setGuestSlotId] = useState<string | null>(null);

  const [, setRefresh] = useState(0);

  const loadData = () => {
    if (!id) return;
    // Try mock store first
    const evt = store.getEvent(id);
    setEvent(evt || null);
    if (evt) {
      const timeslots = store.listTimeslotsByEvent(id);
      const withPlayers = timeslots.map(ts => ({
        ...ts,
        bookings: store.listBookingsByTimeslot(ts.id),
        waitlistEntries: store.listWaitlistByTimeslot(ts.id),
      }));
      setSlots(withPlayers);

      const evReviews = store.listReviewsByEvent(id);
      setReviews(evReviews);
      setAverageRating(store.getAverageRating(id));

      if (user) {
        const bookings = store.listBookingsByUser(user.id).filter(b =>
          timeslots.some(ts => ts.id === b.timeslotId)
        );
        setUserBookings(bookings);
      }
    }
  };

  // Load from Supabase if mock not found
  useEffect(() => {
    if (!id) return;
    loadData();

    // Also try Supabase
    const loadSupabase = async () => {
      setIsLoadingSupabase(true);
      try {
        const [activity, sessions] = await Promise.all([
          dataService.getActivity(id),
          dataService.listSessionsByActivity(id),
        ]);
        setSupabaseActivity(activity);
        setSupabaseSessions(sessions);
      } catch (err) {
        console.error('Supabase load error:', err);
      } finally {
        setIsLoadingSupabase(false);
      }
    };
    loadSupabase();
  }, [id, user]);

  const hasConfirmedBooking = userBookings.some(b => b.status === 'confirmed');
  const canReview = hasConfirmedBooking && !store.hasReviewed(user?.id || '', id || '');

  const toggleExpand = (slotId: string) => {
    setExpandedSlots(prev => ({ ...prev, [slotId]: !prev[slotId] }));
  };

  const toggleWaitlistExpand = (slotId: string) => {
    setExpandedWaitlist(prev => ({ ...prev, [slotId]: !prev[slotId] }));
  };

  const handleJoinWaitlist = (slotId: string) => {
    if (!user) { toast.error('Please log in first'); return; }
    const result = store.joinWaitlist(user.id, slotId);
    if (result) {
      toast.success('You have been added to the waitlist!');
      loadData();
      setRefresh(n => n + 1);
    } else {
      toast.error('You are already on the waitlist or have a booking.');
    }
  };

  const handleBook = () => {
    if (!selectedSlot) { toast.error('Please select a timeslot first'); return; }
    const slot = slots.find(s => s.id === selectedSlot);
    if (!slot) return;
    if (slot.currentCapacity >= slot.maxCapacity) { toast.error('This timeslot is full'); return; }

    if (!user) {
      // Guest flow — show modal
      setGuestSlotId(selectedSlot);
      setShowGuestModal(true);
      return;
    }

    setIsBooking(true);
    setTimeout(() => {
      const booking = store.createBooking(user.id, selectedSlot, slot.price);
      toast.success('Booking created! Proceed to payment.');
      navigate(`/player/payment/${booking.id}`);
      setIsBooking(false);
    }, 500);
  };

  const handleGuestBook = () => {
    if (!guestName.trim()) { toast.error('Please enter your name'); return; }
    if (!guestUsername.trim()) { toast.error('Please enter a username'); return; }
    if (event?.collectPhone !== false && (!guestPhone.trim() || guestPhone === '+65 ')) {
      toast.error('Please enter your phone number'); return;
    }
    if (!guestSlotId) return;
    const slot = slots.find(s => s.id === guestSlotId);
    if (!slot) return;

    setIsGuestBooking(true);
    setTimeout(() => {
      // Create a temporary guest user in the store
      const finalPhone = event?.collectPhone === false ? undefined : guestPhone.trim();
      const guestUser = store.signupPlayer(`guest-${Date.now()}@bookee.sg.sites.blink.new`, guestUsername.trim(), guestName.trim(), finalPhone);
      const booking = store.createBooking(guestUser.id, guestSlotId, slot.price);
      toast.success(`Slot reserved for ${guestName}! Show this confirmation to the organizer.`);
      setShowGuestModal(false);
      setGuestName('');
      setGuestUsername('');
      setGuestPhone('+65 ');
      setGuestSlotId(null);
      loadData();
      setIsGuestBooking(false);
    }, 600);
  };

  const handleWhatsApp = () => {
    if (!event) return;
    const name = event.organizerPhone ? store.users.find(u => u.phone === event.organizerPhone)?.displayName : 'Organizer';
    const date = new Date(event.date).toLocaleDateString();
    const message = encodeURIComponent(`Hi ${name}, question about ${event.venue} on ${date} before booking`);
    window.open(`https://wa.me/${event.organizerPhone?.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleSMS = () => {
    if (!event) return;
    const date = new Date(event.date).toLocaleDateString();
    const message = encodeURIComponent(`Hi, question about ${event.venue} on ${date}`);
    window.location.href = `sms:${event.organizerPhone?.replace(/\D/g, '')}?body=${message}`;
  };

  const handleCopyNumber = () => {
    if (event?.organizerPhone) {
      navigator.clipboard.writeText(event.organizerPhone);
      toast.success('Number copied to clipboard');
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied to clipboard!'));
  };

  const handleShareWhatsApp = () => {
    if (!event) return;
    const url = window.location.href;
    const text = encodeURIComponent(`Check out this activity: ${event.venue} on ${new Date(event.date).toLocaleDateString()}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareTelegram = () => {
    if (!event) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this activity: ${event.venue}`);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    if (!reviewComment.trim()) { toast.error('Please enter a comment'); return; }
    setIsSubmittingReview(true);
    setTimeout(() => {
      store.createReview(user.id, id, reviewRating, reviewComment);
      toast.success('Thank you for your review!');
      setReviewComment('');
      setReviewRating(5);
      loadData();
      setIsSubmittingReview(false);
    }, 500);
  };

  if (!event) return <div className="p-20 text-center text-muted-foreground">Event not found.</div>;

  const selectedSlotData = slots.find(s => s.id === selectedSlot);

  return (
    <div className="container py-10 px-4 max-w-5xl">
      <Button variant="ghost" className="mb-6 hover:bg-muted" onClick={() => navigate('/player/events')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
      </Button>

      <div className="grid lg:grid-cols-[1fr_350px] gap-10">
        {/* Left Column */}
        <div className="space-y-8">
          {/* 1. Memory Carousel */}
          <MemoriesCarousel
            compact
            title=""
            showSocialLinks
            subtitle=""
          />

          {/* 2. Header Section */}
          <section className="relative rounded-3xl overflow-hidden bg-muted" style={{ aspectRatio: '21/9' }}>
            <img
              src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=2000&q=80"
              alt={event.venue}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504450758481-73389ba7524a?w=2000&q=80'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
              <div>
                <Badge className="mb-3" style={{ background: '#1A7A4A', color: '#fff', border: 'none' }}>Active Session</Badge>
                <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#fff', fontFamily: 'Lora, serif' }}>{event.venue}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm mt-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" style={{ color: '#7FFFC4' }} />
                    {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" style={{ color: '#7FFFC4' }} /> Singapore</span>
                  <span className="flex items-center gap-1.5 font-bold" style={{ color: '#fff' }}>
                    <Star className="h-4 w-4" style={{ color: '#FFD700', fill: '#FFD700' }} />
                    {avgRating > 0 ? `${avgRating} (${reviews.length} reviews)` : 'No ratings yet'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Contact Section */}
          <section className="bg-white p-6 rounded-2xl border-2 border-[#1A7A4A]/15 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col">
                <h3 className="font-bold text-lg mb-1" style={{ color: '#111' }}>Contact Organizer</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{showFullNumber ? event.organizerPhone : '+65 XXXX XXXX'}</span>
                  <button
                    onClick={() => setShowFullNumber(!showFullNumber)}
                    className="text-xs font-bold hover:underline"
                    style={{ color: '#1A7A4A' }}
                  >
                    {showFullNumber ? 'Hide' : '(click to reveal)'}
                  </button>
                  {showFullNumber && (
                    <button onClick={handleCopyNumber} className="p-1 hover:bg-muted rounded">
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  onClick={handleWhatsApp}
                  className="flex-1 sm:flex-none rounded-full px-6 font-bold"
                  style={{ background: '#00A86B', color: '#fff' }}
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                </Button>
                <Button
                  onClick={handleSMS}
                  variant="outline"
                  className="flex-1 sm:flex-none rounded-full px-6 font-bold"
                  style={{ borderColor: '#00A86B', color: '#00A86B' }}
                >
                  <Phone className="mr-2 h-4 w-4" /> Call/SMS
                </Button>
              </div>
            </div>
          </section>

          {/* 3b. Share Activity */}
          <section className="bg-white p-4 rounded-2xl border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold" style={{ color: '#111' }}>Share this activity</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none rounded-full text-xs font-bold"
                onClick={handleCopyLink}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Link
              </Button>
              <Button
                size="sm"
                className="flex-1 sm:flex-none rounded-full text-xs font-bold"
                style={{ background: '#00A86B', color: '#fff' }}
                onClick={handleShareWhatsApp}
              >
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
              </Button>
              <Button
                size="sm"
                className="flex-1 sm:flex-none rounded-full text-xs font-bold"
                style={{ background: '#0088CC', color: '#fff' }}
                onClick={handleShareTelegram}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" /> Telegram
              </Button>
            </div>
          </section>

          {/* 4. Public Announcements (Ice Blue) */}
          <section className="space-y-3">
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: '#111' }}>
              <Info className="h-5 w-5" style={{ color: '#1B5F8C' }} /> 📢 ANNOUNCEMENTS
            </h3>
            <div className="bg-[#C8E8F8]/60 p-6 rounded-2xl border-2 border-[#1B5F8C]/15 space-y-2">
              {event.publicAnnouncements && event.publicAnnouncements.length > 0 ? (
                <ul className="space-y-2">
                  {event.publicAnnouncements.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 font-medium" style={{ color: '#1B5F8C' }}>
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: '#1B5F8C' }} />
                      {a}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="italic" style={{ color: 'rgba(27,95,140,0.60)' }}>No public announcements yet.</p>
              )}
            </div>
          </section>

          {/* 5. Timeslot Checklist */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#111' }}>Timeslots (Checklist)</h2>
              <span className="text-sm text-muted-foreground">{slots.length} slots available</span>
            </div>

            <div className="space-y-3">
              {slots.map((slot) => {
                const isFull = slot.currentCapacity >= slot.maxCapacity;
                const isSelected = selectedSlot === slot.id;
                const pct = Math.round((slot.currentCapacity / slot.maxCapacity) * 100);
                const isExpanded = expandedSlots[slot.id];
                const barLen = Math.min(slot.maxCapacity, 10);
                const filledBars = Math.round((slot.currentCapacity / slot.maxCapacity) * barLen);
                const emptyBars = barLen - filledBars;

                return (
                  <div
                    key={slot.id}
                    className={`rounded-2xl border-2 transition-all ${isSelected ? 'shadow-md' : isFull ? 'opacity-60' : ''}`}
                    style={{
                      borderColor: isSelected ? '#1A7A4A' : isFull ? '#e5e7eb' : '#e5e7eb',
                      background: isSelected ? 'rgba(26,122,74,0.04)' : '#fff',
                    }}
                  >
                    <div
                      className="p-4 cursor-pointer flex flex-col gap-3"
                      onClick={() => !isFull && setSelectedSlot(slot.id)}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <div
                          className="w-6 h-6 rounded border-2 flex items-center justify-center shrink-0"
                          style={{
                            background: isSelected ? '#1A7A4A' : 'transparent',
                            borderColor: isSelected ? '#1A7A4A' : '#d1d5db',
                          }}
                        >
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <span className="font-bold text-lg" style={{ color: '#111' }}>{slot.label}</span>
                        <span className="text-muted-foreground">(${slot.price})</span>
                        <span className="text-muted-foreground hidden sm:inline">──</span>
                        <span className="font-mono text-sm" style={{ color: '#111' }}>[{slot.currentCapacity}/{slot.maxCapacity}]</span>
                        <span className="text-muted-foreground hidden sm:inline">──</span>
                        <span className="font-mono text-sm tracking-tight" style={{ color: '#1A7A4A' }}>
                          {'█'.repeat(filledBars)}{'░'.repeat(emptyBars)}
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: pct > 80 ? '#dc2626' : '#1A7A4A' }}
                        >
                          {isFull ? 'FULL' : `${pct}%`}
                        </span>
                      </div>

                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all rounded-full"
                          style={{ width: `${pct}%`, background: pct > 80 ? '#dc2626' : '#1A7A4A' }}
                        />
                      </div>
                    </div>

                    <div className="px-4 pb-2">
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => { e.stopPropagation(); toggleExpand(slot.id); }}
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {isExpanded ? 'Collapse' : 'Show players'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-4 space-y-1 border-t pt-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">
                          <Users className="h-3 w-3" /> Players ({slot.currentCapacity}/{slot.maxCapacity})
                        </div>
                        {(event.participantVisibility || 'public') === 'private' ? (
                          <div className="flex items-center gap-3 py-3 px-3 rounded-xl bg-muted/30 border">
                            <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-sm font-bold" style={{ color: '#111' }}>{slot.currentCapacity} of {slot.maxCapacity} slots filled</p>
                              <p className="text-xs text-muted-foreground">Participant list is private for this activity</p>
                            </div>
                          </div>
                        ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                          {Array.from({ length: slot.maxCapacity }).map((_, i) => {
                            const booking = slot.bookings[i];
                            const playerUser = booking ? store.getUser(booking.userId) : null;
                            return (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="w-5 text-right text-muted-foreground font-mono">{i + 1}.</span>
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    background: booking
                                      ? (booking.status === 'confirmed' ? '#1A7A4A' : '#C47A00')
                                      : '#e5e7eb'
                                  }}
                                />
                                <span className={booking ? 'font-medium' : 'italic text-muted-foreground/50'}>
                                  {booking ? getPlayerDisplayName(playerUser) : 'Available'}
                                </span>
                                {booking && (
                                  <Badge
                                    variant="outline"
                                    className="ml-auto text-[10px]"
                                    style={{
                                      color: booking.status === 'confirmed' ? '#1A7A4A' : '#C47A00',
                                      borderColor: booking.status === 'confirmed' ? '#1A7A4A' : '#C47A00',
                                    }}
                                  >
                                    {booking.status}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        )}

                        {/* Waitlist Section */}
                        {isFull && (
                          <div className="mt-4 pt-3 border-t border-dashed">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">
                              <List className="h-3 w-3" /> Waitlist ({slot.waitlistEntries.length})
                            </div>
                            {slot.waitlistEntries.length === 0 ? (
                              <p className="text-xs italic text-muted-foreground/50 pl-7">No one on the waitlist yet.</p>
                            ) : (
                              <>
                                {(expandedWaitlist[slot.id] ? slot.waitlistEntries : slot.waitlistEntries.slice(0, 3)).map((entry, i) => {
                                  const wlUser = store.getUser(entry.userId);
                                  return (
                                    <div key={entry.id} className="flex items-center gap-2 text-sm">
                                      <span className="w-5 text-right text-muted-foreground">{slot.maxCapacity + i + 1}.</span>
                                      <div className="h-2 w-2 rounded-full" style={{ background: '#C47A00' }} />
                                      <span className="font-medium" style={{ color: '#92580a' }}>
                                        [Waitlist #{entry.position}] {getPlayerDisplayName(wlUser)}
                                      </span>
                                    </div>
                                  );
                                })}
                                {slot.waitlistEntries.length > 3 && (
                                  <button
                                    type="button"
                                    className="text-xs hover:underline mt-1 pl-7 font-medium"
                                    style={{ color: '#1A7A4A' }}
                                    onClick={(e) => { e.stopPropagation(); toggleWaitlistExpand(slot.id); }}
                                  >
                                    {expandedWaitlist[slot.id] ? 'Show less' : `[View All Waitlist] (${slot.waitlistEntries.length})`}
                                  </button>
                                )}
                              </>
                            )}

                            {user && !store.isOnWaitlist(user.id, slot.id) && !slot.bookings.some(b => b.userId === user.id) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 rounded-full text-xs"
                                style={{ borderColor: '#C47A00', color: '#C47A00' }}
                                onClick={(e) => { e.stopPropagation(); handleJoinWaitlist(slot.id); }}
                              >
                                <UserPlus className="mr-1 h-3 w-3" /> + Join Waitlist
                              </Button>
                            )}
                            {user && store.isOnWaitlist(user.id, slot.id) && (
                              <p className="text-xs mt-2 pl-7 font-medium" style={{ color: '#C47A00' }}>You are on the waitlist.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 6. Event Info */}
          <section className="p-6 rounded-2xl bg-muted/30 border space-y-2">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#111' }}>
              <Info className="h-5 w-5" style={{ color: '#1A7A4A' }} /> Event Info
            </h3>
            <p className="text-muted-foreground text-sm">{event.description || 'No specific instructions. Bring your own equipment.'}</p>
          </section>

          {/* 7. Post-Payment Reveals (Green) */}
          <section className="space-y-3">
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: '#111' }}>
              {hasConfirmedBooking ? (
                <><Unlock className="h-5 w-5" style={{ color: '#1A7A4A' }} /> 🔓 EXCLUSIVE INFO REVEALED</>
              ) : (
                <><Lock className="h-5 w-5 text-muted-foreground" /> 🔒 EXCLUSIVE INFO</>
              )}
            </h3>
            <div
              className={`p-6 rounded-2xl border-2 transition-all ${!hasConfirmedBooking ? 'grayscale' : ''}`}
              style={{
                background: hasConfirmedBooking ? '#F0FDF4' : '#f9fafb',
                borderColor: hasConfirmedBooking ? 'rgba(26,122,74,0.20)' : '#e5e7eb',
              }}
            >
              {!hasConfirmedBooking ? (
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <Lock className="h-4 w-4" /> <span>Court assignments</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <Lock className="h-4 w-4" /> <span>Organizer direct contact</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <Lock className="h-4 w-4" /> <span>Door code / parking details</span>
                  </li>
                  <div className="pt-4 mt-4 border-t text-xs italic text-muted-foreground">
                    Unlock these details after payment is confirmed.
                  </div>
                </ul>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#1A7A4A' }}>Court Assignments</h4>
                    <div className="space-y-2">
                      {Object.entries(event.courtAssignments || {}).map(([hour, courts]) => (
                        <div key={hour} className="flex items-center gap-2 text-sm">
                          <span className="font-bold w-32" style={{ color: '#111' }}>{hour}:</span>
                          <div className="flex gap-2 flex-wrap">
                            {(courts as string[]).map(c => (
                              <Badge key={c} variant="secondary" style={{ background: 'rgba(26,122,74,0.10)', color: '#1A7A4A', border: 'none' }}>{c}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t space-y-3" style={{ borderColor: 'rgba(26,122,74,0.10)' }}>
                    {(event.exclusiveReveals || []).map((rev, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm font-medium" style={{ color: '#111' }}>
                        {rev.toLowerCase().includes('phone') || rev.toLowerCase().includes('+65')
                          ? <Phone className="h-4 w-4" style={{ color: '#1A7A4A' }} />
                          : <Unlock className="h-4 w-4" style={{ color: '#1A7A4A' }} />}
                        {rev}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 8. Questions Section */}
          <section className="p-6 rounded-2xl bg-[#FEF3C7]/60 border-2 border-[#C47A00]/20 space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#111' }}>
              ❓ HAVE QUESTIONS?
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: '#222' }}>
              <li>• What's the skill level required?</li>
              <li>• Are extra rackets/equipment available?</li>
              <li>• Can I bring a friend?</li>
            </ul>
            <Button
              onClick={handleWhatsApp}
              className="rounded-full px-6 font-bold mt-2"
              style={{ background: '#00A86B', color: '#fff' }}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Organizer
            </Button>
          </section>

          {/* 9. Reviews Section */}
          <section id="reviews" className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#111' }}>
                <MessageSquare className="h-6 w-6" style={{ color: '#1A7A4A' }} /> Community Reviews
              </h3>
              {avgRating > 0 && (
                <div className="flex items-center gap-1 font-bold text-lg">
                  <Star className="h-5 w-5" style={{ color: '#C47A00', fill: '#C47A00' }} />
                  <span style={{ color: '#C47A00' }}>{avgRating}</span>
                </div>
              )}
            </div>

            {/* Rating breakdown */}
            {reviews.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#FEF3C7]/50 border border-[#C47A00]/20 space-y-2">
                <p className="text-sm font-bold" style={{ color: '#C47A00' }}>★ {avgRating} AVERAGE ({reviews.length} reviews)</p>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length;
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-right font-bold" style={{ color: '#C47A00' }}>{star}★</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#C47A00' }} />
                      </div>
                      <span className="w-4 text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Submission Form */}
            {canReview && (
              <Card className="border-2 shadow-sm" style={{ borderColor: 'rgba(26,122,74,0.20)', background: 'rgba(26,122,74,0.03)' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg" style={{ color: '#111' }}>Leave a Review</CardTitle>
                  <CardDescription>Share your experience with the community</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none transition-transform active:scale-90"
                        >
                          <Star
                            className="h-8 w-8"
                            style={{
                              color: star <= reviewRating ? '#C47A00' : '#d1d5db',
                              fill: star <= reviewRating ? '#C47A00' : 'none',
                            }}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="What did you think of the game, courts, and organization?"
                      className="w-full min-h-[100px] p-4 rounded-xl border-2 focus:ring-0 text-sm resize-none bg-white"
                      style={{ borderColor: 'rgba(26,122,74,0.20)', color: '#111' }}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                    />
                    <Button
                      type="submit"
                      className="w-full rounded-full font-bold"
                      style={{ background: '#1A7A4A', color: '#fff' }}
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Review'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Review List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-muted/20">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No reviews yet. Be the first to play and review!</p>
                </div>
              ) : (
                reviews.map((rev) => {
                  const revUser = store.getUser(rev.userId);
                  return (
                    <motion.div
                      key={rev.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-2xl border-2 bg-white space-y-3"
                      style={{ borderColor: '#e5e7eb' }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#C8E8F8]/60 flex items-center justify-center font-bold" style={{ color: '#1B5F8C' }}>
                            {getPlayerDisplayName(revUser).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ color: '#111' }}>{getPlayerDisplayName(revUser)}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(rev.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className="h-3 w-3"
                              style={{
                                color: s <= rev.rating ? '#C47A00' : '#e5e7eb',
                                fill: s <= rev.rating ? '#C47A00' : '#e5e7eb',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: '#222' }}>"{rev.comment}"</p>

                      {rev.reply && (
                        <div className="mt-4 p-4 rounded-xl bg-[#E8F7EF] border-l-4 space-y-1" style={{ borderColor: '#1A7A4A' }}>
                          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#1A7A4A' }}>Organizer Reply</p>
                          <p className="text-xs italic" style={{ color: '#222' }}>"{rev.reply}"</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Right: Booking Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-24 shadow-sm border-2" style={{ borderColor: 'rgba(26,122,74,0.10)' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold" style={{ color: '#111' }}>Booking Summary</CardTitle>
              <CardDescription>Select a timeslot to proceed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Venue</span>
                <span className="font-medium text-right truncate max-w-[160px]" style={{ color: '#111' }}>{event.venue}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium" style={{ color: '#111' }}>{new Date(event.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Timeslot</span>
                <span className="font-medium" style={{ color: '#111' }}>{selectedSlotData?.label || 'Not selected'}</span>
              </div>
              <div className="h-[1px] bg-border" />
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total</p>
                  <p className="text-3xl font-bold" style={{ color: '#111' }}>${selectedSlotData?.price || 0}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#FEF3C7]/80 border border-[#C47A00]/20 text-[11px]" style={{ color: '#92580a' }}>
                <strong>PAYMENT POLICY:</strong> Payment must be completed within 5 hours of the event start time.
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full h-12 rounded-full font-bold text-lg shadow-sm"
                style={{ background: '#1A7A4A', color: '#fff' }}
                disabled={!selectedSlot || isBooking}
                onClick={handleBook}
              >
                {isBooking ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : 'Confirm Booking'}
              </Button>
            </CardFooter>
          </Card>

          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-3xl text-center space-y-3">
            <Users className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              Need a different timing? <br />
              <Button variant="link" className="p-0 h-auto text-xs font-bold" style={{ color: '#1A7A4A' }} onClick={() => navigate('/player/special-request')}>
                Submit a Special Request
              </Button>
            </p>
          </div>
        </div>
      </div>

      {/* Guest Sign-up Modal */}
      <AnimatePresence>
        {showGuestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowGuestModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#111' }}>Guest Booking</h2>
                <button onClick={() => setShowGuestModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleGuestBook(); }} className="space-y-4">
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Your Name</Label>
                    <Input
                      placeholder="e.g. Alex Tan"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      placeholder="alextan123"
                      value={guestUsername}
                      onChange={e => setGuestUsername(e.target.value)}
                    />
                  </div>
                  {event?.collectPhone !== false && (
                    <div className="space-y-2">
                      <Label>WhatsApp / Phone Number</Label>
                      <Input
                        placeholder="+65 9123 4567"
                        value={guestPhone}
                        onChange={e => setGuestPhone(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground italic">
                        For organizer to contact you regarding the activity.
                      </p>
                    </div>
                  )}
                  {event?.collectPhone === false && (
                    <div className="p-3 rounded-lg bg-muted/50 text-[10px] text-muted-foreground italic">
                      Notice: Contact information is NOT required for this activity. Only your name will be recorded.
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-full font-bold h-12"
                  style={{ background: '#1A7A4A', color: '#fff' }}
                  disabled={isGuestBooking}
                >
                  {isGuestBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reserving...</> : 'Reserve My Slot'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  You'll receive a confirmation message via WhatsApp.
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
