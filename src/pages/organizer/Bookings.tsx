import { useAuth } from '../../hooks/useAuth';
import { store, getPlayerDisplayName } from '../../lib/mockData';
import { Card } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { User, Clock, DollarSign, ShieldCheck } from 'lucide-react';

export default function OrganizerBookings() {
  const { user } = useAuth();
  if (!user) return null;

  const events = store.listEventsByUser(user.id);
  const allBookings = events.flatMap(evt => {
    const slots = store.listTimeslotsByEvent(evt.id);
    return slots.flatMap(slot => {
      return store.listBookingsByTimeslot(slot.id).map(b => {
        const player = store.getUser(b.userId);
        return {
          ...b,
          playerName: getPlayerDisplayName(player),
          slotLabel: slot.label,
          venue: evt.venue,
        };
      });
    });
  });

  return (
    <div className="container py-10 px-4 max-w-6xl">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display font-bold text-accent">All Event Bookings</h1>
        <p className="text-muted-foreground">Detailed overview of player payments and slot status</p>
      </div>

      <Card className="shadow-elegant border-accent/10 overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow>
              <TableHead className="font-bold text-secondary-foreground">Player</TableHead>
              <TableHead className="font-bold text-secondary-foreground">Event & Slot</TableHead>
              <TableHead className="font-bold text-secondary-foreground">Amount</TableHead>
              <TableHead className="font-bold text-secondary-foreground">Status</TableHead>
              <TableHead className="font-bold text-secondary-foreground">Reference</TableHead>
              <TableHead className="font-bold text-secondary-foreground text-right">Booked Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic bg-muted/10">No bookings found for your events.</TableCell>
              </TableRow>
            ) : (
              allBookings.map(b => (
                <TableRow key={b.id} className="hover:bg-secondary/5 transition-colors">
                  <TableCell><div className="flex items-center gap-3 font-bold"><div className="p-2 rounded-full bg-secondary/50"><User className="h-4 w-4 text-secondary-foreground" /></div>{b.playerName}</div></TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-secondary-foreground">{b.venue}</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {b.slotLabel}</span>
                    </div>
                  </TableCell>
                  <TableCell><div className="flex items-center gap-1 font-bold text-lg text-jade-green"><DollarSign className="h-4 w-4" /> {b.amount}</div></TableCell>
                  <TableCell>
                    <Badge className={b.status === 'confirmed' ? 'bg-jade-green border-none' : 'bg-mustard-yellow border-none'}>
                      {b.status === 'confirmed' && <ShieldCheck className="h-3 w-3 mr-1" />}{b.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground">{b.paymentRef || 'N/A'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground text-right">{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
