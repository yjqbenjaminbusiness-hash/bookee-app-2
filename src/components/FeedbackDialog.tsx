import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';

const CATEGORIES = ['Bug', 'Feature Request', 'Payment Issue', 'Other'] as const;

export default function FeedbackDialog() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setSending(true);
    try {
      const idempotencyKey = `feedback-${crypto.randomUUID()}`;
      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'feedback',
          recipientEmail: 'yjqbenjaminbusiness@gmail.com',
          idempotencyKey,
          templateData: {
            category: category || 'General',
            message: message.trim(),
            userId: user?.id || 'anonymous',
            userEmail: user?.email || '',
            userName: user?.displayName || '',
            pageContext: location.pathname,
            timestamp: new Date().toISOString(),
          },
        },
      });
      if (error) throw error;
      toast.success('Feedback sent! Thank you 🙏');
      setMessage('');
      setCategory('');
      setOpen(false);
    } catch (err) {
      console.error('Failed to send feedback:', err);
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-primary/40 text-primary font-bold gap-2">
          <MessageSquare className="h-4 w-4" /> Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Report a bug, suggest a feature, or let us know how we can improve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Category (optional)
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Message <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue or suggestion..."
              className="min-h-[120px] rounded-lg"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-col">
          <Button
            onClick={handleSubmit}
            disabled={sending || !message.trim()}
            className="w-full rounded-full bg-primary text-primary-foreground font-bold"
          >
            {sending ? 'Sending...' : 'Send Feedback'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Or email us directly: <a href="mailto:yjqbenjaminbusiness@gmail.com" className="text-primary underline">yjqbenjaminbusiness@gmail.com</a>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
