import { useNavigate } from 'react-router-dom';
import { store } from '../../lib/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { ShieldCheck, Users, Calendar, TrendingUp, AlertCircle, CheckCircle2, UserCheck, Activity } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const totalUsers = store.users.length;
  const pendingOrgs = store.getPendingOrganizers().length;
  const totalEvents = store.events.length;
  const totalBookings = store.bookings.length;

  const statCards = [
    { title: 'Total Users', value: totalUsers, icon: <Users className="h-5 w-5 text-primary" />, description: 'Players and organizers', color: 'bg-primary/10' },
    { title: 'Pending Verifications', value: pendingOrgs, icon: <ShieldCheck className="h-5 w-5 text-accent" />, description: 'Organizers awaiting approval', color: 'bg-accent/10', action: { label: 'View All', onClick: () => navigate('/admin/pending-organizers') } },
    { title: 'Total Events', value: totalEvents, icon: <Calendar className="h-5 w-5 text-primary" />, description: 'Sports events', color: 'bg-primary/10' },
    { title: 'Total Bookings', value: totalBookings, icon: <TrendingUp className="h-5 w-5 text-green-500" />, description: 'Completed and pending', color: 'bg-green-500/10' },
  ];

  return (
    <div className="container py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of KAKI BOOK SG</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm font-medium">
          <Activity className="h-4 w-4 text-accent animate-pulse" /> System Live
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((card, i) => (
          <Card key={i} className="overflow-hidden border-primary/5 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              {card.action && (
                <Button variant="link" className="p-0 h-auto text-xs mt-3 text-accent" onClick={card.action.onClick}>
                  {card.action.label}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-sm border-primary/5">
          <CardHeader><CardTitle className="text-xl">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="flex flex-col h-auto py-6 gap-2" onClick={() => navigate('/admin/users')}><UserCheck className="h-6 w-6" /> Manage Users</Button>
            <Button variant="outline" className="flex flex-col h-auto py-6 gap-2" onClick={() => navigate('/admin/events')}><Calendar className="h-6 w-6" /> All Events</Button>
            <Button variant="outline" className="flex flex-col h-auto py-6 gap-2" onClick={() => navigate('/admin/pending-organizers')}><CheckCircle2 className="h-6 w-6" /> Verify Orgs</Button>
            <Button variant="outline" className="flex flex-col h-auto py-6 gap-2 opacity-50 cursor-not-allowed"><AlertCircle className="h-6 w-6" /> System Logs</Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/5">
          <CardHeader><CardTitle className="text-xl">Notifications</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOrgs > 0 && (
                <div className="flex gap-4 p-4 rounded-xl bg-accent/5 border border-accent/10">
                  <ShieldCheck className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{pendingOrgs} Pending Organizer(s)</p>
                    <p className="text-xs text-muted-foreground">Review applications in the verification page.</p>
                  </div>
                </div>
              )}
              <div className="flex gap-4 p-4 rounded-xl bg-muted/50 border">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Mock System Active</p>
                  <p className="text-xs text-muted-foreground">Payment simulation and data stored in localStorage.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
