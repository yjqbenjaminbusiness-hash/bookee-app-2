import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { store, generatePaymentRef } from '../../lib/mockData';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Clock, CheckCircle2, Loader2, DollarSign, Copy, MapPin, ArrowLeft, AlertTriangle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isSimulating, setIsSimulating] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [countdown, setCountdown] = useState('');

  const booking = bookingId ? store.getBooking(bookingId) : undefined;
  const timeslot = booking ? store.getTimeslot(booking.timeslotId) : undefined;
  const event = timeslot ? store.getEvent(timeslot.eventId) : undefined;

  useEffect(() => {
    if (booking?.status === 'confirmed') setIsConfirmed(true);
  }, [booking]);

  // 5-hour countdown timer
  useEffect(() => {
    if (!event || isConfirmed) return;

    const updateTimer = () => {
      const startStr = timeslot?.label.match(/:\s*(\d+)(?:-)/)?.[1];
      const isPM = timeslot?.label.toLowerCase().includes('pm');
      let startHour = parseInt(startStr || '19');
      if (isPM && startHour !== 12) startHour += 12;
      if (!isPM && startHour === 12) startHour = 0;

      const deadlineDate = new Date(event.date);
      deadlineDate.setHours(startHour - 5, 0, 0, 0);

      const now = new Date();
      const diff = deadlineDate.getTime() - now.getTime();

      if (diff <= 0) { setCountdown('EXPIRED'); return; }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${hours}h ${mins}m ${secs}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event, timeslot, isConfirmed]);

  if (!booking || !timeslot || !event) {
    return <div className="p-20 text-center text-muted-foreground">Booking not found.</div>;
  }

  const paymentRef = generatePaymentRef(event.venue, event.date, timeslot, user?.id || 'XXXX');

  const startMatch = timeslot.label.match(/:\s*(\d+)(-|am|pm)/i);
  const startHourDisplay = startMatch?.[1] || '7';
  const isPMDisplay = timeslot.label.toLowerCase().includes('pm');
  const startHourNum = parseInt(startHourDisplay);
  const deadlineHour = startHourNum - 5;
  const deadlineDisplay = deadlineHour > 0 ? `${deadlineHour}${isPMDisplay ? 'pm' : 'am'}` : `${deadlineHour + 12}am`;

  const simulatePayment = () => {
    setIsSimulating(true);
    toast.info('Simulating transaction...');
    setTimeout(() => {
      store.confirmBooking(bookingId!, paymentRef);
      setIsConfirmed(true);
      setIsSimulating(false);
      toast.success('Payment confirmed! Your slot is secured.');
    }, 3000);
  };

  return (
    <div className="container py-10 px-4 max-w-3xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/player/bookings')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Bookings
      </Button>

      <AnimatePresence mode="wait">
        {!isConfirmed ? (
          <motion.div key="payment" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-display font-bold">Secure Your Slot</h1>
              <p className="text-muted-foreground">Scan the QR code or use the reference below to pay</p>
            </div>

            <div className="grid md:grid-cols-[1fr_300px] gap-8">
              {/* QR Code Card */}
              <Card className="shadow-sm border-primary/10 flex flex-col items-center p-8">
                <div className="bg-foreground p-1 rounded-2xl">
                  <div className="bg-background p-4 rounded-xl">
                    <svg viewBox="0 0 200 200" className="w-48 h-48" xmlns="http://www.w3.org/2000/svg">
                      <rect width="200" height="200" fill="hsl(var(--background))" />
                      <rect x="10" y="10" width="50" height="50" fill="hsl(var(--foreground))" rx="4" />
                      <rect x="17" y="17" width="36" height="36" fill="hsl(var(--background))" rx="2" />
                      <rect x="24" y="24" width="22" height="22" fill="hsl(var(--foreground))" rx="2" />
                      <rect x="140" y="10" width="50" height="50" fill="hsl(var(--foreground))" rx="4" />
                      <rect x="147" y="17" width="36" height="36" fill="hsl(var(--background))" rx="2" />
                      <rect x="154" y="24" width="22" height="22" fill="hsl(var(--foreground))" rx="2" />
                      <rect x="10" y="140" width="50" height="50" fill="hsl(var(--foreground))" rx="4" />
                      <rect x="17" y="147" width="36" height="36" fill="hsl(var(--background))" rx="2" />
                      <rect x="24" y="154" width="22" height="22" fill="hsl(var(--foreground))" rx="2" />
                      {[70,80,90,100,110,120].map(x => [10,30,50,70,90,110,130,150,170].map(y => (
                        <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" fill={(x+y) % 20 === 0 ? 'hsl(var(--background))' : 'hsl(var(--foreground))'} rx="1" />
                      )))}
                      {[10,30,50,130,150,170].map(x => [70,80,90,100,110,120].map(y => (
                        <rect key={`b${x}-${y}`} x={x} y={y} width="8" height="8" fill={(x*y) % 30 < 15 ? 'hsl(var(--foreground))' : 'hsl(var(--background))'} rx="1" />
                      )))}
                      {[140,150,160,170,180].map(x => [140,150,160,170,180].map(y => (
                        <rect key={`c${x}-${y}`} x={x} y={y} width="8" height="8" fill={(x+y) % 20 < 10 ? 'hsl(var(--foreground))' : 'hsl(var(--background))'} rx="1" />
                      )))}
                      <text x="100" y="105" textAnchor="middle" fill="hsl(var(--primary))" fontSize="10" fontWeight="bold">PAYNOW</text>
                    </svg>
                  </div>
                </div>

                <div className="mt-6 w-full space-y-3">
                  {/* Payment ID */}
                  <div className="p-3 rounded-xl border space-y-1" style={{ background: '#E8F7EF', borderColor: '#1A7A4A' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#1A7A4A' }}>Payment ID</p>
                    <p className="font-mono text-sm font-bold text-center tracking-wider" style={{ color: '#111' }}>+65 9123 4567</p>
                    <p className="text-[10px] text-center text-muted-foreground">Payment goes directly to the organizer account.</p>
                  </div>
                  {/* Reference */}
                  <div className="p-3 rounded-xl bg-muted/50 border space-y-1">
                    <div className="flex justify-between items-center text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      <span>Payment Reference</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => { navigator.clipboard.writeText(paymentRef); toast.success('Copied!'); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-mono text-base font-bold text-center tracking-wider">{paymentRef}</p>
                    <p className="text-[10px] text-center text-muted-foreground">Include this reference when paying</p>
                  </div>
                  {/* MAS regulated notice */}
                  <div className="px-3 py-2 rounded-lg border text-[10px] text-muted-foreground text-center" style={{ background: '#F0FDF4', borderColor: '#1A7A4A22' }}>
                    Payments processed through MAS-regulated payment providers.
                  </div>
                  {/* Download QR */}
                  <Button
                    variant="outline"
                    className="w-full rounded-xl font-bold"
                    style={{ borderColor: '#1A7A4A', color: '#1A7A4A' }}
                    onClick={() => toast.success('QR image saved — include reference ' + paymentRef + ' when paying!')}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download QR
                  </Button>
                </div>
              </Card>

              {/* Right: Details + Timer + Refund + Pay button */}
              <div className="space-y-4">
                <Card className="border-primary/5 bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Booking Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Venue</span>
                      <span className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.venue}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Timeslot</span>
                      <span className="font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> {timeslot.label}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Amount Due</span>
                      <span className="text-xl font-bold flex items-center gap-1" style={{ color: '#111' }}><DollarSign className="h-4 w-4" /> {booking.amount}.00</span>
                    </div>
                  </CardContent>
                </Card>

                {/* 5-Hour Timer */}
                <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-bold">5-HOUR PAYMENT TIMER</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Game at <strong>{startHourDisplay}{isPMDisplay ? 'PM' : 'AM'}</strong> → Pay by <strong>{deadlineDisplay.toUpperCase()}</strong>
                  </p>
                  <div className="text-2xl font-mono font-bold text-destructive text-center py-2">
                    {countdown || 'Calculating...'}
                  </div>
                </div>

                {/* Refund Disclaimer */}
                <div className="p-4 rounded-2xl border-2 space-y-2" style={{ borderColor: '#E6B800', background: '#FFF9E6' }}>
                  <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#B8860B' }}>
                    <AlertTriangle className="h-3.5 w-3.5" /> Refunds Handled by Organizer
                  </p>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#7c5300' }}>
                    Bookee does not handle refunds. If you need to cancel:
                  </p>
                  <ul className="text-[11px] space-y-1 leading-relaxed" style={{ color: '#7c5300' }}>
                    <li>• Contact the <strong>organizer directly</strong></li>
                    <li>• They will cancel your slot</li>
                    <li>• They will refund you via <strong>bank transfer</strong></li>
                    <li>• Your slot becomes available for other players</li>
                  </ul>
                </div>

                <Button
                  className="w-full h-14 rounded-full font-bold shadow-sm"
                  style={{ background: '#1A7A4A', color: '#fff' }}
                  disabled={isSimulating}
                  onClick={simulatePayment}
                >
                  {isSimulating ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing (3s)...</>
                  ) : (
                    'Simulate Payment'
                  )}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground">Simulates PayNow webhook after 3 seconds</p>
                <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={() => navigate('/player/bookings')}>
                  Pay later (within 5 hours)
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 space-y-8 text-center">
            <div className="relative">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }} className="p-6 rounded-full" style={{ background: '#1A7A4A', color: '#fff' }}>
                <CheckCircle2 className="h-16 w-16" />
              </motion.div>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-display font-bold tracking-tight">Booking Secured!</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Payment received for {event.venue}.<br />Reference: <strong>{paymentRef}</strong>
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-muted/50 border w-full max-w-md space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge style={{ background: '#1A7A4A', color: '#fff', border: 'none' }}>CONFIRMED</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Timeslot</span>
                <span className="font-bold">{timeslot.label}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="rounded-full px-8" style={{ background: '#1A7A4A', color: '#fff' }} onClick={() => navigate('/player/dashboard')}>Go to Dashboard</Button>
              <Button size="lg" variant="outline" className="rounded-full px-8" onClick={() => navigate('/player/bookings')}>View Bookings</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
