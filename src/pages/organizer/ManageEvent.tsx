import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { store, getPlayerDisplayName } from '../../lib/mockData';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Calendar, ArrowLeft, CheckCircle2, XCircle, Clock, DollarSign, ChevronDown, ChevronUp, UserMinus, List, MessageCircle, Unlock, Plus, Trash2, Star, MessageSquare, Minus, AlertTriangle, Globe, Lock, CheckSquare, Square, Send, Bell, Users } from 'lucide-react';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageEvent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>({});
  const [publicAnnInput, setPublicAnnInput] = useState('');
  const [revealInput, setRevealInput] = useState('');
  
  // Review reply state
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [showReplyForm, setShowReplyForm] = useState<Record<string, boolean>>({});

  const [, setRefresh] = useState(0);
  const [slotWarning, setSlotWarning] = useState<Record<string, string>>({});

  // Bulk selection & payment status overrides
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [paymentStatus, setPaymentStatus] = useState<Record<string, 'paid' | 'pending' | 'refunded' | 'cancelled'>>({});

  // Add Timeslot state
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    label: '',
    price: '',
    maxCapacity: '',
    startTime: '',
    duration: '2HR',
  });

  const handleAdjustCapacity = (slotId: string, delta: number) => {
    const slot = timeslots.find(s => s.id === slotId);
    if (!slot) return;
    const newMax = slot.maxCapacity + delta;
    const result = store.updateTimeslotCapacity(slotId, newMax);
    if (!result.success && result.warning) {
      setSlotWarning(prev => ({ ...prev, [slotId]: result.warning! }));
      setTimeout(() => setSlotWarning(prev => { const n = { ...prev }; delete n[slotId]; return n; }), 4000);
      toast.error(result.warning);
    } else if (result.success) {
      setSlotWarning(prev => { const n = { ...prev }; delete n[slotId]; return n; });
      if (delta > 0) toast.success(`Slots increased to ${newMax}`);
      else toast.success(`Slots reduced to ${newMax}`);
    }
    setRefresh(n => n + 1);
  };

  const toggleSelectBooking = (bookingId: string) => {
    setSelectedBookings(prev => {
      const next = new Set(prev);
      if (next.has(bookingId)) next.delete(bookingId);
      else next.add(bookingId);
      return next;
    });
  };

  const handleBulkMarkPaid = () => {
    if (selectedBookings.size === 0) { toast.error('Select at least one player'); return; }
    const updates: Record<string, 'paid'> = {};
    selectedBookings.forEach(id => { updates[id] = 'paid'; });
    setPaymentStatus(prev => ({ ...prev, ...updates }));
    toast.success(`Marked ${selectedBookings.size} player(s) as Paid`);
    setSelectedBookings(new Set());
  };

  const handleBulkSendReminder = () => {
    if (selectedBookings.size === 0) { toast.error('Select at least one player'); return; }
    toast.success(`Reminder sent to ${selectedBookings.size} player(s)`);
    setSelectedBookings(new Set());
  };

  const handleBulkMoveWaitlist = () => {
    if (selectedBookings.size === 0) { toast.error('Select at least one player'); return; }
    toast.success(`${selectedBookings.size} player(s) moved to waitlist`);
    setSelectedBookings(new Set());
    setRefresh(n => n + 1);
  };

  const handleAddTimeslot = () => {
    if (!newSlot.label.trim() || !newSlot.price || !newSlot.maxCapacity || !newSlot.startTime) {
      toast.error('Please fill in all timeslot fields');
      return;
    }
    store.createTimeslot(
      event!.userId,
      event!.id,
      newSlot.label.trim(),
      parseFloat(newSlot.price),
      parseInt(newSlot.maxCapacity),
      newSlot.startTime.replace(':', ''),
      newSlot.duration,
    );
    setNewSlot({ label: '', price: '', maxCapacity: '', startTime: '', duration: '2HR' });
    setShowAddSlot(false);
    setRefresh(n => n + 1);
    toast.success('Timeslot added!');
  };

  const event = id ? store.getEvent(id) : undefined;
  if (!event) return <div className="p-10 text-center">Event not found.</div>;

  // Ensure array fields are always defined (backwards compat with old localStorage data)
  if (!Array.isArray(event.publicAnnouncements)) event.publicAnnouncements = [];
  if (!Array.isArray(event.exclusiveReveals)) event.exclusiveReveals = [];
  if (!event.courtAssignments || typeof event.courtAssignments !== 'object') event.courtAssignments = {};

  const timeslots = store.listTimeslotsByEvent(event.id).map(ts => ({
    ...ts,
    bookings: store.listBookingsByTimeslot(ts.id).map(b => {
      const u = store.getUser(b.userId);
      return { ...b, playerName: getPlayerDisplayName(u) };
    }),
    waitlistEntries: store.listWaitlistByTimeslot(ts.id).map(w => {
      const u = store.getUser(w.userId);
      return { ...w, playerName: getPlayerDisplayName(u) };
    }),
  }));

  const toggleExpand = (slotId: string) => {
    setExpandedSlots(prev => ({ ...prev, [slotId]: !prev[slotId] }));
  };

  const handleBookingStatus = (bookingId: string, status: 'confirmed' | 'rejected') => {
    if (status === 'confirmed') {
      store.confirmBooking(bookingId, 'MANUAL-CONFIRM');
      toast.success('Booking confirmed');
    } else {
      store.rejectBooking(bookingId);
      toast.success('Player removed — slot freed up');
    }
    setRefresh(n => n + 1);
  };

  const handleAddPublicAnn = () => {
    if (publicAnnInput.trim()) {
      store.updateEventAnnouncements(event.id, [...event.publicAnnouncements, publicAnnInput.trim()], event.exclusiveReveals);
      setPublicAnnInput('');
      setRefresh(n => n + 1);
      toast.success('Public announcement added');
    }
  };

  const handleAddReveal = () => {
    if (revealInput.trim()) {
      store.updateEventAnnouncements(event.id, event.publicAnnouncements, [...event.exclusiveReveals, revealInput.trim()]);
      setRevealInput('');
      setRefresh(n => n + 1);
      toast.success('Exclusive reveal added');
    }
  };

  const handleRemovePublicAnn = (index: number) => {
    store.updateEventAnnouncements(event.id, event.publicAnnouncements.filter((_, i) => i !== index), event.exclusiveReveals);
    setRefresh(n => n + 1);
  };

  const handleRemoveReveal = (index: number) => {
    store.updateEventAnnouncements(event.id, event.publicAnnouncements, event.exclusiveReveals.filter((_, i) => i !== index));
    setRefresh(n => n + 1);
  };

  const handleUpdateCourt = (hour: string, courtStr: string) => {
    const courts = courtStr.split(',').map(c => c.trim()).filter(Boolean);
    const newAssignments = { ...event.courtAssignments, [hour]: courts };
    store.updateCourtAssignments(event.id, newAssignments);
    setRefresh(n => n + 1);
    toast.success('Court assignment updated');
  };

  const handleReply = (reviewId: string) => {
    const reply = replyInput[reviewId];
    if (!reply?.trim()) {
      toast.error('Please enter a reply');
      return;
    }
    store.replyToReview(reviewId, reply);
    setReplyInput(prev => ({ ...prev, [reviewId]: '' }));
    setShowReplyForm(prev => ({ ...prev, [reviewId]: false }));
    setRefresh(n => n + 1);
    toast.success('Reply posted!');
  };

  const reviews = store.listReviewsByEvent(event.id);

  const hours = Array.from(new Set(timeslots.map(ts => {
    const timeMatch = ts.label.match(/:\s*(.*)/);
    return timeMatch ? timeMatch[1] : ts.label;
  })));

  return (
    <div className="container py-10 px-4 max-w-6xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/organizer/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8 mb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold" style={{ color: '#111' }}>{event.venue}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(event.date).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {event.organizerPhone || 'No phone set'}</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl border bg-card shadow-sm flex items-center justify-around gap-4 h-fit">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Players</span>
            <span className="text-xl font-bold">{timeslots.reduce((a, t) => a + t.currentCapacity, 0)}</span>
          </div>
          <div className="h-8 w-[1px] bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Revenue</span>
            <span className="text-xl font-bold" style={{ color: '#1A7A4A' }}>${timeslots.reduce((a, t) => a + t.currentCapacity * t.price, 0)}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-10">
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><List className="h-5 w-5 text-accent" /> Timeslots & Bookings</h2>
            {timeslots.map(slot => {
              const pct = Math.round((slot.currentCapacity / slot.maxCapacity) * 100);
              const isExpanded = expandedSlots[slot.id];

              return (
                <Card key={slot.id} className={`overflow-hidden border-accent/10 transition-all ${isExpanded ? 'ring-1 ring-accent' : ''}`}>
                  <CardHeader className="bg-muted/20 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-lg">{slot.label}</CardTitle>
                        <CardDescription className="flex items-center gap-2"><DollarSign className="h-3 w-3" /> {slot.price} / player</CardDescription>
                      </div>
                      <div className="flex items-center gap-6 flex-1 max-w-md">
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">Players registered: <strong>{slot.currentCapacity}</strong></span>
                            <span className="font-medium">Total slots: <strong>{slot.maxCapacity}</strong></span>
                          </div>
                          <Progress value={pct} className="h-2 bg-muted overflow-hidden"><div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} /></Progress>
                          {/* Slot management controls */}
                          <div className="flex items-center gap-2 pt-2">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Adjust slots:</span>
                            <div className="flex items-center gap-1 rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(26,122,74,0.3)' }}>
                              <button
                                className="px-2.5 py-1 text-sm font-bold transition-colors hover:bg-red-50"
                                style={{ color: '#ef4444' }}
                                onClick={() => handleAdjustCapacity(slot.id, -1)}
                                title="Reduce slots"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="px-2 py-1 text-sm font-bold border-x" style={{ minWidth: 32, textAlign: 'center', borderColor: 'rgba(26,122,74,0.2)' }}>{slot.maxCapacity}</span>
                              <button
                                className="px-2.5 py-1 text-sm font-bold transition-colors hover:bg-green-50"
                                style={{ color: '#1A7A4A' }}
                                onClick={() => handleAdjustCapacity(slot.id, 1)}
                                title="Increase slots"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{slot.maxCapacity - slot.currentCapacity} remaining</span>
                          </div>
                          {slotWarning[slot.id] && (
                            <div className="flex items-center gap-1.5 mt-1 px-2 py-1.5 rounded-lg text-[10px] font-medium" style={{ background: '#FEF2F2', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                              {slotWarning[slot.id]}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => toggleExpand(slot.id)}>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          <span className="ml-2">{isExpanded ? 'Collapse' : 'Players'}</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="p-0 border-t">
                      {/* Bulk actions bar */}
                      {slot.bookings.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-muted/30 border-b">
                          <span className="text-xs text-muted-foreground font-bold">{selectedBookings.size > 0 ? `${selectedBookings.size} selected` : 'Bulk actions:'}</span>
                          <Button size="sm" variant="outline" className="h-7 text-xs rounded-full" style={{ color: '#1A7A4A', borderColor: '#1A7A4A' }} onClick={handleBulkMarkPaid}>
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Mark Selected as Paid
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs rounded-full" onClick={handleBulkSendReminder}>
                            <Bell className="mr-1 h-3 w-3" /> Send Reminder
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs rounded-full" style={{ color: '#C47A00', borderColor: '#C47A00' }} onClick={handleBulkMoveWaitlist}>
                            <List className="mr-1 h-3 w-3" /> Move to Waitlist
                          </Button>
                        </div>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead>Booking Status</TableHead>
                            <TableHead>Payment Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {slot.bookings.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">No bookings yet.</TableCell></TableRow>
                          ) : (
                            slot.bookings.map(b => {
                              const pmt = paymentStatus[b.id] || (b.paymentRef ? 'paid' : 'pending');
                              const pmtColor = pmt === 'paid' ? '#1A7A4A' : pmt === 'pending' ? '#C47A00' : pmt === 'refunded' ? '#1A6FA8' : '#dc2626';
                              const pmtBg = pmt === 'paid' ? '#F0FDF4' : pmt === 'pending' ? '#FEF9EC' : pmt === 'refunded' ? '#EFF6FF' : '#FEF2F2';
                              const isSelected = selectedBookings.has(b.id);
                              return (
                                <TableRow key={b.id} className={isSelected ? 'bg-accent/5' : ''}>
                                  <TableCell>
                                    <button onClick={() => toggleSelectBooking(b.id)} className="text-muted-foreground hover:text-accent transition-colors">
                                      {isSelected ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
                                    </button>
                                  </TableCell>
                                  <TableCell className="font-medium">{b.playerName}</TableCell>
                                  <TableCell>
                                    <Badge style={{ background: b.status === 'confirmed' ? '#1A7A4A' : 'transparent', color: b.status === 'confirmed' ? '#fff' : '#C47A00', borderColor: b.status === 'confirmed' ? '#1A7A4A' : '#C47A00' }}>
                                      {b.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <select
                                      className="text-[11px] font-bold px-2 py-0.5 rounded-full border cursor-pointer"
                                      style={{ background: pmtBg, color: pmtColor, borderColor: pmtColor + '44' }}
                                      value={pmt}
                                      onChange={e => setPaymentStatus(prev => ({ ...prev, [b.id]: e.target.value as any }))}
                                    >
                                      <option value="paid">● Paid</option>
                                      <option value="pending">● Pending</option>
                                      <option value="refunded">● Refunded</option>
                                      <option value="cancelled">● Cancelled</option>
                                    </select>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      {b.status === 'pending' && (
                                        <>
                                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2 rounded-full" style={{ color: '#1A7A4A' }} onClick={() => handleBookingStatus(b.id, 'confirmed')}>
                                            <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2 rounded-full text-destructive" onClick={() => handleBookingStatus(b.id, 'rejected')}>
                                            <XCircle className="mr-1 h-3 w-3" /> Remove
                                          </Button>
                                        </>
                                      )}
                                      {b.status === 'confirmed' && (
                                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2 rounded-full" onClick={() => { toast.success(`Reminder sent to ${b.playerName}`); }}>
                                          <Send className="mr-1 h-3 w-3" /> Remind
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>

                      {/* Waitlist Section */}
                      {slot.waitlistEntries.length > 0 && (
                        <div className="border-t p-4 bg-amber-50/30">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-3">
                            <List className="h-3 w-3" /> Waitlist ({slot.waitlistEntries.length})
                          </div>
                          <div className="space-y-2">
                            {slot.waitlistEntries.map((entry) => (
                              <div key={entry.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-background border">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 text-right text-muted-foreground font-mono">#{entry.position}</span>
                                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                                  <span className="font-medium">{entry.playerName}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => { store.removeFromWaitlist(entry.id); setRefresh(n => n + 1); toast.success('Removed from waitlist'); }}
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Event Reviews Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-accent" /> Event Reviews</h2>
              <div className="flex items-center gap-1 font-bold text-sm px-3 py-1 rounded-full" style={{ background: '#FEF3C7', color: '#C47A00' }}>
                <Star className="h-4 w-4" style={{ fill: '#C47A00', color: '#C47A00' }} /> {store.getAverageRating(event.id)}
              </div>
            </div>

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <Card className="p-12 text-center border-dashed bg-muted/5">
                  <p className="text-muted-foreground text-sm">No reviews received for this event yet.</p>
                </Card>
              ) : (
                reviews.map(rev => {
                  const revUser = store.getUser(rev.userId);
                  return (
                    <Card key={rev.id} className="overflow-hidden border-accent/10">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                              {getPlayerDisplayName(revUser).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{getPlayerDisplayName(revUser)}</p>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`h-2.5 w-2.5 ${s <= rev.rating ? 'text-mustard-yellow fill-mustard-yellow' : 'text-muted-foreground/20'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm italic text-secondary-foreground">"{rev.comment}"</p>
                        
                        {rev.reply ? (
                          <div className="p-4 rounded-xl bg-green-50/50 border-l-4 border-jade-green space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-jade-green">Your Reply</p>
                            <p className="text-xs">"{rev.reply}"</p>
                          </div>
                        ) : (
                          <div className="pt-2">
                            {showReplyForm[rev.id] ? (
                              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <textarea 
                                  placeholder="Type your reply..."
                                  className="w-full min-h-[80px] p-3 text-xs rounded-xl border-2 border-accent/10 focus:border-accent/30 focus:ring-0 resize-none"
                                  value={replyInput[rev.id] || ''}
                                  onChange={e => setReplyInput(prev => ({ ...prev, [rev.id]: e.target.value }))}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" className="bg-accent h-8" onClick={() => handleReply(rev.id)}>Post Reply</Button>
                                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowReplyForm(prev => ({ ...prev, [rev.id]: false }))}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-[10px] font-bold uppercase tracking-widest text-accent border-accent/20 hover:bg-accent/5"
                                onClick={() => setShowReplyForm(prev => ({ ...prev, [rev.id]: true }))}
                              >
                                <MessageSquare className="mr-2 h-3 w-3" /> Reply to Review
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Add Timeslot Card */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2"><Clock className="h-5 w-5 text-accent" /> Timeslots</h2>
              <Button
                size="sm"
                className="rounded-full font-bold"
                style={{ background: showAddSlot ? '#e5e7eb' : '#1A7A4A', color: showAddSlot ? '#111' : '#fff' }}
                onClick={() => setShowAddSlot(!showAddSlot)}
              >
                {showAddSlot ? 'Cancel' : <><Plus className="mr-1 h-3.5 w-3.5" /> Add Timeslot</>}
              </Button>
            </div>

            <AnimatePresence>
              {showAddSlot && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-2 overflow-hidden" style={{ borderColor: 'rgba(26,122,74,0.25)', background: '#F0FDF4' }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#1A7A4A' }}>
                        <Plus className="h-4 w-4" /> New Timeslot
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Label</Label>
                        <Input
                          placeholder="e.g. 2hr: 7-9pm"
                          value={newSlot.label}
                          onChange={e => setNewSlot(s => ({ ...s, label: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price ($)</Label>
                          <Input
                            type="number"
                            placeholder="e.g. 40"
                            value={newSlot.price}
                            onChange={e => setNewSlot(s => ({ ...s, price: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Capacity</Label>
                          <Input
                            type="number"
                            placeholder="e.g. 8"
                            value={newSlot.maxCapacity}
                            onChange={e => setNewSlot(s => ({ ...s, maxCapacity: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Time</Label>
                          <Input
                            type="time"
                            value={newSlot.startTime}
                            onChange={e => setNewSlot(s => ({ ...s, startTime: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duration</Label>
                          <select
                            value={newSlot.duration}
                            onChange={e => setNewSlot(s => ({ ...s, duration: e.target.value }))}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="1HR">1 Hour</option>
                            <option value="2HR">2 Hours</option>
                            <option value="3HR">3 Hours</option>
                            <option value="4HR">4 Hours</option>
                          </select>
                        </div>
                      </div>
                      <Button
                        className="w-full rounded-full font-bold"
                        style={{ background: '#1A7A4A', color: '#fff' }}
                        onClick={handleAddTimeslot}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Timeslot
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Participant Visibility Setting */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5 text-accent" /> Participant Visibility</h2>
            <Card className="border-accent/10">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground">Control whether players can see who else has joined.</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['public', 'private'] as const).map(v => {
                    const isActive = (event.participantVisibility || 'public') === v;
                    return (
                      <button
                        key={v}
                        onClick={() => { store.updateEventVisibility(event.id, v); setRefresh(n => n + 1); toast.success(`Participant list set to ${v}`); }}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all ${isActive ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30'}`}
                      >
                        {v === 'public' ? <Globe className="h-4 w-4 flex-shrink-0" style={{ color: isActive ? '#1A7A4A' : undefined }} /> : <Lock className="h-4 w-4 flex-shrink-0" style={{ color: isActive ? '#1A7A4A' : undefined }} />}
                        <span className="capitalize" style={{ color: isActive ? '#1A7A4A' : undefined }}>{v}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground p-2 rounded-lg bg-muted/40">
                  {(event.participantVisibility || 'public') === 'public'
                    ? '✅ Players can see who has joined this activity'
                    : '🔒 Players only see slot counts — names are hidden'}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Announcements & Reveals Management */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><MessageCircle className="h-5 w-5 text-accent" /> Manage Content</h2>
            
            <Card className="border-secondary-foreground/10 bg-secondary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">📢 Public Announcements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Add announcement..." value={publicAnnInput} onChange={e => setPublicAnnInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddPublicAnn()} />
                  <Button size="sm" onClick={handleAddPublicAnn}>Add</Button>
                </div>
                <div className="space-y-2">
                  {event.publicAnnouncements.map((a, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-2 rounded border text-xs">
                      <span>• {a}</span>
                      <button onClick={() => handleRemovePublicAnn(i)} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-jade-green/10 bg-green-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-[#00A86B]"><Unlock className="h-4 w-4" /> Exclusive Reveals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Add reveal info..." value={revealInput} onChange={e => setRevealInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddReveal()} />
                  <Button size="sm" onClick={handleAddReveal} className="bg-[#00A86B] hover:bg-[#008F5A]">Add</Button>
                </div>
                <div className="space-y-2">
                  {event.exclusiveReveals.map((r, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-[#00A86B]/20 text-xs">
                      <span className="flex items-center gap-1"><Unlock className="h-3 w-3 text-[#00A86B]" /> {r}</span>
                      <button onClick={() => handleRemoveReveal(i)} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">🔓 Court Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hours.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Add timeslots first to set court assignments.</p>
                ) : (
                  hours.map(hour => (
                    <div key={hour} className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">{hour}</Label>
                      <div className="flex gap-2">
                        <Input 
                          defaultValue={(event.courtAssignments[hour] || []).join(', ')} 
                          placeholder="e.g. Court 1, Court 2"
                          onBlur={e => handleUpdateCourt(hour, e.target.value)}
                        />
                      </div>
                    </div>
                  ))
                )}
                <p className="text-[10px] text-muted-foreground italic">Separate court names with commas. Auto-saves on blur.</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
