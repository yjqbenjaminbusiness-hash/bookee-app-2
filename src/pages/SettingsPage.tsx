import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Shield, ShieldCheck, BadgeCheck, LogOut, Loader2, Save } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout, isSupabaseAuth, supabaseUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const handleSaveUsername = async () => {
    if (!isSupabaseAuth || !supabaseUser) {
      toast.error('Only available for authenticated accounts');
      return;
    }
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('user_id', supabaseUser.id);
      if (error) throw error;
      toast.success('Username updated!');
      refreshUser();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update username');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Please log in to view settings.</p>
        <Button variant="link" className="mt-4" onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="container py-10 px-4 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile</p>
      </div>

      {/* Profile Card */}
      <Card className="border-2 border-primary/10">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-3xl font-bold border-2 bg-primary/10 border-primary/20 text-primary">
              {user.displayName?.charAt(0).toUpperCase() || <User className="h-10 w-10" />}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl text-foreground">{user.displayName || 'User'}</h3>
                {user.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className="capitalize font-bold">{user.role}</Badge>
                {user.verified ? (
                  <Badge className="border-none font-bold bg-primary text-primary-foreground">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-bold text-amber-600 border-amber-600">
                    Pending Review
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Username Edit */}
          {isSupabaseAuth && (
            <div className="pt-4 border-t space-y-3">
              <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom Username</Label>
              <p className="text-xs text-muted-foreground">This will be shown instead of your login name across the app.</p>
              <div className="flex gap-2">
                <Input
                  id="username"
                  placeholder="Enter a custom username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSaveUsername} disabled={isSaving} size="sm" className="rounded-full">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Save</>}
                </Button>
              </div>
            </div>
          )}

          {user.phone && (
            <div className="pt-4 border-t">
              <div className="grid gap-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone</p>
                <code className="text-xs p-3 rounded-xl bg-muted block font-mono">{user.phone}</code>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending organizer notice */}
      {user.role === 'organizer' && !user.verified && (
        <Card className="border-2 bg-amber-50/50 border-amber-600/20">
          <CardContent className="pt-6 flex gap-4">
            <Shield className="h-6 w-6 shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-amber-800">Verification in Progress</p>
              <p className="text-xs leading-relaxed text-amber-700">
                Your organizer account is pending admin review. You will be able to create events once verified.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Card className="border-2 border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="w-full font-bold rounded-full border-destructive/40 text-destructive hover:bg-destructive/5"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}