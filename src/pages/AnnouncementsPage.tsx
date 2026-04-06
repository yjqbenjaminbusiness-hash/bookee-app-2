import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Calendar, ArrowLeft, ThumbsUp, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const TIMELINE_ITEMS = [
  {
    date: '16 Jan 2026',
    title: 'Bookee Conceptualized',
    description: 'Initial prototype & development began for Bookee.',
    tag: 'Milestone',
    tagColor: 'hsl(var(--muted-foreground))',
  },
  {
    date: '15 Feb 2026',
    title: 'Core System Built',
    description: 'Activity creation, booking flow, and organizer tools were implemented.',
    tag: 'Milestone',
    tagColor: 'hsl(220 70% 50%)',
  },
    {
    date: '3 Mar 2026',
    title: 'Community Focus',
    description: 'Interacted with organizers to understand & design tools to address their pain points. ',
    tag: 'Update',
    tagColor: 'hsl(142 60% 40%)',
  },
  {
    date: '23 Mar 2026',
    title: 'Organize Flow Revamped',
    description: 'Demo Flows & Ballot Sessions are added for Organizers to manage Balloting activities with members',
    tag: 'Update',
    tagColor: 'hsl(142 60% 40%)',
  },
  {
    date: '25 Mar 2026',
    title: 'Beta Registration Open!',
    description: 'Sign up for early access to exclusive venues and community features. Limited spots available!',
    tag: 'Beta',
    tagColor: 'hsl(var(--primary))',
  },
  {
    date: '25 Mar 2026',
    title: 'Ballot System Now Live!',
    description: 'Organizers can now create ballot sessions for oversubscribed courts. Players join and track status from the web app.',
    tag: 'New Feature',
    tagColor: 'hsl(35 90% 50%)',
  },
  {
    date: '02 April 2026',
    title: 'Telegram Bot Launch',
    description: 'Manage your bookings, organize activities, and join ballot sessions all from @BookeeAppBot on Telegram.',
    tag: 'New Feature',
    tagColor: 'hsl(35 90% 50%)',
  },
];

const IN_PROGRESS_ITEMS = [
  {
    title: 'PayNow Integration',
    description: 'Pay for your bookings using PayNow QR code — fast, secure, and built for Singapore.',
    tag: 'Payments',
    tagColor: 'hsl(35 90% 50%)',
  }
];

interface Suggestion {
  id: string;
  text: string;
  votes: number;
  voted: boolean;
}

export default function AnnouncementsPage() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    { id: '1', text: 'WhatsApp bot support', votes: 12, voted: false },
    { id: '2', text: 'Multi-sport group support', votes: 8, voted: false },
    { id: '3', text: 'Recurring weekly sessions', votes: 15, voted: false },
  ]);
  const [newSuggestion, setNewSuggestion] = useState('');

  const handleVote = (id: string) => {
    setSuggestions(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, votes: s.voted ? s.votes - 1 : s.votes + 1, voted: !s.voted }
          : s
      ).sort((a, b) => b.votes - a.votes)
    );
  };

  const handleAddSuggestion = () => {
    if (!newSuggestion.trim()) return;
    setSuggestions(prev => [
      ...prev,
      { id: Date.now().toString(), text: newSuggestion.trim(), votes: 1, voted: true },
    ].sort((a, b) => b.votes - a.votes));
    setNewSuggestion('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-12 max-w-5xl mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
            <Bell className="h-4 w-4" /> Updates & News
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground" style={{ fontFamily: 'Lora, serif' }}>
            Announcements
          </h1>
          <p className="text-muted-foreground mt-3">
            Stay up to date with the latest features, updates, and system changes.
          </p>
        </div>

        {/* Horizontal Timeline (earliest LEFT → latest RIGHT) */}
        <div className="relative mb-16">
          <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-4 min-w-max">
              {TIMELINE_ITEMS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="w-72 flex-shrink-0"
                >
                  <div className="relative">
                    <div className="flex items-center mb-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: item.tagColor }}
                      />
                      {i < TIMELINE_ITEMS.length - 1 && (
                        <div className="h-px flex-1 bg-border ml-2" />
                      )}
                    </div>
                    <Card className="border-2 hover:shadow-md transition-all h-full">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
                            style={{ background: item.tagColor }}
                          >
                            {item.tag}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {item.date}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-foreground mb-1">{item.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* In Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> In Progress
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Features currently being built.</p>
          </div>

          <div className="grid sm:grid-cols-1 gap-4 max-w-2xl mx-auto">
            {IN_PROGRESS_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              >
                <Card className="border-2 border-dashed border-primary/30 bg-primary/5 h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">
                        {item.tag}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/40">
                        Building
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feedback & Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">Feedback & Suggestions</h2>
            <p className="text-muted-foreground text-sm mt-1">Vote on features you'd love to see, or suggest your own.</p>
          </div>

          <div className="flex gap-2 mb-6 max-w-xl mx-auto">
            <Input
              placeholder="Suggest a feature..."
              value={newSuggestion}
              onChange={e => setNewSuggestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSuggestion()}
            />
            <Button onClick={handleAddSuggestion} size="sm" className="px-4">
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            {suggestions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-xl border bg-card"
              >
                <button
                  onClick={() => handleVote(s.id)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                    s.voted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <ThumbsUp className={`h-4 w-4 ${s.voted ? 'fill-primary' : ''}`} />
                  <span className="text-xs font-bold">{s.votes}</span>
                </button>
                <span className="text-sm text-foreground">{s.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
