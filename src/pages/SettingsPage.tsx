import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { User, Mail, Shield, ShieldCheck, BadgeCheck, LogOut, Info } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login');
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
        <h1 className="text-3xl font-bold" style={{ color: '#111' }}>Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile</p>
      </div>

      {/* Profile Card */}
      <Card className="border-2" style={{ borderColor: 'rgba(26,122,74,0.12)' }}>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center text-3xl font-bold border-2"
              style={{ background: 'rgba(26,122,74,0.10)', borderColor: 'rgba(26,122,74,0.20)', color: '#1A7A4A' }}
            >
              {user.displayName?.charAt(0).toUpperCase() || <User className="h-10 w-10" />}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl" style={{ color: '#111' }}>{user.displayName || 'User'}</h3>
                {user.verified && <BadgeCheck className="h-5 w-5" style={{ color: '#1A7A4A' }} />}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className="capitalize font-bold">{user.role}</Badge>
                {user.verified ? (
                  <Badge className="border-none font-bold" style={{ background: '#1A7A4A', color: '#fff' }}>
                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-bold" style={{ color: '#C47A00', borderColor: '#C47A00' }}>
                    Pending Review
                  </Badge>
                )}
              </div>
            </div>
          </div>

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
        <Card className="border-2" style={{ background: '#FFFBF0', borderColor: 'rgba(196,122,0,0.25)' }}>
          <CardContent className="pt-6 flex gap-4">
            <Shield className="h-6 w-6 shrink-0 mt-0.5" style={{ color: '#C47A00' }} />
            <div className="space-y-1">
              <p className="font-bold text-sm" style={{ color: '#7c5300' }}>Verification in Progress</p>
              <p className="text-xs leading-relaxed" style={{ color: '#92580a' }}>
                Your organizer account is pending admin review. You will be able to create events once verified.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Card className="border-2" style={{ borderColor: 'rgba(220,38,38,0.20)', background: 'rgba(254,242,242,0.50)' }}>
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
