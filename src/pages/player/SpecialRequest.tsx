import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { store } from '../../lib/mockData';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, Send, Loader2, Sparkles, DollarSign } from 'lucide-react';

const VENUES = [
  'Senja Cashew Sports Hall',
  'Demo Activity CCAB',
  'Tampines Hub',
  'Jurong East Sports Centre',
  'Clementi Sports Hall',
];

const RATE_PER_HOUR = 20;

export default function SpecialRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('20:00');
  const [note, setNote] = useState('');

  const { hours, estimatedPrice } = useMemo(() => {
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    const startMins = (startParts[0] || 0) * 60 + (startParts[1] || 0);
    const endMins = (endParts[0] || 0) * 60 + (endParts[1] || 0);
    const diffMins = endMins - startMins;
    const h = Math.max(0, diffMins / 60);
    return { hours: h, estimatedPrice: Math.round(h * RATE_PER_HOUR) };
  }, [startTime, endTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (hours <= 0) {
      toast.error('End time must be after start time');
      return;
    }
    setIsLoading(true);

    setTimeout(() => {
      store.createSpecialRequest(user.id, venue, date, startTime, endTime, estimatedPrice);
      toast.success('Special request submitted! Organizers will review it.');
      navigate('/player/dashboard');
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="container py-10 px-4 max-w-2xl">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Special Request
        </h1>
        <p className="text-muted-foreground">Can't find a slot that fits? Request a custom time.</p>
      </div>

      <Card className="shadow-sm border-primary/5 overflow-hidden">
        <div className="h-2 bg-primary" />
        <CardHeader>
          <CardTitle>Request Custom Timing</CardTitle>
          <CardDescription>Organizers will review and create a timeslot if available.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Venue Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="venue">Preferred Venue</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  id="venue"
                  className="w-full pl-10 h-10 rounded-md border bg-background text-sm"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required
                >
                  <option value="">Select a venue...</option>
                  {VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Preferred Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="date" type="date" className="pl-10" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
            </div>

            {/* 2 & 3. Start + End Time Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="start" type="time" className="pl-10" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="end" type="time" className="pl-10" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
              </div>
            </div>

            {/* 4 & 5. Estimated Price Calculation */}
            <div className={`p-4 rounded-xl border-2 space-y-2 ${hours > 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-muted'}`}>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-bold">Price Estimate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  ({endTime} - {startTime}) = <strong>{hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : 'Invalid'}</strong>
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  {hours > 0 ? `${hours} hours × $${RATE_PER_HOUR}/hr` : '—'}
                </span>
                <span className="text-2xl font-display font-bold text-primary">
                  ${hours > 0 ? estimatedPrice : '0'}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="note">Additional Notes</Label>
              <Textarea
                id="note"
                placeholder="Number of courts, specific sports, group size..."
                className="min-h-[80px]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border text-xs text-muted-foreground">
              <strong>Note:</strong> Pricing is estimated at ${RATE_PER_HOUR}/hr. Organizers may provide a different final quote.
            </div>

            {/* 6. Submit */}
            <Button className="w-full h-12 rounded-full font-bold text-lg" type="submit" disabled={isLoading || hours <= 0}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending Request...</>
              ) : (
                <><Send className="mr-2 h-5 w-5" /> Submit Request</>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t bg-muted/20">
          <Button variant="link" className="text-xs text-muted-foreground" onClick={() => navigate('/player/events')}>
            Back to browsing events
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
