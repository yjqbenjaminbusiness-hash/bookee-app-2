import { store } from '../../lib/mockData';
import { Card } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { MapPin, Calendar, User } from 'lucide-react';

export default function AdminEvents() {
  const events = store.listEvents();

  return (
    <div className="container py-10 px-4">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display font-bold">System Events</h1>
        <p className="text-muted-foreground">All sports events created system-wide</p>
      </div>

      <Card className="shadow-sm border-primary/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Venue & Date</TableHead>
              <TableHead>Organizer</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No events found.</TableCell></TableRow>
            ) : (
              events.map(event => {
                const organizer = store.getUser(event.userId);
                return (
                  <TableRow key={event.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-medium"><MapPin className="h-3 w-3 text-primary" />{event.venue}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{event.date}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm"><User className="h-3 w-3 text-muted-foreground" />{organizer?.email || event.userId}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{event.description || 'No description'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(event.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
