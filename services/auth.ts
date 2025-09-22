import { supabase } from '../config/supabase';
import { AuthError, User, Session } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  country?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ProfileData {
  full_name?: string;
  avatar_url?: string;
  country?: string;
  bio?: string;
  skills?: string[];
}

class AuthService {
  /**
   * Sign up a new user
   */
  async signUp({ email, password, fullName, country }: SignUpData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            country: country || null,
          },
        },
      });

      if (error) {
        return { user: null, session: null, error };
      }

      // Create profile record
      if (data.user) {
        await this.createProfile(data.user.id, {
          full_name: fullName,
          country: country || null,
        });
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      return { 
        user: null, 
        session: null, 
        error: error as AuthError 
      };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn({ email, password }: SignInData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { user: data.user, session: data.session, error };
    } catch (error) {
      return { 
        user: null, 
        session: null, 
        error: error as AuthError 
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get the current session
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'peerlearninghub://reset-password',
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Create user profile
   */
  private async createProfile(userId: string, profileData: ProfileData) {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: (await this.getCurrentUser())?.email || '',
          ...profileData,
        });

      if (error) {
        console.error('Error creating profile:', error);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: ProfileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error: error as AuthError };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();