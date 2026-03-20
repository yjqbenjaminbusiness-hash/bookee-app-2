import { useState } from 'react';
import { store } from '../../lib/mockData';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { toast } from 'sonner';
import { CheckCircle, XCircle, User, Clock, ShieldCheck, Mail } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export default function PendingOrganizers() {
  const { refreshUser } = useAuth();
  const [, setRefresh] = useState(0);

  const pendingOrganizers = store.getPendingOrganizers();

  const handleVerify = (userId: string, approve: boolean) => {
    if (approve) {
      store.verifyOrganizer(userId);
      toast.success('Organizer verified successfully!');
    } else {
      store.rejectOrganizer(userId);
      toast.info('Organizer application rejected');
    }
    refreshUser();
    setRefresh(n => n + 1);
  };

  return (
    <div className="container py-10 px-4">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display font-bold">Pending Verifications</h1>
        <p className="text-muted-foreground">Approve or reject organizer applications</p>
      </div>

      {pendingOrganizers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold">All clear!</h3>
          <p className="text-muted-foreground">No pending organizer applications at the moment.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingOrganizers.map((org) => (
            <Card key={org.id} className="overflow-hidden hover:shadow-md transition-all">
              <CardHeader className="bg-muted/50 pb-4">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <Badge variant="outline" className="bg-background">Pending</Badge>
                </div>
                <CardTitle className="mt-4">{org.displayName}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-3 w-3" /> {org.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleVerify(org.id, false)}>
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <Button className="bg-accent hover:bg-accent/90" onClick={() => handleVerify(org.id, true)}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
