/**
 * Role-based Access Control Utilities
 */

export type UserRole = 'member' | 'admin' | 'super_admin';

export interface UserPermissions {
  canAccessAdmin: boolean;
  canManageUsers: boolean;
  canManageContent: boolean;
  canViewReports: boolean;
  canManageSystem: boolean;
  canViewAnalytics: boolean;
}

/**
 * Get user permissions based on role
 */
export function getUserPermissions(role?: string): UserPermissions {
  switch (role) {
    case 'super_admin':
      return {
        canAccessAdmin: true,
        canManageUsers: true,
        canManageContent: true,
        canViewReports: true,
        canManageSystem: true,
        canViewAnalytics: true,
      };
    
    case 'admin':
      return {
        canAccessAdmin: true,
        canManageUsers: true,
        canManageContent: true,
        canViewReports: true,
        canManageSystem: false,
        canViewAnalytics: true,
      };
    
    case 'member':
    default:
      return {
        canAccessAdmin: false,
        canManageUsers: false,
        canManageContent: false,
        canViewReports: false,
        canManageSystem: false,
        canViewAnalytics: false,
      };
  }
}

/**
 * Check if user has admin access
 */
export function hasAdminAccess(role?: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Check if user has specific permission
 */
export function hasPermission(role?: string, permission: keyof UserPermissions): boolean {
  const permissions = getUserPermissions(role);
  return permissions[permission];
}

/**
 * Get user role display text
 */
export function getRoleDisplayText(role?: string): string {
  switch (role) {
    case 'super_admin':
      return 'スーパー管理者';
    case 'admin':
      return '管理者';
    case 'member':
      return 'メンバー';
    default:
      return 'ゲスト';
  }
}

/**
 * Get role color for UI
 */
export function getRoleColor(role?: string): string {
  switch (role) {
    case 'super_admin':
      return '#dc2626'; // Red
    case 'admin':
      return '#f59e0b'; // Orange
    case 'member':
      return '#10b981'; // Green
    default:
      return '#6b7280'; // Gray
  }
}