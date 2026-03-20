import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { store } from '../../lib/mockData';
import { Card } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Calendar, Clock, DollarSign, MapPin, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PlayerBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, setRefresh] = useState(0);

  if (!user) return null;

  const bookings = store.listBookingsByUser(user.id);

  const enriched = bookings.map(b => {
    const slot = store.getTimeslot(b.timeslotId);
    const evt = slot ? store.getEvent(slot.eventId) : undefined;
    return {
      ...b,
      venue: evt?.venue || 'Unknown',
      slotLabel: slot?.label || 'Unknown',
      date: evt?.date || '',
    };
  });

  return (
    <div className="container py-10 px-4 max-w-6xl">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display font-bold">My Game Bookings</h1>
        <p className="text-muted-foreground">Manage your session status, payments, and references</p>
      </div>

      <Card className="shadow-elegant border-primary/10 overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow>
              <TableHead className="font-bold text-secondary-foreground">Venue & Date</TableHead>
              <TableHead className="font-bold text-secondary-foreground">Timeslot</TableHead>
              <TableHead className="font-bold text-secondary-foreground">Amount</TableHead>
              <TableHead className="font-bold text-secondary-foreground">Status</TableHead>
              <TableHead className="font-bold text-secondary-foreground">Reference</TableHead>
              <TableHead className="font-bold text-secondary-foreground text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enriched.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 bg-muted/10">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-secondary/50"><Calendar className="h-10 w-10 text-secondary-foreground/40" /></div>
                    <p className="text-muted-foreground font-medium">You haven't booked any sessions yet.</p>
                    <Button className="rounded-full px-8" onClick={() => navigate('/player/events')}>Find a Game</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              enriched.map((b) => (
                <TableRow key={b.id} className="hover:bg-secondary/5 transition-colors">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-secondary-foreground flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> {b.venue}</span>
                      <span className="text-xs text-muted-foreground font-medium">{b.date ? new Date(b.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm font-medium"><Clock className="h-3 w-3 text-muted-foreground" /> {b.slotLabel}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-bold text-lg" style={{ color: '#111' }}><DollarSign className="h-4 w-4" /> {b.amount}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={b.status === 'confirmed' ? 'bg-jade-green border-none' : 'bg-mustard-yellow border-none'}>
                      {b.status === 'confirmed' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                      {b.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground">{b.paymentRef || '—'}</TableCell>
                  <TableCell className="text-right">
                    {b.status === 'pending' ? (
                      <Button size="sm" className="h-9 rounded-full bg-primary hover:bg-primary/90 px-6 font-bold shadow-sm" onClick={() => navigate(`/player/payment/${b.id}`)}>
                        Pay Now <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-primary font-bold hover:bg-primary/10 rounded-full" onClick={() => navigate(`/player/events/${store.getTimeslot(b.timeslotId)?.eventId}`)}>
                        Details
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
