import { supabase } from '../config/supabase';
import { permissionManager } from './permissionManager';

// Post interfaces
export interface Post {
  id: string;
  userId: string;
  content: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Author information from join
  authorName?: string;
  authorAvatar?: string;
  authorEmail?: string;
  // User interaction state
  isLikedByUser?: boolean;
}

export interface CreatePostData {
  content: string;
  tags?: string[];
}

export interface PostsResponse {
  posts: Post[];
  hasMore: boolean;
  total: number;
}

/**
 * Community Feed Service
 * Handles post creation, retrieval, and management with proper permission checks
 * Requirements: 2.1, 2.2 - Member-only post creation and proper display
 */
class CommunityFeedService {
  /**
   * Create a new post with permission validation
   * Requirements: 2.1, 2.2 - Only members can create posts
   */
  async createPost(userId: string, postData: CreatePostData): Promise<Post> {
    try {
      // Check permission first
      const permission = await permissionManager.canCreatePost(userId);
      if (!permission.allowed) {
        throw new Error(permission.reason || 'Permission denied');
      }

      // Validate content
      if (!postData.content || postData.content.trim().length === 0) {
        throw new Error('Post content cannot be empty');
      }

      if (postData.content.length > 5000) {
        throw new Error('Post content cannot exceed 5000 characters');
      }

      // Clean and validate tags
      const tags = postData.tags 
        ? postData.tags
            .filter(tag => tag.trim().length > 0)
            .map(tag => tag.trim().toLowerCase())
            .slice(0, 10) // Limit to 10 tags
        : [];

      // Insert post into database without JOIN to avoid schema cache issues
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: postData.content.trim(),
          tags: tags
        })
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
        .single();

      if (error) {
        console.error('Error creating post:', error);
        
        // If it's a schema cache error, provide helpful message
        if (error.code === 'PGRST200' || error.code === 'PGRST205') {
          throw new Error('Posts table is not available. Please contact the administrator to set up the database properly.');
        }
        
        throw new Error('Failed to create post. Please try again.');
      }

      // Get author profile separately to avoid JOIN issues
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();

      const postWithAuthor = {
        ...post,
        profiles: profile || { full_name: null, email: null }
      };

      return this.formatPost(postWithAuthor);
    } catch (error) {
      console.error('Error in createPost:', error);
      throw error;
    }
  }

  /**
   * Get posts with author information and user interaction state
   * Requirements: 2.1, 2.2 - Display posts with proper author information
   */
  async getPosts(
    userId?: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<PostsResponse> {
    try {
      // Check if posts table is accessible
      const { error: tableCheckError } = await supabase
        .from('posts')
        .select('count', { count: 'exact', head: true });

      if (tableCheckError) {
        console.error('Posts table not accessible:', tableCheckError);
        // Return empty result with helpful message
        return {
          posts: [],
          hasMore: false,
          total: 0
        };
      }

      // Get posts without JOIN to avoid schema cache issues
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
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching posts:', error);
        
        // If it's a schema cache error, return empty result gracefully
        if (error.code === 'PGRST205') {
          console.warn('Posts table schema cache issue - returning empty result');
          return {
            posts: [],
            hasMore: false,
            total: 0
          };
        }
        
        throw new Error('Failed to fetch posts');
      }

      // Get author information for each post separately
      const formattedPosts: Post[] = [];
      if (posts) {
        for (const post of posts) {
          // Get author profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', post.user_id)
            .single();

          const postWithAuthor = {
            ...post,
            profiles: profile || { full_name: null, email: null }
          };

          formattedPosts.push(this.formatPost(postWithAuthor));
        }
      }

      // Get user likes if userId provided
      let userLikes: string[] = [];
      if (userId && posts && posts.length > 0) {
        try {
          const postIds = posts.map(p => p.id);
          const { data: likes, error: likesError } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', userId)
            .in('post_id', postIds);
          
          if (likesError) {
            console.warn('Could not fetch user likes:', likesError.message);
            // Continue without likes data
          } else {
            userLikes = likes ? likes.map(l => l.post_id) : [];
          }
        } catch (error) {
          console.warn('Error fetching user likes, continuing without likes data:', error);
        }
      }

      // Get total count for pagination
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const postsWithLikes = formattedPosts.map(post => ({
        ...post,
        isLikedByUser: userLikes.includes(post.id)
      }));

      return {
        posts: postsWithLikes,
        hasMore: (offset + limit) < (count || 0),
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getPosts:', error);
      throw error;
    }
  }

  /**
   * Delete a post with permission validation
   * Requirements: 2.1, 2.2 - Users can delete their own posts, admins can delete any
   */
  async deletePost(userId: string, postId: string): Promise<void> {
    try {
      // Get post to check ownership
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (fetchError || !post) {
        throw new Error('Post not found');
      }

      // Check permission
      const permission = await permissionManager.canDeletePost(userId, post.user_id);
      if (!permission.allowed) {
        throw new Error(permission.reason || 'Permission denied');
      }

      // Soft delete the post
      const { error } = await supabase
        .from('posts')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) {
        console.error('Error deleting post:', error);
        throw new Error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error in deletePost:', error);
      throw error;
    }
  }

  /**
   * Like or unlike a post
   */
  async togglePostLike(userId: string, postId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      // Check if user is authenticated
      const isAuth = await permissionManager.isAuthenticated(userId);
      if (!isAuth) {
        throw new Error('Please sign in to like posts');
      }

      // Get current post data for fallback
      const { data: post } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      // post_likes table should now be accessible after fixes

      // Check if already liked
      const { data: existingLike, error: selectError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing like:', selectError);
        throw new Error('Failed to check like status');
      }

      if (existingLike) {
        // Unlike the post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', userId)
          .eq('post_id', postId);

        if (error) {
          console.error('Error unliking post:', error);
          throw new Error('Failed to unlike post');
        }
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_likes')
          .insert({
            user_id: userId,
            post_id: postId
          });

        if (error) {
          console.error('Error liking post:', error);
          throw new Error('Failed to like post');
        }
      }

      // Get updated likes count
      const { data: updatedPost } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      return {
        isLiked: !existingLike,
        likesCount: updatedPost?.likes_count || 0
      };
    } catch (error) {
      console.error('Error in togglePostLike:', error);
      throw error;
    }
  }

  /**
   * Get user's own posts
   */
  async getUserPosts(userId: string, limit: number = 20, offset: number = 0): Promise<PostsResponse> {
    try {
      // Get posts without JOIN to avoid schema cache issues
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
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching user posts:', error);
        throw new Error('Failed to fetch posts');
      }

      // Get author information separately
      const formattedPosts: Post[] = [];
      if (posts) {
        // Get author profile once since all posts are from the same user
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', userId)
          .single();

        for (const post of posts) {
          const postWithAuthor = {
            ...post,
            profiles: profile || { full_name: null, email: null }
          };
          formattedPosts.push(this.formatPost(postWithAuthor));
        }
      }

      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

      return {
        posts: formattedPosts,
        hasMore: (offset + limit) < (count || 0),
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getUserPosts:', error);
      throw error;
    }
  }

  /**
   * Format post data from database
   */
  private formatPost(post: any): Post {
    return {
      id: post.id,
      userId: post.user_id,
      content: post.content,
      tags: post.tags || [],
      likesCount: post.likes_count || 0,
      commentsCount: post.comments_count || 0,
      isActive: post.is_active,
      createdAt: new Date(post.created_at),
      updatedAt: new Date(post.updated_at),
      authorName: post.profiles?.full_name || 'Anonymous User',
      authorEmail: post.profiles?.email,
      authorAvatar: this.generateAvatar(post.profiles?.full_name || post.profiles?.email)
    };
  }

  /**
   * Generate avatar emoji based on user name or email
   */
  private generateAvatar(identifier?: string): string {
    if (!identifier) return '👤';
    
    const avatars = ['👨‍💻', '👩‍💻', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍💼', '👨‍💼', '👩‍💼', '🧑‍🔬', '👨‍🔬', '👩‍🔬'];
    const index = identifier.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatars.length;
    return avatars[index];
  }

  /**
   * Search posts by content or tags
   */
  async searchPosts(
    query: string, 
    userId?: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<PostsResponse> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      
      // Get posts without JOIN to avoid schema cache issues
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
        .eq('is_active', true)
        .or(`content.ilike.${searchTerm},tags.cs.{${query.toLowerCase()}}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error searching posts:', error);
        throw new Error('Failed to search posts');
      }

      // Get author information for each post separately
      const formattedPosts: Post[] = [];
      if (posts) {
        for (const post of posts) {
          // Get author profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', post.user_id)
            .single();

          const postWithAuthor = {
            ...post,
            profiles: profile || { full_name: null, email: null }
          };

          formattedPosts.push(this.formatPost(postWithAuthor));
        }
      }

      // Get user likes if userId provided
      let userLikes: string[] = [];
      if (userId && posts && posts.length > 0) {
        try {
          const postIds = posts.map(p => p.id);
          const { data: likes, error: likesError } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', userId)
            .in('post_id', postIds);
          
          if (likesError) {
            console.warn('Could not fetch user likes in search:', likesError.message);
            // Continue without likes data
          } else {
            userLikes = likes ? likes.map(l => l.post_id) : [];
          }
        } catch (error) {
          console.warn('Error fetching user likes in search, continuing without likes data:', error);
        }
      }

      const postsWithLikes = formattedPosts.map(post => ({
        ...post,
        isLikedByUser: userLikes.includes(post.id)
      }));

      return {
        posts: postsWithLikes,
        hasMore: posts ? posts.length === limit : false,
        total: posts ? posts.length : 0
      };
    } catch (error) {
      console.error('Error in searchPosts:', error);
      throw error;
    }
  }
}

// Lazy singleton instance
let _communityFeedServiceInstance: CommunityFeedService | null = null;

export const communityFeedService = {
  getInstance(): CommunityFeedService {
    if (!_communityFeedServiceInstance) {
      _communityFeedServiceInstance = new CommunityFeedService();
    }
    return _communityFeedServiceInstance;
  },
  
  // Proxy methods for backward compatibility
  async createPost(userId: string, postData: any) {
    return this.getInstance().createPost(userId, postData);
  },
  
  async getPosts(userId?: string, limit: number = 20, offset: number = 0) {
    return this.getInstance().getPosts(userId, limit, offset);
  },
  
  async deletePost(userId: string, postId: string) {
    return this.getInstance().deletePost(userId, postId);
  },
  
  async togglePostLike(userId: string, postId: string) {
    return this.getInstance().togglePostLike(userId, postId);
  },
  
  async getUserPosts(userId: string, limit: number = 20, offset: number = 0) {
    return this.getInstance().getUserPosts(userId, limit, offset);
  },
  
  async searchPosts(query: string, userId?: string, limit: number = 20, offset: number = 0) {
    return this.getInstance().searchPosts(query, userId, limit, offset);
  }
};

export default communityFeedService;