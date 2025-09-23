import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, country?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const currentSession = await authService.getCurrentSession();
        const currentUser = await authService.getCurrentUser();
        
        if (isMounted) {
          setSession(currentSession);
          setUser(currentUser);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Skip auth state change listeners to prevent infinite loops
    // All state management is handled manually in signIn/signUp/signOut methods

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { user, session, error } = await authService.signIn({ email, password });
      
      if (error) {
        setLoading(false);
        return { error };
      }

      // For mock auth, manually update state since listeners don't work
      if (user && session) {
        setSession(session);
        setUser(user);
      }
      setLoading(false);
      
      return { error: null };
    } catch (error) {
      console.error('SignIn error in context:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, country?: string) => {
    try {
      setLoading(true);
      const { user, session, error } = await authService.signUp({
        email,
        password,
        fullName,
        country,
      });
      
      if (error) {
        setLoading(false);
        return { error };
      }

      // For mock auth, manually update state since listeners don't work
      if (user && session) {
        setSession(session);
        setUser(user);
      }
      setLoading(false);
      
      return { error: null };
    } catch (error) {
      console.error('SignUp error in context:', error);
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await authService.resetPassword(email);
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
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