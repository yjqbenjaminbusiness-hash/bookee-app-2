import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { store } from '../lib/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { User, Mail, Shield, ShieldCheck, BadgeCheck, RotateCcw, Trash2, AlertTriangle, CheckCircle2, Database, Info } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      store.reset();
      logout();
      toast.success('All data has been reset to defaults. Please log in again.');
      navigate('/login');
      setIsResetting(false);
    }, 800);
  };

  // Calculate current data counts
  const eventCount = store.events.length;
  const bookingCount = store.bookings.length;
  const userCount = store.users.length;
  const groupCount = store.groups.length;
  const reviewCount = store.reviews.length;

  return (
    <div className="container py-10 px-4 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#111' }}>Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and app data</p>
      </div>

      {/* Profile Card */}
      <Card className="border-2" style={{ borderColor: 'rgba(26,122,74,0.12)' }}>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your public identity and account role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center text-3xl font-bold border-2"
              style={{ background: 'rgba(26,122,74,0.10)', borderColor: 'rgba(26,122,74,0.20)', color: '#1A7A4A' }}
            >
              {user?.displayName?.charAt(0).toUpperCase() || <User className="h-10 w-10" />}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl" style={{ color: '#111' }}>{user?.displayName || 'User'}</h3>
                {user?.verified && <BadgeCheck className="h-5 w-5" style={{ color: '#1A7A4A' }} />}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user?.email}
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className="capitalize font-bold">{user?.role}</Badge>
                {user?.verified ? (
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

          <div className="pt-4 border-t space-y-3">
            <div className="grid gap-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account ID</p>
              <code className="text-xs p-3 rounded-xl bg-muted block truncate font-mono">{user?.id}</code>
            </div>
            {user?.phone && (
              <div className="grid gap-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone</p>
                <code className="text-xs p-3 rounded-xl bg-muted block font-mono">{user.phone}</code>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending organizer notice */}
      {user?.role === 'organizer' && !user.verified && (
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

      {/* Data Overview Card */}
      <Card className="border-2" style={{ borderColor: 'rgba(27,95,140,0.12)', background: '#F0F9FF' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: '#1B5F8C' }}>
            <Database className="h-5 w-5" /> App Data Overview
          </CardTitle>
          <CardDescription>Current state of the demo data store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Users', value: userCount, color: '#1B5F8C' },
              { label: 'Events', value: eventCount, color: '#1A7A4A' },
              { label: 'Bookings', value: bookingCount, color: '#1A7A4A' },
              { label: 'Groups', value: groupCount, color: '#C47A00' },
              { label: 'Reviews', value: reviewCount, color: '#C47A00' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-xl bg-white border text-center">
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Reset Card */}
      <Card className="border-2" style={{ borderColor: 'rgba(220,38,38,0.20)', background: 'rgba(254,242,242,0.50)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <RotateCcw className="h-5 w-5" /> Reset Demo Data
          </CardTitle>
          <CardDescription>
            Reset all data back to the original seed state. Use this if the app gets into a bad state during testing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl border-2 space-y-2" style={{ background: '#fff', borderColor: 'rgba(220,38,38,0.15)' }}>
            <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" /> What will be reset:
            </p>
            <ul className="text-[11px] space-y-1 text-muted-foreground ml-5">
              <li>• All bookings, timeslots, and events</li>
              <li>• Waitlist entries and special requests</li>
              <li>• Reviews and ratings</li>
              <li>• Groups and team memberships</li>
              <li className="font-medium text-foreground">• Users are preserved (seed accounts restored)</li>
            </ul>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-muted-foreground p-3 rounded-xl bg-muted/40">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>You will be logged out after the reset. Log in again with any test account to continue.</span>
          </div>

          {!showResetConfirm ? (
            <Button
              variant="outline"
              className="w-full font-bold rounded-full border-destructive/40 text-destructive hover:bg-destructive/5"
              onClick={() => setShowResetConfirm(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset All Data
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-bold text-center text-destructive">Are you sure? This cannot be undone.</p>
              <div className="flex gap-3">
                <Button
                  className="flex-1 rounded-full font-bold bg-destructive hover:bg-destructive/90"
                  disabled={isResetting}
                  onClick={handleReset}
                >
                  {isResetting ? (
                    <><RotateCcw className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
                  ) : (
                    <><Trash2 className="mr-2 h-4 w-4" /> Yes, Reset Everything</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What's in the Demo */}
      <Card className="border-2" style={{ borderColor: 'rgba(26,122,74,0.10)' }}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ color: '#1A7A4A' }}>
            <CheckCircle2 className="h-5 w-5" /> Demo Test Accounts
          </CardTitle>
          <CardDescription>Quick reference for all test accounts in this demo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { role: 'Admin', email: 'yjqbenjaminbusiness@gmail.com', pw: 'admin123', color: '#111' },
              { role: 'Player', email: 'yjqbenjaminbusiness2@gmail.com', pw: 'player123', color: '#1A7A4A' },
              { role: 'Organizer', email: 'yjqbenjaminbusiness3@gmail.com', pw: 'organizer123', color: '#C47A00' },
              { role: 'Org (Pending)', email: 'yjqbenjaminbusiness4@gmail.com', pw: 'player456', color: '#555' },
            ].map(({ role, email, pw, color }) => (
              <div key={email} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 text-xs">
                <span className="font-bold" style={{ color }}>{role}</span>
                <span className="text-muted-foreground truncate mx-3 hidden sm:block">{email}</span>
                <code className="font-mono font-bold" style={{ color: '#1A7A4A' }}>{pw}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
