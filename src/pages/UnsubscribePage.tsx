import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MailX, CheckCircle2, AlertTriangle } from 'lucide-react';

type Status = 'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error';

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    (async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`;
        const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const data = await res.json();
        if (!res.ok) { setStatus('invalid'); return; }
        setStatus(data.valid === false && data.reason === 'already_unsubscribed' ? 'already' : 'valid');
      } catch { setStatus('error'); }
    })();
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', { body: { token } });
      if (error) throw error;
      setStatus(data?.success ? 'success' : 'already');
    } catch { setStatus('error'); }
    finally { setProcessing(false); }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {status === 'loading' && <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />}
          {status === 'valid' && (
            <>
              <MailX className="h-10 w-10 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-bold text-foreground">Unsubscribe</h2>
              <p className="text-muted-foreground text-sm">You'll no longer receive app emails from Bookee.</p>
              <Button onClick={handleUnsubscribe} disabled={processing} className="rounded-full bg-primary text-primary-foreground font-bold px-8">
                {processing ? 'Processing...' : 'Confirm Unsubscribe'}
              </Button>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
              <h2 className="text-xl font-bold text-foreground">Unsubscribed</h2>
              <p className="text-muted-foreground text-sm">You've been unsubscribed successfully.</p>
            </>
          )}
          {status === 'already' && (
            <>
              <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-bold text-foreground">Already Unsubscribed</h2>
              <p className="text-muted-foreground text-sm">This email has already been unsubscribed.</p>
            </>
          )}
          {(status === 'invalid' || status === 'error') && (
            <>
              <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
              <h2 className="text-xl font-bold text-foreground">Invalid Link</h2>
              <p className="text-muted-foreground text-sm">This unsubscribe link is invalid or has expired.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
