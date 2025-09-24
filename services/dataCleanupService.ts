import { supabase } from '../config/supabase';
import { permissionManager } from './permissionManager';

// Data cleanup operation results
export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  message: string;
  timestamp: Date;
}

// Data integrity validation result
export interface IntegrityValidationResult {
  isValid: boolean;
  issues: string[];
  orphanedRecords: {
    postLikes: number;
    groupMemberships: number;
  };
  timestamp: Date;
}

// Complete cleanup operation result
export interface CompleteCleanupResult {
  postsCleanup: CleanupResult;
  groupsCleanup: CleanupResult;
  integrityValidation: IntegrityValidationResult;
  overallSuccess: boolean;
}

/**
 * Data Cleanup Service
 * Handles cleanup operations for posts and groups while maintaining data integrity
 * Requirements: 1.1, 1.2, 1.3
 */
class DataCleanupService {
  /**
   * Delete all posts from the database
   * Requirements: 1.1 - All existing posts should be deleted from database
   */
  async clearAllPosts(adminUserId: string): Promise<CleanupResult> {
    try {
      // Verify admin permissions
      const permission = await permissionManager.canManageGroups(adminUserId);
      if (!permission.allowed) {
        return {
          success: false,
          deletedCount: 0,
          message: `Permission denied: ${permission.reason}`,
          timestamp: new Date()
        };
      }

      // Use the database function for safe cleanup
      const { data, error } = await supabase.rpc('cleanup_all_posts');

      if (error) {
        console.error('Error clearing posts:', error);
        return {
          success: false,
          deletedCount: 0,
          message: `Database error: ${error.message}`,
          timestamp: new Date()
        };
      }

      return {
        success: true,
        deletedCount: data || 0,
        message: `Successfully deleted ${data || 0} posts and related data`,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error in clearAllPosts:', error);
      return {
        success: false,
        deletedCount: 0,
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Delete all groups from the database
   * Requirements: 1.2 - All existing groups should be deleted from database
   */
  async clearAllGroups(adminUserId: string): Promise<CleanupResult> {
    try {
      // Verify admin permissions
      const permission = await permissionManager.canManageGroups(adminUserId);
      if (!permission.allowed) {
        return {
          success: false,
          deletedCount: 0,
          message: `Permission denied: ${permission.reason}`,
          timestamp: new Date()
        };
      }

      // Use the database function for safe cleanup
      const { data, error } = await supabase.rpc('cleanup_all_groups');

      if (error) {
        console.error('Error clearing groups:', error);
        return {
          success: false,
          deletedCount: 0,
          message: `Database error: ${error.message}`,
          timestamp: new Date()
        };
      }

      return {
        success: true,
        deletedCount: data || 0,
        message: `Successfully deleted ${data || 0} groups and related data`,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error in clearAllGroups:', error);
      return {
        success: false,
        deletedCount: 0,
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate data integrity after cleanup operations
   * Requirements: 1.3 - System maintains referential integrity across all related tables
   */
  async validateDataIntegrity(): Promise<IntegrityValidationResult> {
    try {
      // Use the database function for integrity validation
      const { data, error } = await supabase.rpc('validate_data_integrity');

      if (error) {
        console.error('Error validating data integrity:', error);
        return {
          isValid: false,
          issues: [`Database error during validation: ${error.message}`],
          orphanedRecords: {
            postLikes: -1,
            groupMemberships: -1
          },
          timestamp: new Date()
        };
      }

      // Get detailed orphaned record counts
      const orphanedCounts = await this.getOrphanedRecordCounts();

      const issues: string[] = [];
      if (!data) {
        issues.push('Data integrity validation failed');
      }
      if (orphanedCounts.postLikes > 0) {
        issues.push(`Found ${orphanedCounts.postLikes} orphaned post likes`);
      }
      if (orphanedCounts.groupMemberships > 0) {
        issues.push(`Found ${orphanedCounts.groupMemberships} orphaned group memberships`);
      }

      return {
        isValid: data === true && issues.length === 0,
        issues,
        orphanedRecords: orphanedCounts,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error in validateDataIntegrity:', error);
      return {
        isValid: false,
        issues: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        orphanedRecords: {
          postLikes: -1,
          groupMemberships: -1
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get counts of orphaned records for detailed reporting
   */
  private async getOrphanedRecordCounts(): Promise<{ postLikes: number; groupMemberships: number }> {
    try {
      // Check for orphaned post likes
      const { count: orphanedLikes } = await supabase
        .from('post_likes')
        .select('id', { count: 'exact', head: true })
        .not('post_id', 'in', 
          supabase.from('posts').select('id')
        );

      // Check for orphaned group memberships
      const { count: orphanedMemberships } = await supabase
        .from('group_memberships')
        .select('id', { count: 'exact', head: true })
        .not('group_id', 'in', 
          supabase.from('groups').select('id')
        );

      return {
        postLikes: orphanedLikes || 0,
        groupMemberships: orphanedMemberships || 0
      };
    } catch (error) {
      console.error('Error getting orphaned record counts:', error);
      return {
        postLikes: -1,
        groupMemberships: -1
      };
    }
  }

  /**
   * Perform complete data cleanup and validation
   * Combines all cleanup operations in proper sequence
   */
  async performCompleteCleanup(adminUserId: string): Promise<CompleteCleanupResult> {
    try {
      // Verify admin permissions first
      const permission = await permissionManager.canManageGroups(adminUserId);
      if (!permission.allowed) {
        const errorResult: CleanupResult = {
          success: false,
          deletedCount: 0,
          message: `Permission denied: ${permission.reason}`,
          timestamp: new Date()
        };

        return {
          postsCleanup: errorResult,
          groupsCleanup: errorResult,
          integrityValidation: {
            isValid: false,
            issues: ['Permission denied for cleanup operations'],
            orphanedRecords: { postLikes: 0, groupMemberships: 0 },
            timestamp: new Date()
          },
          overallSuccess: false
        };
      }

      // Perform cleanup operations in sequence
      const postsCleanup = await this.clearAllPosts(adminUserId);
      const groupsCleanup = await this.clearAllGroups(adminUserId);
      
      // Validate integrity after cleanup
      const integrityValidation = await this.validateDataIntegrity();

      const overallSuccess = postsCleanup.success && 
                           groupsCleanup.success && 
                           integrityValidation.isValid;

      return {
        postsCleanup,
        groupsCleanup,
        integrityValidation,
        overallSuccess
      };
    } catch (error) {
      console.error('Error in performCompleteCleanup:', error);
      const errorMessage = `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      const errorResult: CleanupResult = {
        success: false,
        deletedCount: 0,
        message: errorMessage,
        timestamp: new Date()
      };

      return {
        postsCleanup: errorResult,
        groupsCleanup: errorResult,
        integrityValidation: {
          isValid: false,
          issues: [errorMessage],
          orphanedRecords: { postLikes: 0, groupMemberships: 0 },
          timestamp: new Date()
        },
        overallSuccess: false
      };
    }
  }

  /**
   * Use the database's complete reset function
   * This leverages the perform_community_reset function for atomic operations
   */
  async performCommunityReset(adminUserId?: string): Promise<any> {
    try {
      // If adminUserId provided, verify permissions
      if (adminUserId) {
        const permission = await permissionManager.canManageGroups(adminUserId);
        if (!permission.allowed) {
          throw new Error(`Permission denied: ${permission.reason}`);
        }
      }

      // Use the database function for atomic reset
      const { data, error } = await supabase.rpc('perform_community_reset', {
        admin_user_id: adminUserId || null
      });

      if (error) {
        console.error('Error performing community reset:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in performCommunityReset:', error);
      throw error;
    }
  }

  /**
   * Get cleanup operation status/history
   * Useful for admin dashboards and monitoring
   */
  async getCleanupStatus(): Promise<{
    postsCount: number;
    groupsCount: number;
    postLikesCount: number;
    groupMembershipsCount: number;
    lastUpdated: Date;
  }> {
    try {
      // Get current counts
      const [postsResult, groupsResult, likesResult, membershipsResult] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('groups').select('id', { count: 'exact', head: true }),
        supabase.from('post_likes').select('id', { count: 'exact', head: true }),
        supabase.from('group_memberships').select('id', { count: 'exact', head: true })
      ]);

      return {
        postsCount: postsResult.count || 0,
        groupsCount: groupsResult.count || 0,
        postLikesCount: likesResult.count || 0,
        groupMembershipsCount: membershipsResult.count || 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting cleanup status:', error);
      return {
        postsCount: -1,
        groupsCount: -1,
        postLikesCount: -1,
        groupMembershipsCount: -1,
        lastUpdated: new Date()
      };
    }
  }
}

// Export singleton instance
export const dataCleanupService = new DataCleanupService();
export default dataCleanupService;