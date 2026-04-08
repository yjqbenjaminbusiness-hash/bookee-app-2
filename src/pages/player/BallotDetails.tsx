import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { dataService, type Ballot } from '../../lib/data';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Users, Shuffle, Loader2, UserPlus, Check, Clock, Globe, Lock, Share2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

interface BallotParticipant {
  id: string;
  ballot_id: string;
  user_id: string | null;
  display_name: string | null;
  telegram_username: string | null;
  status: string;
  attempt_count: number;
  last_attempt_at: string;
  created_at: string;
}

export default function BallotDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ballot, setBallot] = useState<Ballot | null>(null);
  const [participants, setParticipants] = useState<BallotParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [groupName, setGroupName] = useState<string | null>(null);

  const myParticipation = participants.find(p => p.user_id === user?.id);
  const isCreator = ballot?.created_by === user?.id;
  const isPast = ballot ? ballot.ballot_deadline < new Date().toISOString().split('T')[0] : false;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        // Fetch ballot
        const { data: ballotData, error: ballotErr } = await supabase
          .from('ballots')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (ballotErr || !ballotData) {
          console.error('Failed to load ballot:', ballotErr);
          setIsLoading(false);
          return;
        }
        setBallot(ballotData as Ballot);

        // Fetch group name if linked
        if (ballotData.group_id) {
          const grp = await dataService.getGroup(ballotData.group_id);
          if (grp) setGroupName(grp.name);
        }

        // Fetch participants
        const { data: parts } = await supabase
          .from('ballot_participants')
          .select('*')
          .eq('ballot_id', id)
          .order('created_at', { ascending: true });
        setParticipants((parts || []) as BallotParticipant[]);
      } catch (err) {
        console.error('Error loading ballot details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleJoin = async () => {
    if (!user) { toast.error('Please log in to join this ballot'); return; }
    if (!id) return;
    setIsJoining(true);
    try {
      const { data, error } = await supabase
        .from('ballot_participants')
        .insert({
          ballot_id: id,
          user_id: user.id,
          display_name: user.displayName || user.email || 'Anonymous',
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      setParticipants(prev => [...prev, data as BallotParticipant]);
      toast.success('You joined this ballot!');
    } catch (err: any) {
      if (err?.message?.includes('duplicate')) {
        toast.info('You have already joined this ballot');
      } else {
        toast.error('Failed to join ballot');
        console.error(err);
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!myParticipation) return;
    setIsLeaving(true);
    try {
      const { error } = await supabase
        .from('ballot_participants')
        .delete()
        .eq('id', myParticipation.id);
      if (error) throw error;
      setParticipants(prev => prev.filter(p => p.id !== myParticipation.id));
      toast.success('You left this ballot');
    } catch (err) {
      toast.error('Failed to leave ballot');
      console.error(err);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/player/ballots/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Ballot link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ballot) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Ballot not found.</p>
        <Button variant="link" className="mt-4" onClick={() => navigate('/player/events')}>
          ← Back to Explore
        </Button>
      </div>
    );
  }

  const pendingCount = participants.filter(p => p.status === 'pending').length;
  const selectedCount = participants.filter(p => p.status === 'selected').length;

  return (
    <div className="flex flex-col w-full">
      {/* Top nav */}
      <div className="border-b bg-card sticky top-16 z-30">
        <div className="container px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-bold text-foreground">Ballot Details</span>
        </div>
      </div>

      <div className="container px-4 py-8 max-w-3xl space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-accent/10 flex-shrink-0">
              <Shuffle className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-foreground">{ballot.activity_name}</h1>
                <Badge variant="outline" className="border-accent/40 text-accent">
                  <Shuffle className="h-3 w-3 mr-1" /> Ballot
                </Badge>
                <Badge variant={isPast ? 'secondary' : 'default'} className="text-xs">
                  {isPast ? 'Closed' : 'Open'}
                </Badge>
              </div>
              {groupName && (
                <button
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full mb-2 inline-block bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  onClick={() => ballot.group_id && navigate(`/player/groups/${ballot.group_id}`)}
                >
                  {groupName}
                </button>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap mt-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {ballot.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Deadline: {new Date(ballot.ballot_deadline).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {ballot.slots} slots
                </span>
                <span className="flex items-center gap-1.5">
                  {ballot.visibility === 'public' ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {ballot.visibility === 'public' ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex gap-3 flex-wrap">
          {!isPast && !myParticipation && user && (
            <Button onClick={handleJoin} disabled={isJoining} className="rounded-full font-bold px-6 bg-primary text-primary-foreground">
              {isJoining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</> : <><UserPlus className="mr-2 h-4 w-4" /> Join Ballot</>}
            </Button>
          )}
          {!isPast && myParticipation && (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-primary/10 text-primary">
                <Check className="h-4 w-4" /> You're in this ballot
              </span>
              <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={handleLeave} disabled={isLeaving}>
                {isLeaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Leave'}
              </Button>
            </div>
          )}
          {!user && !isPast && (
            <Button onClick={() => navigate(`/login?redirect=/player/ballots/${id}`)} className="rounded-full font-bold px-6 bg-primary text-primary-foreground">
              <UserPlus className="mr-2 h-4 w-4" /> Log in to Join
            </Button>
          )}
          <Button variant="outline" className="rounded-full" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          {isCreator && (
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/organize')}>
              Manage
            </Button>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-4">
          <Card className="border-2 bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{ballot.slots}</p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">Slots</p>
            </CardContent>
          </Card>
          <Card className="border-2 bg-accent/5 border-accent/20">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent">{pendingCount}</p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">Entries</p>
            </CardContent>
          </Card>
          <Card className="border-2 bg-secondary/50 border-secondary/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-secondary-foreground">{selectedCount}</p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">Selected</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Participants */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-dashed bg-muted/10">
                  <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No participants yet. Be the first to join!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {participants.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border bg-background hover:bg-muted/30 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                        {(p.display_name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {p.display_name || 'Anonymous'}
                          {p.user_id === user?.id && <span className="text-xs text-primary ml-1">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(p.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          </span>
                          {p.attempt_count > 1 && (
                            <span>· {p.attempt_count} attempts</span>
                          )}
                        </p>
                      </div>
                      <Badge
                        variant={p.status === 'selected' ? 'default' : 'secondary'}
                        className="text-xs capitalize"
                      >
                        {p.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
