import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { LogOut, LayoutDashboard, Settings, Plus, ShieldCheck, Menu, X, Calendar, BookOpen, FileText, Users, Play, HelpCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const dashboardPath = user ? `/${user.role}/dashboard` : '/';

  const navLinks = [
    { to: '/demo', label: 'Demo', icon: <Play className="h-4 w-4" /> },
    { to: '/player/events', label: 'Explore', icon: <Calendar className="h-4 w-4" /> },
    { to: dashboardPath, label: 'My Bookee', icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: isAuthenticated ? '/organize' : '/login?redirect=/organize', label: 'Organize', icon: <Plus className="h-4 w-4" /> },
    { to: '/announcements', label: 'Announcements', icon: <BookOpen className="h-4 w-4" /> },
    { to: '/help', label: 'Help', icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-display font-bold text-2xl tracking-tighter text-primary">
                Bookee
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors hover:text-primary ${isActive(link.to) ? 'text-primary font-bold' : 'text-foreground/70'}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Mobile hamburger */}
                <button
                  className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Toggle menu"
                >
                  {menuOpen
                    ? <X className="h-5 w-5" style={{ color: '#111' }} />
                    : <Menu className="h-5 w-5" style={{ color: '#111' }} />
                  }
                </button>

                {/* Desktop user dropdown */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-sm font-bold" style={{ background: 'rgba(26,122,74,0.12)', color: '#1A7A4A' }}>
                            {user?.displayName?.charAt(0).toUpperCase() || user?.email?.substring(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-bold leading-none">{user?.displayName}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user?.email} &middot; <span className="capitalize font-medium" style={{ color: '#1A7A4A' }}>{user?.role}</span>
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>My Bookee</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
                <Button onClick={() => navigate('/signup/player')} style={{ background: '#1A7A4A', color: '#fff' }}>Sign up</Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Slide-down Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-b bg-background/98 backdrop-blur sticky top-16 z-40 overflow-hidden"
          >
            <div className="container py-4 space-y-1">
              {/* User info */}
              {user && (
                <div className="px-4 py-3 mb-3 rounded-2xl" style={{ background: 'rgba(26,122,74,0.07)' }}>
                  <p className="font-bold text-sm" style={{ color: '#111' }}>{user.displayName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role} account</p>
                </div>
              )}

              {/* Nav links */}
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'font-bold'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                  }`}
                  style={isActive(link.to) ? { background: 'rgba(26,122,74,0.10)', color: '#1A7A4A' } : {}}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}

              <div className="border-t my-2" />

              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition-all"
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 transition-all"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
