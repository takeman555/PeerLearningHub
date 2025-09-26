import { supabase } from '../config/supabase';
import { AuthError, User, Session } from '@supabase/supabase-js';
import { mockAuthService } from './mockAuth';
import { authenticationSecurityService } from './authenticationSecurityService';

// Determine whether to use mock authentication based on environment
const USE_MOCK_AUTH = process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                     process.env.NODE_ENV === 'test' ||
                     !process.env.EXPO_PUBLIC_SUPABASE_URL ||
                     !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Log authentication mode on service initialization
console.log('🔧 Authentication Service:', USE_MOCK_AUTH ? 'Mock Mode (Development)' : 'Real Database Mode');

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: any;
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
    // Use mock service if Supabase is not properly configured
    if (USE_MOCK_AUTH) {
      console.log('🔄 Using mock authentication service');
      return await mockAuthService.signUp({ email, password, fullName, country });
    }
    try {
      // Validate input
      if (!email || !password || !fullName) {
        return {
          user: null,
          session: null,
          error: {
            message: 'Email, password, and full name are required',
            name: 'ValidationError'
          }
        };
      }

      // Enhanced password validation
      const passwordStrength = authenticationSecurityService.validatePasswordStrength(password);
      if (passwordStrength.strength === 'very-weak' || passwordStrength.strength === 'weak') {
        return {
          user: null,
          session: null,
          error: {
            message: `Password is too weak. ${passwordStrength.feedback.join(', ')}`,
            name: 'WeakPasswordError'
          }
        };
      }

      // Check password against breach databases
      const breachCheck = await authenticationSecurityService.checkPasswordBreach(password);
      if (breachCheck.isBreached) {
        return {
          user: null,
          session: null,
          error: {
            message: 'This password has been found in data breaches. Please choose a different password.',
            name: 'BreachedPasswordError'
          }
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            country: country || undefined,
          },
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);
        
        // Check if it's a configuration error
        if (error.message.includes('Invalid API key') || error.message.includes('Project not found')) {
          return { 
            user: null, 
            session: null, 
            error: {
              message: 'アプリの設定に問題があります。Supabaseプロジェクトの設定を確認してください。',
              name: 'ConfigurationError',
              originalError: error
            }
          };
        }
        
        return { user: null, session: null, error };
      }

      // Note: Profile creation will be handled later when tables are set up
      // For now, just log that the user was created successfully
      if (data.user) {
        console.log('✅ User created successfully:', data.user.email);
        // Skip profile creation for now to avoid table errors
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        user: null, 
        session: null, 
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          name: 'UnexpectedError'
        }
      };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn({ email, password }: SignInData, deviceInfo?: {
    userAgent: string;
    ipAddress: string;
    deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  }): Promise<AuthResponse> {
    // Use mock service if Supabase is not properly configured
    if (USE_MOCK_AUTH) {
      console.log('🔄 Using mock authentication service');
      return await mockAuthService.signIn({ email, password });
    }
    
    const ipAddress = deviceInfo?.ipAddress || 'unknown';
    const userAgent = deviceInfo?.userAgent || 'unknown';
    
    try {
      // Check if IP is blocked
      if (authenticationSecurityService.isIPBlocked(ipAddress)) {
        await authenticationSecurityService.recordLoginAttempt(
          email, ipAddress, userAgent, false, 'IP blocked due to suspicious activity'
        );
        
        return {
          user: null,
          session: null,
          error: {
            message: 'Access temporarily blocked due to suspicious activity. Please try again later.',
            name: 'BlockedIPError'
          }
        };
      }

      // Validate input
      if (!email || !password) {
        await authenticationSecurityService.recordLoginAttempt(
          email, ipAddress, userAgent, false, 'Missing credentials'
        );
        
        return {
          user: null,
          session: null,
          error: {
            message: 'Email and password are required',
            name: 'ValidationError'
          }
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Record failed login attempt
        let failureReason = error.message;
        if (error.message.includes('Invalid login credentials')) {
          failureReason = 'Invalid credentials';
        } else if (error.message.includes('Email not confirmed')) {
          failureReason = 'Email not confirmed';
        } else if (error.message.includes('Too many requests')) {
          failureReason = 'Rate limited';
        }
        
        await authenticationSecurityService.recordLoginAttempt(
          email, ipAddress, userAgent, false, failureReason
        );

        // Provide user-friendly error messages
        let friendlyMessage = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
          friendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          friendlyMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          friendlyMessage = 'Too many login attempts. Please wait a moment before trying again.';
        }

        return { 
          user: null, 
          session: null, 
          error: { ...error, message: friendlyMessage } 
        };
      }

      // Record successful login attempt
      await authenticationSecurityService.recordLoginAttempt(
        email, ipAddress, userAgent, true
      );

      // Create secure session if device info is provided
      if (data.user && deviceInfo) {
        await authenticationSecurityService.createSession(data.user.id, {
          userAgent,
          ipAddress,
          deviceType: deviceInfo.deviceType,
        });
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        user: null, 
        session: null, 
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred during sign in',
          name: 'UnexpectedError'
        }
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: any }> {
    if (USE_MOCK_AUTH) {
      console.log('🔄 Using mock authentication service');
      return await mockAuthService.signOut();
    }
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
    if (USE_MOCK_AUTH) {
      return await mockAuthService.getCurrentUser();
    }
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
    if (USE_MOCK_AUTH) {
      return await mockAuthService.getCurrentSession();
    }
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
  async resetPassword(email: string): Promise<{ error: any }> {
    if (USE_MOCK_AUTH) {
      return await mockAuthService.resetPassword(email);
    }
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
  async updatePassword(newPassword: string): Promise<{ error: any }> {
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
   * Get user profile
   */
  async getProfile(userId: string) {
    if (USE_MOCK_AUTH) {
      return await mockAuthService.getProfile(userId);
    }
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
    if (USE_MOCK_AUTH) {
      return await mockAuthService.updateProfile(userId, profileData);
    }
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
      return { data: null, error };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (USE_MOCK_AUTH) {
      return mockAuthService.onAuthStateChange(callback);
    }
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string) {
    return authenticationSecurityService.validatePasswordStrength(password);
  }

  /**
   * Generate secure password
   */
  generateSecurePassword(length: number = 16): string {
    return authenticationSecurityService.generateSecurePassword(length);
  }

  /**
   * Check password against breach databases
   */
  async checkPasswordBreach(password: string) {
    return await authenticationSecurityService.checkPasswordBreach(password);
  }

  /**
   * Setup multi-factor authentication
   */
  async setupMFA(userId: string) {
    return await authenticationSecurityService.setupTOTPMFA(userId);
  }

  /**
   * Enable multi-factor authentication
   */
  async enableMFA(userId: string, verificationCode: string): Promise<boolean> {
    return await authenticationSecurityService.enableMFA(userId, verificationCode);
  }

  /**
   * Verify TOTP code
   */
  async verifyTOTPCode(userId: string, code: string): Promise<boolean> {
    return await authenticationSecurityService.verifyTOTPCode(userId, code);
  }

  /**
   * Get user sessions
   */
  getUserSessions(userId: string) {
    return authenticationSecurityService.getUserSessions(userId);
  }

  /**
   * Invalidate session
   */
  invalidateSession(sessionId: string): boolean {
    return authenticationSecurityService.invalidateSession(sessionId);
  }

  /**
   * Invalidate all user sessions
   */
  invalidateAllUserSessions(userId: string): number {
    return authenticationSecurityService.invalidateAllUserSessions(userId);
  }

  /**
   * Get login history
   */
  getLoginHistory(email: string, limit?: number) {
    return authenticationSecurityService.getLoginHistory(email, limit);
  }

  /**
   * Get authentication security report
   */
  getSecurityReport() {
    return authenticationSecurityService.getAuthenticationSecurityReport();
  }

  /**
   * Enhanced password update with security checks
   */
  async updatePasswordSecure(currentPassword: string, newPassword: string): Promise<{ error: any }> {
    try {
      // Validate new password strength
      const passwordStrength = authenticationSecurityService.validatePasswordStrength(newPassword);
      if (passwordStrength.strength === 'very-weak' || passwordStrength.strength === 'weak') {
        return {
          error: {
            message: `New password is too weak. ${passwordStrength.feedback.join(', ')}`,
            name: 'WeakPasswordError'
          }
        };
      }

      // Check new password against breach databases
      const breachCheck = await authenticationSecurityService.checkPasswordBreach(newPassword);
      if (breachCheck.isBreached) {
        return {
          error: {
            message: 'This password has been found in data breaches. Please choose a different password.',
            name: 'BreachedPasswordError'
          }
        };
      }

      // Verify current password by attempting to sign in
      const currentUser = await this.getCurrentUser();
      if (!currentUser?.email) {
        return {
          error: {
            message: 'User not authenticated',
            name: 'AuthenticationError'
          }
        };
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (!error) {
        // Log password change event
        await authenticationSecurityService['logSecurityEvent']({
          type: 'password_change',
          userId: currentUser.id,
          details: {
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date(),
          severity: 'medium',
        });

        // Invalidate all other sessions for security
        authenticationSecurityService.invalidateAllUserSessions(currentUser.id);
      }

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }
}

// Export the appropriate auth service based on configuration
export const authService = new AuthService();