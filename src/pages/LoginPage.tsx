import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const TEST_ACCOUNTS = [
  { role: '🛡️ Admin', email: 'yjqbenjaminbusiness@gmail.com', pw: 'admin123', color: '#222' },
  { role: '🏃 Player', email: 'yjqbenjaminbusiness2@gmail.com', pw: 'player123', color: '#1A7A4A' },
  { role: '📋 Organizer', email: 'yjqbenjaminbusiness3@gmail.com', pw: 'organizer123', color: '#C47A00' },
  { role: '📋 Support', email: 'yjqbenjaminbusiness4@gmail.com', pw: 'player456', color: '#555' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const doLogin = async (loginEmail: string, loginPw: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const user = login(loginEmail, loginPw);
    if (user) {
      toast.success(`Welcome back, ${user.displayName}!`);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'organizer') {
        if (user.verified) navigate('/organizer/dashboard');
        else navigate('/signup/organizer/pending');
      } else navigate('/player/dashboard');
    } else {
      toast.error('Invalid email or password. Please try again.');
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  const quickLogin = async (testEmail: string, testPw: string) => {
    setEmail(testEmail);
    setPassword(testPw);
    await doLogin(testEmail, testPw);
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <Card className="w-full max-w-md shadow-elegant border-primary/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-display font-bold text-center text-foreground">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log in
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/signup/player')}>
              Sign up
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col border-t bg-muted/30 p-4">
          <p className="text-xs text-center text-muted-foreground mb-3 font-bold uppercase tracking-widest">
            Quick Login — Click any account below
          </p>
          <div className="grid grid-cols-2 gap-3 text-[10px] w-full">
            {TEST_ACCOUNTS.map(({ role, email: acc, pw, color }) => (
              <button
                key={acc}
                type="button"
                disabled={isLoading}
                onClick={() => quickLogin(acc, pw)}
                className="p-3 rounded-xl bg-white border-2 border-transparent shadow-sm text-left hover:border-primary/40 hover:shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="font-bold flex items-center gap-1 mb-1" style={{ color }}>
                  {role}
                </p>
                <p className="truncate text-gray-500">{acc}</p>
                <p className="font-mono font-bold" style={{ color: '#1A7A4A' }}>{pw}</p>
                <p className="text-primary/70 mt-1.5 font-semibold text-[9px] uppercase tracking-wider">
                  {isLoading ? '⏳ Logging in...' : '▶ Click to login'}
                </p>
              </button>
            ))}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
