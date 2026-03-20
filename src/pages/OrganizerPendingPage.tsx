import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

export default function OrganizerPendingPage() {
  const navigate = useNavigate();

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <Card className="w-full max-w-md shadow-elegant border-accent/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="p-4 rounded-full bg-accent/10">
                <ShieldCheck className="h-10 w-10 text-accent" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-background p-1 rounded-full border">
                <Clock className="h-4 w-4 text-primary animate-pulse" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-display font-bold">Verification Pending</CardTitle>
          <CardDescription>
            Your application is being reviewed
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Thank you for applying to be an organizer on KAKI BOOK SG! 
            Admin will verify your account within 24 hours.
          </p>
          <div className="p-4 bg-muted rounded-xl flex items-center gap-3 text-left border">
            <Mail className="h-5 w-5 text-accent shrink-0" />
            <p className="text-sm">
              We'll send an email to your registered address once your account is verified.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant="outline" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
