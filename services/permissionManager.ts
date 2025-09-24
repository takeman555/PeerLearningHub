import { supabase } from '../config/supabase';

// User role types based on database schema
export type UserRole = 'admin' | 'member' | 'guest';

// Permission check results
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

// User profile with role information
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  roles: string[];
}

/**
 * Permission Manager Service
 * Handles user role determination and permission checks for community management
 */
class PermissionManagerService {
  /**
   * Get user role based on database information
   * Maps database roles to simplified role system
   */
  async getUserRole(userId: string): Promise<UserRole> {
    try {
      // Get user profile and roles from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          is_active,
          user_roles!inner(role, is_active)
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (profileError || !profile) {
        console.warn('User profile not found or inactive:', userId);
        return 'guest';
      }

      // Extract active roles
      const activeRoles = profile.user_roles
        .filter((ur: any) => ur.is_active)
        .map((ur: any) => ur.role);

      // Determine highest privilege role
      if (activeRoles.includes('admin') || activeRoles.includes('super_admin')) {
        return 'admin';
      }

      if (activeRoles.includes('user') || activeRoles.includes('moderator')) {
        return 'member';
      }

      return 'guest';
    } catch (error) {
      console.error('Error determining user role:', error);
      return 'guest';
    }
  }

  /**
   * Check if user can create posts
   * Requirements: 2.1, 2.2 - Only members can create posts
   */
  async canCreatePost(userId: string): Promise<PermissionResult> {
    try {
      const userRole = await this.getUserRole(userId);

      if (userRole === 'guest') {
        return {
          allowed: false,
          reason: 'Only registered members can create posts. Please sign up or sign in to continue.'
        };
      }

      if (userRole === 'member' || userRole === 'admin') {
        return {
          allowed: true
        };
      }

      return {
        allowed: false,
        reason: 'Insufficient permissions to create posts.'
      };
    } catch (error) {
      console.error('Error checking post creation permission:', error);
      return {
        allowed: false,
        reason: 'Unable to verify permissions. Please try again.'
      };
    }
  }

  /**
   * Check if user can manage groups
   * Requirements: 6.1, 6.2, 6.4 - Only admins can manage groups
   */
  async canManageGroups(userId: string): Promise<PermissionResult> {
    try {
      const userRole = await this.getUserRole(userId);

      if (userRole === 'admin') {
        return {
          allowed: true
        };
      }

      return {
        allowed: false,
        reason: userRole === 'guest' 
          ? 'Please sign in as an administrator to manage groups.'
          : 'Only administrators can manage groups.'
      };
    } catch (error) {
      console.error('Error checking group management permission:', error);
      return {
        allowed: false,
        reason: 'Unable to verify permissions. Please try again.'
      };
    }
  }

  /**
   * Check if user can view member list
   * All authenticated users can view member list
   */
  async canViewMembers(userId: string): Promise<PermissionResult> {
    try {
      const userRole = await this.getUserRole(userId);

      if (userRole === 'member' || userRole === 'admin') {
        return {
          allowed: true
        };
      }

      return {
        allowed: false,
        reason: 'Please sign in to view the member list.'
      };
    } catch (error) {
      console.error('Error checking member view permission:', error);
      return {
        allowed: false,
        reason: 'Unable to verify permissions. Please try again.'
      };
    }
  }

  /**
   * Check if user can delete posts
   * Users can delete their own posts, admins can delete any post
   */
  async canDeletePost(userId: string, postAuthorId: string): Promise<PermissionResult> {
    try {
      const userRole = await this.getUserRole(userId);

      // Admins can delete any post
      if (userRole === 'admin') {
        return {
          allowed: true
        };
      }

      // Users can delete their own posts
      if (userRole === 'member' && userId === postAuthorId) {
        return {
          allowed: true
        };
      }

      return {
        allowed: false,
        reason: 'You can only delete your own posts.'
      };
    } catch (error) {
      console.error('Error checking post deletion permission:', error);
      return {
        allowed: false,
        reason: 'Unable to verify permissions. Please try again.'
      };
    }
  }

  /**
   * Get user profile with role information
   * Used for displaying user information in UI
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          is_active,
          user_roles!inner(role, is_active)
        `)
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.warn('User profile not found:', userId);
        return null;
      }

      const activeRoles = profile.user_roles
        .filter((ur: any) => ur.is_active)
        .map((ur: any) => ur.role);

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        is_active: profile.is_active,
        roles: activeRoles
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * Basic check for any authenticated user
   */
  async isAuthenticated(userId: string): Promise<boolean> {
    try {
      const userRole = await this.getUserRole(userId);
      return userRole !== 'guest';
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Batch permission check for multiple operations
   * Useful for UI components that need multiple permission checks
   */
  async checkMultiplePermissions(userId: string, permissions: string[]): Promise<Record<string, PermissionResult>> {
    const results: Record<string, PermissionResult> = {};

    for (const permission of permissions) {
      switch (permission) {
        case 'createPost':
          results[permission] = await this.canCreatePost(userId);
          break;
        case 'manageGroups':
          results[permission] = await this.canManageGroups(userId);
          break;
        case 'viewMembers':
          results[permission] = await this.canViewMembers(userId);
          break;
        default:
          results[permission] = {
            allowed: false,
            reason: 'Unknown permission type'
          };
      }
    }

    return results;
  }
}

// Export singleton instance
export const permissionManager = new PermissionManagerService();
export default permissionManager;