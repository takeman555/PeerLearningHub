/**
 * Mock Authentication Service for Development and Testing
 * 
 * This service provides a mock implementation of authentication
 * when real Supabase credentials are not available.
 */

export interface MockAuthResponse {
  user: any;
  session: any;
  error: any;
}

export interface MockSignUpData {
  email: string;
  password: string;
  fullName: string;
  country?: string;
}

export interface MockSignInData {
  email: string;
  password: string;
}

export interface MockProfileData {
  full_name?: string;
  avatar_url?: string;
  country?: string;
  bio?: string;
  skills?: string[];
}

// Mock user storage
const mockUsers = new Map<string, any>();
const mockProfiles = new Map<string, any>();
let currentUser: any = null;
let currentSession: any = null;

// Auth state change listeners
const authStateListeners: Array<(event: string, session: any) => void> = [];

// Pre-populate test users with different roles
const initializeTestUsers = () => {
  const testUsers = [
    // Regular Members
    {
      email: 'member1@example.com',
      password: 'password123',
      fullName: '田中 太郎',
      country: 'Japan',
      role: 'member',
      bio: '日本語を学習中の学生です。プログラミングにも興味があります。'
    },
    {
      email: 'member2@example.com',
      password: 'password123', 
      fullName: 'Sarah Johnson',
      country: 'USA',
      role: 'member',
      bio: 'Digital nomad interested in Japanese culture and language learning.'
    },
    {
      email: 'member3@example.com',
      password: 'password123',
      fullName: 'Kim Min-jun',
      country: 'South Korea',
      role: 'member',
      bio: '韓国からの留学生です。日本で働きたいと思っています。'
    },
    // Administrators
    {
      email: 'admin@peerlearning.com',
      password: 'admin123',
      fullName: '管理者 一郎',
      country: 'Japan',
      role: 'admin',
      bio: 'ピアラーニングハブの管理者です。'
    },
    {
      email: 'tizuka0@gmail.com',
      password: 'password123',
      fullName: 'Tizuka Admin',
      country: 'Japan',
      role: 'admin',
      bio: 'システム開発者・管理者'
    },
    // Developer/Super Admin
    {
      email: 'dev@peerlearning.com',
      password: 'devpassword123',
      fullName: 'Developer User',
      country: 'Japan',
      role: 'super_admin',
      bio: 'システム開発者・スーパー管理者'
    }
  ];

  testUsers.forEach(testUser => {
    const userId = `mock-user-${testUser.email}`;
    const user = {
      id: userId,
      email: testUser.email,
      email_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      user_metadata: {
        full_name: testUser.fullName,
        country: testUser.country,
        role: testUser.role
      }
    };

    // Store user
    mockUsers.set(testUser.email, { user, password: testUser.password });
    
    // Create profile with role and bio
    const profile = {
      id: userId,
      email: testUser.email,
      full_name: testUser.fullName,
      country: testUser.country,
      role: testUser.role,
      bio: testUser.bio,
      skills: testUser.role === 'admin' || testUser.role === 'super_admin' 
        ? ['管理', 'サポート', 'システム運用'] 
        : ['言語学習', 'コミュニケーション'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockProfiles.set(userId, profile);
  });

  // Only log if mock auth is actually being used
  const USE_MOCK_AUTH = process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                       process.env.NODE_ENV === 'test' ||
                       !process.env.EXPO_PUBLIC_SUPABASE_URL ||
                       !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (USE_MOCK_AUTH) {
    console.log('✅ Mock test users initialized:', Array.from(mockUsers.keys()));
  }
};

// Initialize test users immediately
initializeTestUsers();

class MockAuthService {
  /**
   * Mock sign up implementation
   */
  async signUp({ email, password, fullName, country }: MockSignUpData): Promise<MockAuthResponse> {
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

      if (password.length < 6) {
        return {
          user: null,
          session: null,
          error: {
            message: 'Password must be at least 6 characters long',
            name: 'ValidationError'
          }
        };
      }

      // Check if user already exists
      if (mockUsers.has(email)) {
        return {
          user: null,
          session: null,
          error: {
            message: 'User already registered',
            name: 'AuthApiError'
          }
        };
      }

      // Create mock user
      const userId = `mock-user-${Date.now()}`;
      const user = {
        id: userId,
        email,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        user_metadata: {
          full_name: fullName,
          country: country || null
        }
      };

      // Create mock session
      const session = {
        access_token: `mock-token-${Date.now()}`,
        refresh_token: `mock-refresh-${Date.now()}`,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        user
      };

      // Store user and create profile
      mockUsers.set(email, { user, password });
      await this.createProfile(userId, {
        full_name: fullName,
        country: country || undefined
      });

      currentUser = user;
      currentSession = session;

      // Skip auth state change listeners for mock auth to prevent infinite loops
      // State is managed manually in AuthContext

      console.log('✅ Mock user registered successfully:', email);
      return { user, session, error: null };

    } catch (error) {
      console.error('Mock sign up error:', error);
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
   * Mock sign in implementation
   */
  async signIn({ email, password }: MockSignInData): Promise<MockAuthResponse> {
    try {
      // Validate input
      if (!email || !password) {
        return {
          user: null,
          session: null,
          error: {
            message: 'Email and password are required',
            name: 'ValidationError'
          }
        };
      }

      // Check if user exists
      const userData = mockUsers.get(email);
      if (!userData) {
        return {
          user: null,
          session: null,
          error: {
            message: 'Invalid email or password. Please check your credentials and try again.',
            name: 'AuthApiError'
          }
        };
      }

      // Check password
      if (userData.password !== password) {
        return {
          user: null,
          session: null,
          error: {
            message: 'Invalid email or password. Please check your credentials and try again.',
            name: 'AuthApiError'
          }
        };
      }

      // Create new session
      const session = {
        access_token: `mock-token-${Date.now()}`,
        refresh_token: `mock-refresh-${Date.now()}`,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: userData.user
      };

      currentUser = userData.user;
      currentSession = session;

      // Skip auth state change listeners for mock auth to prevent infinite loops
      // State is managed manually in AuthContext

      console.log('✅ Mock user signed in successfully:', email);
      return { user: userData.user, session, error: null };

    } catch (error) {
      console.error('Mock sign in error:', error);
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
   * Mock sign out implementation
   */
  async signOut(): Promise<{ error: any }> {
    try {
      currentUser = null;
      currentSession = null;

      // Skip auth state change listeners for mock auth to prevent infinite loops
      // State is managed manually in AuthContext

      console.log('✅ Mock user signed out successfully');
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Get current mock user
   */
  async getCurrentUser(): Promise<any> {
    return currentUser;
  }

  /**
   * Get current mock session
   */
  async getCurrentSession(): Promise<any> {
    return currentSession;
  }

  /**
   * Mock password reset
   */
  async resetPassword(email: string): Promise<{ error: any }> {
    try {
      console.log('✅ Mock password reset email sent to:', email);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Mock password update
   */
  async updatePassword(newPassword: string): Promise<{ error: any }> {
    try {
      if (!currentUser) {
        return {
          error: {
            message: 'No user logged in',
            name: 'AuthError'
          }
        };
      }

      // Update password in mock storage
      const userData = Array.from(mockUsers.values()).find(u => u.user.id === currentUser.id);
      if (userData) {
        userData.password = newPassword;
      }

      console.log('✅ Mock password updated successfully');
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Create mock profile
   */
  private async createProfile(userId: string, profileData: MockProfileData) {
    try {
      const profile = {
        id: userId,
        email: currentUser?.email || '',
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockProfiles.set(userId, profile);
      console.log('✅ Mock profile created for user:', userId);
    } catch (error) {
      console.error('Mock profile creation error:', error);
      throw error;
    }
  }

  /**
   * Get mock profile
   */
  async getProfile(userId: string) {
    try {
      const profile = mockProfiles.get(userId);
      if (!profile) {
        console.warn('Mock profile not found for user:', userId);
        return null;
      }
      console.log('✅ Mock profile retrieved:', profile);
      return profile;
    } catch (error) {
      console.error('Mock profile fetch error:', error);
      return null;
    }
  }

  /**
   * Update mock profile
   */
  async updateProfile(userId: string, profileData: MockProfileData) {
    try {
      const existingProfile = mockProfiles.get(userId);
      if (!existingProfile) {
        return {
          data: null,
          error: {
            message: 'Profile not found',
            name: 'NotFoundError'
          }
        };
      }

      const updatedProfile = {
        ...existingProfile,
        ...profileData,
        updated_at: new Date().toISOString()
      };

      mockProfiles.set(userId, updatedProfile);
      console.log('✅ Mock profile updated for user:', userId);
      
      return { data: updatedProfile, error: null };
    } catch (error) {
      console.error('Mock profile update error:', error);
      return { data: null, error };
    }
  }

  /**
   * Mock auth state change listener
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Add callback to listeners array
    authStateListeners.push(callback);
    
    // Return a mock subscription object
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = authStateListeners.indexOf(callback);
            if (index > -1) {
              authStateListeners.splice(index, 1);
            }
            console.log('Mock auth state change listener unsubscribed');
          }
        }
      }
    };
  }

  /**
   * Clear all mock data (for testing)
   */
  clearMockData() {
    mockUsers.clear();
    mockProfiles.clear();
    currentUser = null;
    currentSession = null;
    console.log('✅ Mock data cleared');
  }
}

export const mockAuthService = new MockAuthService();