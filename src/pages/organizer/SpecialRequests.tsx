import { useState } from 'react';
import { store } from '../../lib/mockData';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, MapPin, User, DollarSign } from 'lucide-react';

export default function OrganizerSpecialRequests() {
  const [, setRefresh] = useState(0);

  const requests = store.listSpecialRequests().map(r => {
    const u = store.getUser(r.userId);
    return { ...r, playerEmail: u?.email || u?.displayName || 'Unknown' };
  });

  const handleAction = (id: string, approve: boolean) => {
    if (approve) {
      store.approveSpecialRequest(id);
      toast.success('Request approved!');
    } else {
      store.rejectSpecialRequest(id);
      toast.info('Request rejected');
    }
    setRefresh(n => n + 1);
  };

  return (
    <div className="container py-10 px-4">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display font-bold text-accent">Special Requests</h1>
        <p className="text-muted-foreground">Approve or reject custom timeslot requests from players</p>
      </div>

      <Card className="shadow-sm border-accent/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Venue & Date</TableHead>
              <TableHead>Proposed Time</TableHead>
              <TableHead>Est. Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">No special requests found.</TableCell>
              </TableRow>
            ) : (
              requests.map(req => (
                <TableRow key={req.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{req.playerEmail}</span></div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-accent" /> {req.venue}</span>
                      <span className="text-xs text-muted-foreground">{new Date(req.date).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-mono text-sm"><Clock className="h-3 w-3" /> {req.startTime} - {req.endTime}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-semibold"><DollarSign className="h-3 w-3" /> {req.price}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={req.status === 'approved' ? 'default' : req.status === 'pending' ? 'outline' : 'destructive'} className={req.status === 'approved' ? 'bg-green-500' : ''}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {req.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="text-destructive border-destructive h-8 px-3" onClick={() => handleAction(req.id, false)}>
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 h-8 px-3" onClick={() => handleAction(req.id, true)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      </div>
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
