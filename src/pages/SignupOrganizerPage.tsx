import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Briefcase } from 'lucide-react';

export default function SignupOrganizerPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signupOrganizer } = useAuth();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      try {
        signupOrganizer(email, password, displayName);
        toast.success('Organizer application submitted!');
        navigate('/signup/organizer/pending');
      } catch (error: any) {
        toast.error(error.message || 'Failed to create account.');
      } finally {
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <Card className="w-full max-w-md shadow-sm border-primary/10">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-accent/10"><Briefcase className="h-6 w-6 text-accent" /></div>
          </div>
          <CardTitle className="text-2xl font-display font-bold text-center">Become an Organizer</CardTitle>
          <CardDescription className="text-center">Create and manage sports events in Singapore</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded-lg mb-6 border border-primary/10">
            <p className="text-xs text-center text-muted-foreground">
              Organizer accounts require admin verification before you can create events.
            </p>
          </div>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization/Full Name</Label>
              <Input id="name" placeholder="Elite Badminton Club" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" placeholder="organizer@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button className="w-full bg-accent hover:bg-accent/90" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/login')}>Log in</Button>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/30 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Just want to book?{' '}
            <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate('/signup/player')}>Sign up as Player</Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
