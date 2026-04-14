import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { dataService } from '@/lib/data';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { Shuffle, MapPin, Calendar, Users, ArrowLeft, Loader2, Globe, Lock } from 'lucide-react';
import { GroupSelector } from '../../components/GroupSelector';

export default function CreateBallotSession() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGroup = searchParams.get('group') || '';
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(preselectedGroup);

  const [activityName, setActivityName] = useState('');
  const [sport, setSport] = useState('');
  const [location, setLocation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [slots, setSlots] = useState('100');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  if (!isAuthenticated) {
    navigate('/login?redirect=/organizer/create-ballot');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!activityName.trim() || !sport.trim() || !location.trim() || !deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    console.log('[CreateBallot] Creating ballot as activity:', { activityName, sport, location, deadline, slots, selectedGroupId });

    try {
      // Create as an activity with session_type = 'ballot'
      const activity = await dataService.createActivity({
        organizer_id: user.id,
        title: activityName,
        sport,
        venue: location,
        location: location,
        date: deadline,
        description: `Ballot session — ${parseInt(slots) || 10} slots available`,
        group_id: selectedGroupId || undefined,
        visibility,
        session_type: 'ballot',
      });

      if (!activity) {
        toast.error('Failed to create ballot session');
        setIsLoading(false);
        return;
      }

      // Create one activity_session for the ballot slots
      await dataService.createSession({
        activity_id: activity.id,
        time_label: 'Ballot Entry',
        max_slots: parseInt(slots) || 10,
        price: 0,
      });

      console.log('[CreateBallot] Ballot activity created:', activity);
      toast.success('Ballot Session created!');
      navigate('/organize');
    } catch (err: any) {
      console.error('[CreateBallot] Error:', err);
      toast.error('Failed to create ballot session: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10 px-4 max-w-3xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/organize')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Shuffle className="h-7 w-7 text-accent" /> Create Ballot Session
        </h1>
        <p className="text-muted-foreground">Set up a ballot session for users to join. No payment fields — focus on participation only.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm border-accent/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Activity Name *</Label>
              <Input placeholder="e.g. Weekly Badminton Court Ballot" value={activityName} onChange={e => setActivityName(e.target.value)} required />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sport *</Label>
                <Input placeholder="e.g. Badminton, Futsal" value={sport} onChange={e => setSport(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Location *</Label>
                <Input placeholder="e.g. Senja Cashew Sports Hall" value={location} onChange={e => setLocation(e.target.value)} required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Ballot Deadline *</Label>
                <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Users className="h-3 w-3" /> Available Slots</Label>
                <Input type="number" min="1" value={slots} onChange={e => setSlots(e.target.value)} required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visibility Setting */}
        <Card className="shadow-sm border-accent/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {visibility === 'public' ? <Globe className="h-4 w-4 text-accent" /> : <Lock className="h-4 w-4 text-accent" />} Visibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose who can see this ballot session.</p>
            <div className="flex gap-3">
              {(['public', 'private'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    visibility === v ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  }`}
                >
                  {v === 'public' ? <Globe className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <p className="font-bold text-sm capitalize">{v}</p>
                    <p className="text-xs text-muted-foreground">
                      {v === 'public' ? 'Visible in explore & listings' : 'Only accessible via shared link'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Group Tagging */}
        <GroupSelector onGroupSelected={setSelectedGroupId} selectedGroupId={selectedGroupId} />

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="ghost" type="button" onClick={() => navigate('/organize')}>Cancel</Button>
          <Button size="lg" className="bg-accent hover:bg-accent/90 px-10 rounded-full" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Ballot Session
          </Button>
        </div>
      </form>
    </div>
  );
}
