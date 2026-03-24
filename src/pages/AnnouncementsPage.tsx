import { motion } from 'framer-motion';
import { Bell, Calendar, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

const ANNOUNCEMENTS = [
  {
    date: '24 Mar 2026',
    title: 'Ballot System Now Live!',
    description: 'Organizers can now create ballot groups for oversubscribed sessions. Players can join and track their ballot status directly from the bot or web app.',
    tag: 'New Feature',
    tagColor: 'hsl(var(--primary))',
  },
  {
    date: '20 Mar 2026',
    title: 'PayNow Integration',
    description: 'Pay for your bookings using PayNow QR code — fast, secure, and built for Singapore.',
    tag: 'Payments',
    tagColor: 'hsl(142 60% 40%)',
  },
  {
    date: '15 Mar 2026',
    title: 'Telegram Bot Launch',
    description: 'Manage your bookings, organize activities, and join ballots all from @BookeeAssistBot on Telegram.',
    tag: 'Launch',
    tagColor: 'hsl(220 70% 50%)',
  },
  {
    date: '10 Mar 2026',
    title: 'Beta Registration Open',
    description: 'Sign up for early access to exclusive venues and community features. Limited spots available!',
    tag: 'Beta',
    tagColor: 'hsl(35 90% 50%)',
  },
];

export default function AnnouncementsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-12 max-w-3xl mx-auto">
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

        <div className="space-y-6">
          {ANNOUNCEMENTS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="p-6 rounded-2xl border-2 bg-card hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
                  style={{ background: item.tagColor }}
                >
                  {item.tag}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {item.date}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
