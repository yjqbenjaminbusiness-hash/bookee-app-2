import { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { store, type MockUser } from '../lib/mockData';

interface AuthContextType {
  user: MockUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => MockUser | null;
  signupPlayer: (email: string, password: string, displayName: string) => MockUser;
  signupOrganizer: (email: string, password: string, displayName: string) => MockUser;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem('kakibook_session');
    if (savedUserId) {
      const u = store.getUser(savedUserId);
      if (u) setUser(u);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((email: string, password: string): MockUser | null => {
    const u = store.login(email, password);
    if (u) {
      setUser(u);
      localStorage.setItem('kakibook_session', u.id);
    }
    return u;
  }, []);

  const signupPlayer = useCallback((email: string, password: string, displayName: string): MockUser => {
    const u = store.signupPlayer(email, password, displayName);
    setUser(u);
    localStorage.setItem('kakibook_session', u.id);
    return u;
  }, []);

  const signupOrganizer = useCallback((email: string, password: string, displayName: string): MockUser => {
    const u = store.signupOrganizer(email, password, displayName);
    setUser(u);
    localStorage.setItem('kakibook_session', u.id);
    return u;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('kakibook_session');
  }, []);

  const refreshUser = useCallback(() => {
    if (user) {
      const updated = store.getUser(user.id);
      if (updated) setUser({ ...updated });
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      signupPlayer,
      signupOrganizer,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
