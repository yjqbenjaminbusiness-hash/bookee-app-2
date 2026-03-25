import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { Shuffle, MapPin, Calendar, Users, ArrowLeft, Loader2 } from 'lucide-react';

export default function CreateBallotSession() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [activityName, setActivityName] = useState('');
  const [sport, setSport] = useState('');
  const [location, setLocation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [slots, setSlots] = useState('10');

  if (!isAuthenticated) {
    navigate('/login?redirect=/organizer/create-ballot');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    const { error } = await supabase.from('ballots').insert({
      activity_name: activityName,
      sport,
      location,
      ballot_deadline: deadline,
      slots: parseInt(slots) || 10,
      created_by: user.id,
    });

    setIsLoading(false);

    if (error) {
      toast.error('Failed to create ballot: ' + error.message);
      return;
    }

    toast.success('Ballot Group created!');
    navigate('/organizer/dashboard');
  };

  return (
    <div className="container py-10 px-4 max-w-3xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/organizer/create-event-type')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Shuffle className="h-7 w-7 text-accent" /> Create Ballot Group
        </h1>
        <p className="text-muted-foreground">Set up a ballot for users to join. No payment fields — focus on participation only.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm border-accent/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> Ballot Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Activity Name</Label>
              <Input placeholder="e.g. Weekly Badminton Court Ballot" value={activityName} onChange={e => setActivityName(e.target.value)} required />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sport</Label>
                <Input placeholder="e.g. Badminton, Futsal" value={sport} onChange={e => setSport(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="e.g. Senja Cashew Sports Hall" value={location} onChange={e => setLocation(e.target.value)} required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Ballot Deadline</Label>
                <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Users className="h-3 w-3" /> Available Slots</Label>
                <Input type="number" min="1" value={slots} onChange={e => setSlots(e.target.value)} required />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="ghost" type="button" onClick={() => navigate('/organizer/create-event-type')}>Cancel</Button>
          <Button size="lg" className="bg-accent hover:bg-accent/90 px-10 rounded-full" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Ballot Group
          </Button>
        </div>
      </form>
    </div>
  );
}
