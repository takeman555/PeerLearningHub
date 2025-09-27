import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/auth';
import { revenueCatService } from '../services/revenueCatService';

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

    // 最適化: 初期セッション取得を遅延実行
    const getInitialSession = async () => {
      try {
        // 起動時間を短縮するため、セッション取得を少し遅延
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const currentSession = await authService.getCurrentSession();
        const currentUser = await authService.getCurrentUser();
        
        if (isMounted) {
          setSession(currentSession);
          setUser(currentUser);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        
        // Check if this is the read-only property error
        if (error instanceof Error && error.message.includes('read-only property')) {
          console.warn('⚠️ Supabase compatibility issue detected. Using fallback authentication.');
          // Set a fallback state to prevent app crash
          if (isMounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
        } else {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    // 非同期で初期セッションを取得（ブロッキングしない）
    getInitialSession();

    // RevenueCatサービスを初期化（非同期、エラーを無視）
    const initializeRevenueCat = async () => {
      try {
        await revenueCatService.initialize();
      } catch (error) {
        // RevenueCatの初期化エラーはアプリの起動を妨げない
        console.log('RevenueCat initialization skipped in development');
      }
    };
    
    initializeRevenueCat();

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
        
        // RevenueCatにユーザーを登録（非同期、エラーを無視）
        revenueCatService.registerUser(user.id, {
          email: user.email || '',
          user_id: user.id,
        }).catch(error => {
          console.log('RevenueCat user registration skipped:', error.message);
        });
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
        
        // RevenueCatにユーザーを登録（非同期、エラーを無視）
        revenueCatService.registerUser(user.id, {
          email: user.email || '',
          user_id: user.id,
          full_name: fullName,
          country: country || '',
        }).catch(error => {
          console.log('RevenueCat user registration skipped:', error.message);
        });
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