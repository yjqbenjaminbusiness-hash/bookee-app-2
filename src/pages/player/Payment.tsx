import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { store } from '@/lib/mockData';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Copy, Download, CreditCard, QrCode, Shield, Loader2 } from 'lucide-react';

export default function PaymentPage() {
  const { timeslotId } = useParams();
  const navigate = useNavigate();
  const { user, isSupabaseAuth, session } = useAuth();

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [showCardFallback, setShowCardFallback] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');

  const timeslot = timeslotId ? store.getTimeslot(timeslotId) : undefined;
  const event = timeslot ? store.getEvent(timeslot.eventId) : undefined;
  const booking = user ? store.listBookingsByUser(user.id).find((b: any) => b.timeslotId === timeslotId) : undefined;

  const activityName = event?.venue || 'Activity';
  const organizerName = 'Organizer';
  const amount = timeslot?.price || 15;
  const platformFee = Math.round(amount * 0.02 * 100) / 100;
  const totalAmount = amount + platformFee;

  const paymentRef = `BK-${(timeslotId || '').slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  useEffect(() => {
    if (isConfirmed) return;
    const deadline = Date.now() + 5 * 60 * 60 * 1000;
    const timer = setInterval(() => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) { setCountdown('EXPIRED'); clearInterval(timer); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [isConfirmed]);

  const createPaymentIntent = useCallback(async () => {
    if (!isSupabaseAuth || !session) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { session_id: timeslotId, amount: Math.round(amount * 100), activity_name: activityName, organizer_name: organizerName },
      });
      if (error) throw error;
      if (data?.payment_intent_id) setPaymentIntentId(data.payment_intent_id);
    } catch (e) { console.error('Payment intent creation failed:', e); }
    setIsLoading(false);
  }, [isSupabaseAuth, session, timeslotId, amount, activityName, organizerName]);

  useEffect(() => { if (isSupabaseAuth && session) createPaymentIntent(); }, [createPaymentIntent, isSupabaseAuth, session]);

  const checkPayment = async () => {
    setIsCheckingPayment(true);
    if (paymentIntentId && isSupabaseAuth) {
      try {
        const { data } = await supabase.functions.invoke('check-payment', {
          body: { payment_intent_id: paymentIntentId, booking_id: booking?.id },
        });
        if (data?.status === 'paid') { setIsConfirmed(true); toast.success('Payment confirmed ✅ Your slot is secured 🎉'); setIsCheckingPayment(false); return; }
      } catch (e) { console.error('Payment check failed:', e); }
    }
    if (booking) { store.confirmBooking(booking.id, paymentRef); setIsConfirmed(true); toast.success('Payment confirmed ✅ Your slot is secured 🎉'); }
    else { toast.info('Payment not detected yet. Please try again or contact organizer.'); }
    setIsCheckingPayment(false);
  };

  const copyRef = () => { navigator.clipboard.writeText(paymentRef); toast.success('Reference copied!'); };
  const downloadQR = () => { toast.info('QR code downloaded'); };

  if (isConfirmed) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Card className="text-center border-primary/20 shadow-elegant">
            <CardContent className="py-12 space-y-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-10 h-10 text-primary" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Payment Confirmed!</h2>
                <p className="text-muted-foreground mt-2">Your slot is secured 🎉</p>
              </div>
              <div className="space-y-3">
                <Button className="w-full bg-primary text-primary-foreground" onClick={() => navigate('/player/dashboard')}>Go to My Bookee</Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/player/bookings')}>View Bookings</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <Card className="border-primary/10 shadow-elegant">
        <CardHeader>
          <CardTitle className="text-xl font-display">Payment</CardTitle>
          <CardDescription>
            {countdown && countdown !== 'EXPIRED' && <span className="text-sm">Complete within: <span className="font-mono font-semibold text-foreground">{countdown}</span></span>}
            {countdown === 'EXPIRED' && <span className="text-destructive font-semibold">Payment window expired</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Activity Summary */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Activity</span><span className="text-sm font-semibold">{activityName}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Organizer</span><span className="text-sm">{organizerName}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Amount</span><span className="text-sm">SGD ${amount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Platform fee</span><span className="text-sm text-muted-foreground">SGD ${platformFee.toFixed(2)}</span></div>
            <div className="border-t pt-2 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-primary">SGD ${totalAmount.toFixed(2)}</span></div>
            <p className="text-xs text-muted-foreground">Platform fee included</p>
          </div>

          {/* PayNow / Card toggle */}
          <AnimatePresence mode="wait">
            {!showCardFallback ? (
              <motion.div key="paynow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-3">
                    <QrCode className="w-4 h-4 text-primary" /><span className="text-sm font-semibold text-primary">PayNow</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Scan this QR using your banking app to pay</p>
                </div>
                <div className="flex justify-center">
                  <div className="w-48 h-48 bg-white border-2 border-border rounded-xl p-3 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <rect fill="white" width="200" height="200"/>
                      <rect x="10" y="10" width="50" height="50" fill="black"/><rect x="140" y="10" width="50" height="50" fill="black"/><rect x="10" y="140" width="50" height="50" fill="black"/>
                      <rect x="20" y="20" width="30" height="30" fill="white"/><rect x="150" y="20" width="30" height="30" fill="white"/><rect x="20" y="150" width="30" height="30" fill="white"/>
                      <rect x="28" y="28" width="14" height="14" fill="black"/><rect x="158" y="28" width="14" height="14" fill="black"/><rect x="28" y="158" width="14" height="14" fill="black"/>
                      <rect x="70" y="10" width="10" height="10" fill="black"/><rect x="90" y="10" width="10" height="10" fill="black"/><rect x="110" y="10" width="10" height="10" fill="black"/>
                      <rect x="70" y="30" width="10" height="10" fill="black"/><rect x="90" y="40" width="10" height="10" fill="black"/><rect x="110" y="30" width="10" height="10" fill="black"/>
                      <rect x="70" y="70" width="10" height="10" fill="black"/><rect x="80" y="80" width="10" height="10" fill="black"/><rect x="100" y="70" width="10" height="10" fill="black"/>
                      <rect x="90" y="90" width="10" height="10" fill="black"/><rect x="110" y="100" width="10" height="10" fill="black"/>
                      <rect x="140" y="140" width="10" height="10" fill="black"/><rect x="160" y="150" width="10" height="10" fill="black"/><rect x="170" y="170" width="10" height="10" fill="black"/>
                    </svg>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
                  <div><p className="text-xs text-muted-foreground">Payment Reference</p><p className="font-mono text-sm font-semibold">{paymentRef}</p></div>
                  <Button variant="ghost" size="icon" onClick={copyRef}><Copy className="w-4 h-4" /></Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={downloadQR} className="gap-2"><Download className="w-4 h-4" /> Download QR</Button>
                  <Button className="gap-2 bg-primary text-primary-foreground" onClick={checkPayment} disabled={isCheckingPayment}>
                    {isCheckingPayment ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</> : <><Check className="w-4 h-4" /> I Have Paid</>}
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <Shield className="w-3 h-3" /><span>Payments are processed via a MAS-regulated payment provider</span>
                </div>
                <div className="text-center">
                  <button onClick={() => setShowCardFallback(true)} className="text-xs text-muted-foreground hover:text-foreground underline transition-colors">
                    Pay with Card (higher fees may apply)
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full mb-3">
                    <CreditCard className="w-4 h-4" /><span className="text-sm font-semibold">Card Payment</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Complete payment with your credit or debit card</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">Card payments may incur additional processing fees.</div>
                <Button className="w-full bg-foreground text-background hover:bg-foreground/90" onClick={() => { toast.info('Redirecting to card payment...'); checkPayment(); }} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                  Pay SGD ${totalAmount.toFixed(2)} with Card
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <Shield className="w-3 h-3" /><span>Payments are processed via a MAS-regulated payment provider</span>
                </div>
                <div className="text-center"><button onClick={() => setShowCardFallback(false)} className="text-xs text-primary hover:underline">← Back to PayNow</button></div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}