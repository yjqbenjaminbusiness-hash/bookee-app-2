import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

const IS_DEMO_MODE = window.location.pathname.startsWith('/demo') || window.location.search.includes('demo=true');

const TEST_ACCOUNTS = [
  { role: '🛡️ Admin', email: 'yjqbenjaminbusiness@gmail.com', pw: 'admin123', color: 'hsl(var(--foreground))' },
  { role: '🏃 Player', email: 'yjqbenjaminbusiness2@gmail.com', pw: 'player123', color: 'hsl(var(--primary))' },
  { role: '📋 Organizer', email: 'yjqbenjaminbusiness3@gmail.com', pw: 'organizer123', color: 'hsl(var(--accent))' },
  { role: '📋 Support', email: 'yjqbenjaminbusiness4@gmail.com', pw: 'player456', color: 'hsl(var(--muted-foreground))' },
];

function getDashboardPath(role: string, _verified?: boolean) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'organizer') return '/organizer/dashboard';
  return '/player/dashboard';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicEmail, setMagicEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, loginWithSupabase, signInWithGoogle, signInWithApple, signInWithMagicLink, isAuthenticated, user, supabaseUser } = useAuth();

  const telegramChatId = searchParams.get('telegram_chat_id');
  const returnToTelegram = searchParams.get('return') === 'telegram';
  const redirectPath = searchParams.get('redirect');

  // Link telegram and redirect after auth
  useEffect(() => {
    if (isAuthenticated && user && supabaseUser) {
      const linkAndRedirect = async () => {
        if (telegramChatId) {
          // Save telegram_chat_id to profile
          await supabase
            .from('profiles')
            .update({ telegram_chat_id: parseInt(telegramChatId) })
            .eq('user_id', supabaseUser.id);
        }
        if (returnToTelegram && telegramChatId) {
          // Redirect back to bot
          window.location.href = 'https://t.me/BookeeAssistBot?start=linked';
          return;
        }
        const from = redirectPath || (location.state as any)?.from?.pathname;
        navigate(from || getDashboardPath(user.role, user.verified), { replace: true });
      };
      linkAndRedirect();
    }
  }, [isAuthenticated, user, supabaseUser, navigate, location.state, telegramChatId, returnToTelegram]);

  const doLogin = async (loginEmail: string, loginPw: string) => {
    if (isLoading) return;
    setIsLoading(true);
    // Try mock login first (for demo accounts)
    const mockUser = login(loginEmail, loginPw);
    if (mockUser) {
      toast.success(`Welcome back, ${mockUser.displayName}!`);
      if (returnToTelegram && telegramChatId) {
        window.location.href = 'https://t.me/BookeeAssistBot?start=linked';
        return;
      }
      const from = (location.state as any)?.from?.pathname;
      navigate(from || getDashboardPath(mockUser.role, mockUser.verified), { replace: true });
    } else {
      // Try Supabase auth
      try {
        await loginWithSupabase(loginEmail, loginPw);
        toast.success('Welcome back!');
        // Auth state change will trigger redirect via useEffect
      } catch {
        toast.error('Invalid credentials. Please try again.');
      }
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithMagicLink(magicEmail);
      toast.success('Magic link sent! Check your email.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send magic link.');
    }
    setIsLoading(false);
  };

  // Check if demo mode via query param or referrer
  const isDemoMode = IS_DEMO_MODE || location.search.includes('demo=true');

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <Card className="w-full max-w-md shadow-elegant border-primary/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-display font-bold text-center text-foreground">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signInWithGoogle()}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signInWithApple()}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {showMagicLink ? (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">Email</Label>
                <Input id="magic-email" type="email" placeholder="name@example.com" value={magicEmail} onChange={(e) => setMagicEmail(e.target.value)} required />
              </div>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Mail className="mr-2 h-4 w-4" /> Send Magic Link</>}
              </Button>
              <Button variant="ghost" className="w-full text-sm" onClick={() => setShowMagicLink(false)}>
                Use password instead
              </Button>
            </form>
          ) : (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" type="submit" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging you in...</> : 'Log in'}
                </Button>
              </form>
              <Button variant="ghost" className="w-full text-sm" onClick={() => setShowMagicLink(true)}>
                <Mail className="mr-2 h-4 w-4" /> Use magic link instead
              </Button>
            </>
          )}

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="#" className="underline">Terms</a> and{' '}
            <a href="#" className="underline">PDPA policy</a>.
          </p>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/signup/player')}>Sign up</Button>
          </div>
        </CardContent>

        {/* Demo accounts - only visible in demo mode */}
        {isDemoMode && (
          <div className="flex flex-col border-t bg-muted/30 p-4">
            <p className="text-xs text-center text-muted-foreground mb-3 font-bold uppercase tracking-widest">
              Demo Accounts — Quick Login
            </p>
            <div className="grid grid-cols-2 gap-3 text-[10px] w-full">
              {TEST_ACCOUNTS.map(({ role, email: acc, pw, color }) => (
                <button key={acc} type="button" disabled={isLoading} onClick={() => doLogin(acc, pw)}
                  className="p-3 rounded-xl bg-background border-2 border-transparent shadow-sm text-left hover:border-primary/40 hover:shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50">
                  <p className="font-bold flex items-center gap-1 mb-1" style={{ color }}>{role}</p>
                  <p className="truncate text-muted-foreground">{acc}</p>
                  <p className="font-mono font-bold text-primary">{pw}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
