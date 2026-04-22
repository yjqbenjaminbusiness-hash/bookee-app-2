import { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { store, type MockUser } from '../lib/mockData';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: MockUser | null;
  supabaseUser: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => MockUser | null;
  loginWithSupabase: (email: string, password: string) => Promise<boolean>;
  signupPlayer: (email: string, password: string, displayName: string) => MockUser;
  signupOrganizer: (email: string, password: string, displayName: string) => MockUser;
  signupPlayerSupabase: (email: string, password: string, displayName: string) => Promise<boolean>;
  signupOrganizerSupabase: (email: string, password: string, displayName: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
  isSupabaseAuth: boolean;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  supabaseUser: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => null,
  loginWithSupabase: async () => false,
  signupPlayer: () => ({ id: '', email: '', role: 'player' as const, verified: false, pendingVerification: false, password: '', displayName: '' }),
  signupOrganizer: () => ({ id: '', email: '', role: 'organizer' as const, verified: false, pendingVerification: false, password: '', displayName: '' }),
  signupPlayerSupabase: async () => false,
  signupOrganizerSupabase: async () => false,
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signInWithMagicLink: async () => {},
  logout: () => {},
  refreshUser: () => {},
  isSupabaseAuth: false,
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

const getAuthRedirectUrl = () => {
  const authCallbackPath = sessionStorage.getItem('bookee_auth_callback_path') || '/login';
  const normalizedPath = authCallbackPath.startsWith('/') ? authCallbackPath : `/${authCallbackPath}`;
  return `${window.location.origin}${normalizedPath}`;
};

function supabaseUserToMockUser(profile: any, role: string): MockUser {
  return {
    id: profile.user_id,
    email: profile.email || '',
    role: role as 'player' | 'organizer' | 'admin' | 'user',
    verified: profile.verification_status === 'verified',
    pendingVerification: profile.verification_status === 'pending',
    password: '', // not stored
    displayName: profile.username || profile.display_name || profile.email?.split('@')[0] || 'User',
    phone: profile.phone || undefined,
    username: profile.username || undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseAuth, setIsSupabaseAuth] = useState(false);

  useEffect(() => {
    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

              const { data: roles } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id);

              const role = roles && roles.length > 0 ? roles[0].role : 'user';

              if (profile) {
                const mockUser = supabaseUserToMockUser(profile, role);
                setUser(mockUser);
                setIsSupabaseAuth(true);
              }
            } catch (e) {
              console.error('Error fetching profile:', e);
            }
            setIsLoading(false);
          }, 0);
        } else if (!user) {
          setIsLoading(false);
        }
      }
    );

    // Check existing Supabase session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setSupabaseUser(session.user);
        
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);

          const role = roles && roles.length > 0 ? roles[0].role : 'user';
          
          if (profile) {
            const mockUser = supabaseUserToMockUser(profile, role);
            setUser(mockUser);
            setIsSupabaseAuth(true);
          }
        } catch (e) {
          console.error('Error fetching profile:', e);
        }
      }
      
      // Also check mock session
      if (!session) {
        const savedUserId = localStorage.getItem('kakibook_session');
        if (savedUserId) {
          const u = store.getUser(savedUserId);
          if (u) setUser(u);
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Mock login (for demo compatibility)
  const login = useCallback((email: string, password: string): MockUser | null => {
    const u = store.login(email, password);
    if (u) {
      setUser(u);
      setIsSupabaseAuth(false);
      localStorage.setItem('kakibook_session', u.id);
    }
    return u;
  }, []);

  // Real Supabase login
  const loginWithSupabase = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return true;
  }, []);

  const signupPlayer = useCallback((email: string, password: string, displayName: string): MockUser => {
    const u = store.signupPlayer(email, password, displayName);
    setUser(u);
    setIsSupabaseAuth(false);
    localStorage.setItem('kakibook_session', u.id);
    return u;
  }, []);

  const signupOrganizer = useCallback((email: string, password: string, displayName: string): MockUser => {
    const u = store.signupOrganizer(email, password, displayName);
    setUser(u);
    setIsSupabaseAuth(false);
    localStorage.setItem('kakibook_session', u.id);
    return u;
  }, []);

  const signupPlayerSupabase = useCallback(async (email: string, password: string, displayName: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName }, emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
    return !!data.user;
  }, []);

  const signupOrganizerSupabase = useCallback(async (email: string, password: string, displayName: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName }, emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from('profiles').update({ verification_status: 'pending' }).eq('user_id', data.user.id);
    }
    return !!data.user;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await lovable.auth.signInWithOAuth('google', { redirect_uri: getAuthRedirectUrl() });
  }, []);

  const signInWithApple = useCallback(async () => {
    await lovable.auth.signInWithOAuth('apple', { redirect_uri: getAuthRedirectUrl() });
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email, options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseAuth) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
    setIsSupabaseAuth(false);
    localStorage.removeItem('kakibook_session');
  }, [isSupabaseAuth]);

  const refreshUser = useCallback(async () => {
    if (isSupabaseAuth && supabaseUser) {
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('user_id', supabaseUser.id).single();
      const { data: roles } = await supabase
        .from('user_roles').select('role').eq('user_id', supabaseUser.id);
      const role = roles && roles.length > 0 ? roles[0].role : 'user';
      if (profile) {
        setUser(supabaseUserToMockUser(profile, role));
      }
    } else if (user) {
      const updated = store.getUser(user.id);
      if (updated) setUser({ ...updated });
    }
  }, [user, supabaseUser, isSupabaseAuth]);

  return (
    <AuthContext.Provider value={{
      user,
      supabaseUser,
      session,
      isLoading,
      isAuthenticated: !!user,
      login,
      loginWithSupabase,
      signupPlayer,
      signupOrganizer,
      signupPlayerSupabase,
      signupOrganizerSupabase,
      signInWithGoogle,
      signInWithApple,
      signInWithMagicLink,
      logout,
      refreshUser,
      isSupabaseAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
