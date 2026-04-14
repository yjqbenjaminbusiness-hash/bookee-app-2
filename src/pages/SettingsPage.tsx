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
  const [phone, setPhone] = useState(user?.phone || '');
  const [telegramHandle, setTelegramHandle] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const handleSaveProfile = async () => {
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
        .update({
          username: username.trim(),
          phone: phone.trim() || null,
        })
        .eq('user_id', supabaseUser.id);
      if (error) throw error;
      toast.success('Profile updated!');
      refreshUser();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
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
                {user.role !== 'user' && user.role !== 'player' && <Badge variant="secondary" className="capitalize font-bold">{user.role}</Badge>}
                {user.verified ? (
                  <Badge className="border-none font-bold bg-primary text-primary-foreground">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-bold text-amber-600 border-amber-600">
                    User
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Profile Edit */}
          {isSupabaseAuth && (
            <div className="pt-4 border-t space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display Username</Label>
                <Input
                  id="username"
                  placeholder="Enter a custom username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. +65 9123 4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  To enable session coordination, your phone number may be shared with the organizer, and the organizer’s phone number may be shared with you. It will not be used for any other reasons.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telegram Handle (optional)</Label>
                <Input
                  id="telegram"
                  placeholder="e.g. @yourhandle"
                  value={telegramHandle}
                  onChange={e => setTelegramHandle(e.target.value)}
                  disabled
                />
                <p className="text-[10px] text-muted-foreground">
                  Linked to your username on Telegram & a source of contact for your sessions.
                </p>
              </div>

              <Button onClick={handleSaveProfile} disabled={isSaving} size="sm" className="rounded-full">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Save Profile</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>


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
