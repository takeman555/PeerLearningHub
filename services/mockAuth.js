/**
 * Mock Authentication Service for Development and Testing (JavaScript version)
 */

// Mock user storage
const mockUsers = new Map();
const mockProfiles = new Map();
let currentUser = null;
let currentSession = null;

class MockAuthService {
  /**
   * Mock sign up implementation
   */
  async signUp({ email, password, fullName, country }) {
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
  async signIn({ email, password }) {
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
  async signOut() {
    try {
      currentUser = null;
      currentSession = null;
      console.log('✅ Mock user signed out successfully');
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Get current mock user
   */
  async getCurrentUser() {
    return currentUser;
  }

  /**
   * Get current mock session
   */
  async getCurrentSession() {
    return currentSession;
  }

  /**
   * Mock password reset
   */
  async resetPassword(email) {
    try {
      console.log('✅ Mock password reset email sent to:', email);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Create mock profile
   */
  async createProfile(userId, profileData) {
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
  async getProfile(userId) {
    try {
      const profile = mockProfiles.get(userId);
      if (!profile) {
        console.warn('Mock profile not found for user:', userId);
        return null;
      }
      return profile;
    } catch (error) {
      console.error('Mock profile fetch error:', error);
      return null;
    }
  }

  /**
   * Update mock profile
   */
  async updateProfile(userId, profileData) {
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
  onAuthStateChange(callback) {
    // Return a mock subscription object
    return {
      data: {
        subscription: {
          unsubscribe: () => {
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

const mockAuthService = new MockAuthService();

module.exports = { mockAuthService };