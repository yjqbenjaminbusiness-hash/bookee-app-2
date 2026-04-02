import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { dataService } from '../../lib/data';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, MapPin, Clock, DollarSign, Users, Loader2, Eye, Globe, Lock, CreditCard, Phone } from 'lucide-react';
import { Progress } from '../../components/ui/progress';
import { GroupSelector } from '../../components/GroupSelector';
import { supabase } from '@/integrations/supabase/client';

interface TimeslotForm {
  startHour: string;
  startPeriod: 'am' | 'pm';
  endHour: string;
  endPeriod: 'am' | 'pm';
  price: string;
  maxCapacity: string;
}

function formatLabel(ts: TimeslotForm): string {
  const sh = parseInt(ts.startHour) || 0;
  const eh = parseInt(ts.endHour) || 0;
  const startH24 = ts.startPeriod === 'pm' && sh !== 12 ? sh + 12 : (ts.startPeriod === 'am' && sh === 12 ? 0 : sh);
  const endH24 = ts.endPeriod === 'pm' && eh !== 12 ? eh + 12 : (ts.endPeriod === 'am' && eh === 12 ? 0 : eh);
  const hours = Math.max(1, endH24 - startH24);
  return `${hours}hr: ${ts.startHour}${ts.startPeriod}-${ts.endHour}${ts.endPeriod}`;
}

function getStartTime24(ts: TimeslotForm): string {
  const sh = parseInt(ts.startHour) || 0;
  const startH24 = ts.startPeriod === 'pm' && sh !== 12 ? sh + 12 : (ts.startPeriod === 'am' && sh === 12 ? 0 : sh);
  return `${startH24.toString().padStart(2, '0')}:00`;
}

function getEndTime24(ts: TimeslotForm): string {
  const eh = parseInt(ts.endHour) || 0;
  const endH24 = ts.endPeriod === 'pm' && eh !== 12 ? eh + 12 : (ts.endPeriod === 'am' && eh === 12 ? 0 : eh);
  return `${endH24.toString().padStart(2, '0')}:00`;
}

export default function CreateEvent() {
  const { user, isSupabaseAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionType = searchParams.get('type') || 'activity';
  const isBallot = sessionType === 'ballot';
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(user?.phone || '+65 ');

  const [participantVisibility, setParticipantVisibility] = useState<'public' | 'private'>('public');
  const [paymentPolicyType, setPaymentPolicyType] = useState<'immediate' | 'before' | 'after' | 'optional'>('immediate');
  const [paymentPolicyHours, setPaymentPolicyHours] = useState('5');
  const [collectPhone, setCollectPhone] = useState(true);

  const [timeslots, setTimeslots] = useState<TimeslotForm[]>([
    { startHour: '5', startPeriod: 'pm', endHour: '9', endPeriod: 'pm', price: '80', maxCapacity: '8' },
    { startHour: '7', startPeriod: 'pm', endHour: '9', endPeriod: 'pm', price: '40', maxCapacity: '4' },
  ]);

  const addTimeslot = () => {
    setTimeslots([...timeslots, { startHour: '', startPeriod: 'pm', endHour: '', endPeriod: 'pm', price: '', maxCapacity: '' }]);
  };

  const removeTimeslot = (index: number) => {
    if (timeslots.length === 1) return;
    setTimeslots(timeslots.filter((_, i) => i !== index));
  };

  const updateTimeslot = (index: number, field: keyof TimeslotForm, value: string) => {
    const updated = [...timeslots];
    (updated[index] as any)[field] = value;
    setTimeslots(updated);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to create an activity');
      return;
    }

    if (!title.trim() || !venue.trim() || !date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Create activity in database
      const activity = await dataService.createActivity({
        organizer_id: user.id,
        title: title.trim(),
        sport: sport.trim() || 'General',
        venue: venue.trim(),
        location: venue.trim(),
        date,
        description: description.trim() || undefined,
        group_id: selectedGroupId || undefined,
        
      });

      if (!activity) {
        toast.error('Failed to create activity');
        setIsLoading(false);
        return;
      }

      console.log('[CreateEvent] Activity created with ID:', activity.id);

      // Create timeslots / sessions
      for (const ts of timeslots) {
        await dataService.createSession({
          activity_id: activity.id,
          time_label: formatLabel(ts),
          start_time: getStartTime24(ts),
          end_time: getEndTime24(ts),
          max_slots: parseInt(ts.maxCapacity) || 4,
          price: parseFloat(ts.price) || 0,
        });
      }

      toast.success('Activity created successfully!');
      navigate('/organizer/dashboard');
    } catch (err: any) {
      console.error('[CreateEvent] Error:', err);
      toast.error('Failed to create activity: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10 px-4 max-w-5xl">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display font-bold text-accent">
          {isBallot ? 'Create Ballot Session' : sessionType === 'event' ? 'Create Event Session' : 'Create Activity Session'}
        </h1>
        <p className="text-muted-foreground">Set up venue, date, and bookable timeslots</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Activity Info */}
        <Card className="shadow-sm border-accent/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Activity Name *</Label>
                <Input placeholder="e.g. Weekly Badminton" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Sport</Label>
                <Input placeholder="e.g. Badminton, Futsal" value={sport} onChange={e => setSport(e.target.value)} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Venue *</Label>
                <Input placeholder="e.g. Senja Cashew Sports Hall" value={venue} onChange={e => setVenue(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Organizer Phone</Label>
                <Input placeholder="+65 9123 4567" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea placeholder="Court numbers, bring own racquet..." value={description} onChange={e => setDescription(e.target.value)} className="min-h-[40px]" />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Participant List Visibility */}
        <Card className="shadow-sm border-accent/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" /> Participant List Visibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Control whether players can see who else has joined.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <button type="button" onClick={() => setParticipantVisibility('public')}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${participantVisibility === 'public' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30'}`}>
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${participantVisibility === 'public' ? 'bg-accent text-white' : 'bg-muted'}`}>
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-sm">Public</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Players can see who has joined</p>
                </div>
              </button>
              <button type="button" onClick={() => setParticipantVisibility('private')}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${participantVisibility === 'private' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30'}`}>
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${participantVisibility === 'private' ? 'bg-accent text-white' : 'bg-muted'}`}>
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-sm">Private</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Player list hidden — only slot counts shown</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Policy - hidden for ballot sessions */}
        {!isBallot && (
          <Card className="shadow-sm border-accent/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-accent" /> Payment Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Set when players are required to complete payment.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { type: 'immediate' as const, label: 'Immediate', desc: 'Payment required right after booking', icon: '⚡' },
                  { type: 'before' as const, label: 'Before Activity', desc: 'Pay X hours before activity starts', icon: '⏰' },
                  { type: 'after' as const, label: 'After Activity', desc: 'Pay up to X hours after activity', icon: '✅' },
                  { type: 'optional' as const, label: 'No Deadline', desc: 'Payment optional, no deadline enforced', icon: '🔓' },
                ].map(({ type, label, desc, icon }) => (
                  <button key={type} type="button" onClick={() => setPaymentPolicyType(type)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${paymentPolicyType === type ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30'}`}>
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <div>
                      <p className="font-bold text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              {(paymentPolicyType === 'before' || paymentPolicyType === 'after') && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20">
                  <span className="text-sm font-bold text-accent">Pay</span>
                  <Input type="number" min="1" max="72" value={paymentPolicyHours} onChange={e => setPaymentPolicyHours(e.target.value)} className="w-20 font-mono font-bold text-center" />
                  <span className="text-sm font-bold text-accent">hours {paymentPolicyType === 'before' ? 'before' : 'after'} the activity</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Requirements */}
        <Card className="shadow-sm border-accent/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-4 w-4 text-accent" /> Contact Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:border-accent/30">
              <div>
                <p className="font-bold text-sm">Collect phone number from players</p>
                <p className="text-xs text-muted-foreground mt-0.5">Required for coordinating via WhatsApp/SMS</p>
              </div>
              <button type="button" onClick={() => setCollectPhone(!collectPhone)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${collectPhone ? 'bg-accent' : 'bg-muted'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${collectPhone ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Timeslots */}
        <Card className="shadow-sm border-accent/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" /> Timeslots
            </CardTitle>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="h-4 w-4 mr-1" /> {showPreview ? 'Edit' : 'Preview'}
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-full border-accent text-accent hover:bg-accent/10" onClick={addTimeslot}>
                <Plus className="h-4 w-4 mr-1" /> Add Slot
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showPreview ? (
              <div className="space-y-3 font-mono text-sm">
                <div className="text-muted-foreground mb-4">
                  <p className="font-bold text-foreground">Venue: [{venue || '...'}]</p>
                  <p className="font-bold text-foreground">Date: [{date || '...'}]</p>
                </div>
                {timeslots.map((ts, i) => {
                  const label = formatLabel(ts);
                  const max = parseInt(ts.maxCapacity) || 4;
                  const price = parseFloat(ts.price) || 0;
                  return (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 border">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-muted-foreground">[ ]</span>
                        <span className="font-bold">{label}</span>
                        <span className="text-muted-foreground">(${price})</span>
                        <span>[0/{max}]</span>
                        <span>{'░'.repeat(Math.min(max, 10))}</span>
                        <span>0%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {timeslots.map((ts, index) => (
                  <div key={index} className="p-4 rounded-xl border bg-muted/20 space-y-3 relative group">
                    {timeslots.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeTimeslot(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Start Hour</Label>
                        <div className="flex gap-1">
                          <Input type="number" min="1" max="12" placeholder="5" value={ts.startHour} onChange={e => updateTimeslot(index, 'startHour', e.target.value)} required />
                          <select className="px-2 py-1 border rounded-md text-sm bg-background" value={ts.startPeriod} onChange={e => updateTimeslot(index, 'startPeriod', e.target.value)}>
                            <option value="am">AM</option>
                            <option value="pm">PM</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Hour</Label>
                        <div className="flex gap-1">
                          <Input type="number" min="1" max="12" placeholder="9" value={ts.endHour} onChange={e => updateTimeslot(index, 'endHour', e.target.value)} required />
                          <select className="px-2 py-1 border rounded-md text-sm bg-background" value={ts.endPeriod} onChange={e => updateTimeslot(index, 'endPeriod', e.target.value)}>
                            <option value="am">AM</option>
                            <option value="pm">PM</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Price ($)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input type="number" className="pl-8" placeholder="40" value={ts.price} onChange={e => updateTimeslot(index, 'price', e.target.value)} required />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Players</Label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input type="number" className="pl-8" placeholder="8" value={ts.maxCapacity} onChange={e => updateTimeslot(index, 'maxCapacity', e.target.value)} required />
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Preview: <span className="font-mono font-bold">{formatLabel(ts)}</span> — ${ts.price || '0'}/person — {ts.maxCapacity || '0'} spots
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Tagging */}
        <GroupSelector onGroupSelected={setSelectedGroupId} selectedGroupId={selectedGroupId} />

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="ghost" type="button" onClick={() => navigate('/organizer/dashboard')}>Cancel</Button>
          <Button size="lg" className="bg-accent hover:bg-accent/90 px-10 rounded-full" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish {isBallot ? 'Ballot' : 'Activity'}
          </Button>
        </div>
      </form>
    </div>
  );
}
