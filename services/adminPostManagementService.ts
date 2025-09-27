/**
 * Admin Post Management Service
 * Handles administrative functions for post management
 */

import { supabase } from '../config/supabase';
import { permissionManager } from './permissionManager';

export interface AdminPostAction {
  postId: string;
  action: 'delete' | 'hide' | 'restore' | 'feature';
  reason?: string;
  adminId: string;
}

export interface PostModerationLog {
  id: string;
  postId: string;
  adminId: string;
  action: string;
  reason?: string;
  timestamp: Date;
  adminName?: string;
}

export interface AdminPostSummary {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
  isActive: boolean;
  tags: string[];
  moderationLogs?: PostModerationLog[];
}

class AdminPostManagementService {
  /**
   * Get all posts for admin review with author information
   */
  async getAllPostsForAdmin(
    adminId: string,
    limit: number = 50,
    offset: number = 0,
    includeInactive: boolean = true
  ): Promise<{ posts: AdminPostSummary[]; total: number; hasMore: boolean }> {
    try {
      // Check admin permissions
      const permission = await permissionManager.isAdmin(adminId);
      if (!permission) {
        throw new Error('Admin access required');
      }

      // Build query conditions
      let query = supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          tags,
          likes_count,
          comments_count,
          is_active,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter by active status if requested
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data: posts, error } = await query;

      if (error) {
        console.error('Error fetching posts for admin:', error);
        throw new Error('Failed to fetch posts');
      }

      // Get author information for each post
      const postsWithAuthors: AdminPostSummary[] = [];
      
      if (posts) {
        for (const post of posts) {
          // Get author profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', post.user_id)
            .single();

          postsWithAuthors.push({
            id: post.id,
            content: post.content,
            authorId: post.user_id,
            authorName: profile?.full_name || 'Unknown User',
            authorEmail: profile?.email || 'unknown@example.com',
            createdAt: new Date(post.created_at),
            updatedAt: new Date(post.updated_at),
            likesCount: post.likes_count || 0,
            commentsCount: post.comments_count || 0,
            isActive: post.is_active,
            tags: post.tags || []
          });
        }
      }

      // Get total count
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', includeInactive ? undefined : true);

      return {
        posts: postsWithAuthors,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };
    } catch (error) {
      console.error('Error in getAllPostsForAdmin:', error);
      throw error;
    }
  }

  /**
   * Delete a post (admin action)
   */
  async deletePost(adminId: string, postId: string, reason?: string): Promise<void> {
    try {
      // Check admin permissions
      const permission = await permissionManager.isAdmin(adminId);
      if (!permission) {
        throw new Error('Admin access required');
      }

      // Get post information for logging
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('user_id, content')
        .eq('id', postId)
        .single();

      if (fetchError || !post) {
        throw new Error('Post not found');
      }

      // Soft delete the post
      const { error } = await supabase
        .from('posts')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', postId);

      if (error) {
        console.error('Error deleting post:', error);
        throw new Error('Failed to delete post');
      }

      // Log the moderation action
      await this.logModerationAction({
        postId,
        adminId,
        action: 'delete',
        reason: reason || 'Admin deletion'
      });

      console.log(`✅ Post ${postId} deleted by admin ${adminId}`);
    } catch (error) {
      console.error('Error in deletePost:', error);
      throw error;
    }
  }

  /**
   * Restore a deleted post (admin action)
   */
  async restorePost(adminId: string, postId: string, reason?: string): Promise<void> {
    try {
      // Check admin permissions
      const permission = await permissionManager.isAdmin(adminId);
      if (!permission) {
        throw new Error('Admin access required');
      }

      // Restore the post
      const { error } = await supabase
        .from('posts')
        .update({ 
          is_active: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', postId);

      if (error) {
        console.error('Error restoring post:', error);
        throw new Error('Failed to restore post');
      }

      // Log the moderation action
      await this.logModerationAction({
        postId,
        adminId,
        action: 'restore',
        reason: reason || 'Admin restoration'
      });

      console.log(`✅ Post ${postId} restored by admin ${adminId}`);
    } catch (error) {
      console.error('Error in restorePost:', error);
      throw error;
    }
  }

  /**
   * Get posts by specific user (admin view)
   */
  async getPostsByUser(
    adminId: string, 
    userId: string, 
    limit: number = 20
  ): Promise<AdminPostSummary[]> {
    try {
      // Check admin permissions
      const permission = await permissionManager.isAdmin(adminId);
      if (!permission) {
        throw new Error('Admin access required');
      }

      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          tags,
          likes_count,
          comments_count,
          is_active,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user posts:', error);
        throw new Error('Failed to fetch user posts');
      }

      // Get author profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();

      const postsWithAuthor: AdminPostSummary[] = posts ? posts.map(post => ({
        id: post.id,
        content: post.content,
        authorId: post.user_id,
        authorName: profile?.full_name || 'Unknown User',
        authorEmail: profile?.email || 'unknown@example.com',
        createdAt: new Date(post.created_at),
        updatedAt: new Date(post.updated_at),
        likesCount: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        isActive: post.is_active,
        tags: post.tags || []
      })) : [];

      return postsWithAuthor;
    } catch (error) {
      console.error('Error in getPostsByUser:', error);
      throw error;
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(adminId: string): Promise<{
    totalPosts: number;
    activePosts: number;
    deletedPosts: number;
    postsToday: number;
    postsThisWeek: number;
  }> {
    try {
      // Check admin permissions
      const permission = await permissionManager.isAdmin(adminId);
      if (!permission) {
        throw new Error('Admin access required');
      }

      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Get total posts
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Get active posts
      const { count: activePosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get deleted posts
      const { count: deletedPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      // Get posts today
      const { count: postsToday } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      // Get posts this week
      const { count: postsThisWeek } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      return {
        totalPosts: totalPosts || 0,
        activePosts: activePosts || 0,
        deletedPosts: deletedPosts || 0,
        postsToday: postsToday || 0,
        postsThisWeek: postsThisWeek || 0
      };
    } catch (error) {
      console.error('Error in getModerationStats:', error);
      throw error;
    }
  }

  /**
   * Search posts for admin (including deleted ones)
   */
  async searchPostsForAdmin(
    adminId: string,
    query: string,
    includeInactive: boolean = true,
    limit: number = 20
  ): Promise<AdminPostSummary[]> {
    try {
      // Check admin permissions
      const permission = await permissionManager.isAdmin(adminId);
      if (!permission) {
        throw new Error('Admin access required');
      }

      const searchTerm = `%${query.toLowerCase()}%`;
      
      let dbQuery = supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          tags,
          likes_count,
          comments_count,
          is_active,
          created_at,
          updated_at
        `)
        .or(`content.ilike.${searchTerm},tags.cs.{${query.toLowerCase()}}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!includeInactive) {
        dbQuery = dbQuery.eq('is_active', true);
      }

      const { data: posts, error } = await dbQuery;

      if (error) {
        console.error('Error searching posts:', error);
        throw new Error('Failed to search posts');
      }

      // Get author information for each post
      const postsWithAuthors: AdminPostSummary[] = [];
      
      if (posts) {
        for (const post of posts) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', post.user_id)
            .single();

          postsWithAuthors.push({
            id: post.id,
            content: post.content,
            authorId: post.user_id,
            authorName: profile?.full_name || 'Unknown User',
            authorEmail: profile?.email || 'unknown@example.com',
            createdAt: new Date(post.created_at),
            updatedAt: new Date(post.updated_at),
            likesCount: post.likes_count || 0,
            commentsCount: post.comments_count || 0,
            isActive: post.is_active,
            tags: post.tags || []
          });
        }
      }

      return postsWithAuthors;
    } catch (error) {
      console.error('Error in searchPostsForAdmin:', error);
      throw error;
    }
  }

  /**
   * Log moderation action (for audit trail)
   */
  private async logModerationAction(action: AdminPostAction): Promise<void> {
    try {
      // For now, just log to console
      // In a full implementation, you'd store this in a moderation_logs table
      console.log('📋 Moderation Action:', {
        postId: action.postId,
        adminId: action.adminId,
        action: action.action,
        reason: action.reason,
        timestamp: new Date().toISOString()
      });

      // TODO: Implement actual database logging when moderation_logs table is created
      // const { error } = await supabase
      //   .from('moderation_logs')
      //   .insert({
      //     post_id: action.postId,
      //     admin_id: action.adminId,
      //     action: action.action,
      //     reason: action.reason,
      //     created_at: new Date().toISOString()
      //   });
    } catch (error) {
      console.error('Error logging moderation action:', error);
      // Don't throw error here as it shouldn't block the main action
    }
  }
}

export const adminPostManagementService = new AdminPostManagementService();