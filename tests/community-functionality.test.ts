/**
 * コミュニティ機能テスト
 * 要件 3.2: コミュニティ機能のテスト（投稿・コメント・いいね・グループ管理）
 */

import { communityFeedService } from '../services/communityFeedService';
import { groupsService } from '../services/groupsService';
import { supabase } from '../config/supabase';

// Mock dependencies
jest.mock('../config/supabase');
jest.mock('../services/permissionManager', () => ({
  permissionManager: {
    canCreatePost: jest.fn(),
    canDeletePost: jest.fn(),
    isAuthenticated: jest.fn(),
  },
}));

describe('コミュニティ機能テスト', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;
  const mockUserId = 'user-123';
  const mockPostId = 'post-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('投稿機能', () => {
    const validPost = {
      content: 'これはテスト投稿です。コミュニティでの学習について話し合いましょう。',
      tags: ['学習', 'コミュニティ', 'ピアラーニング']
    };

    it('有効な投稿を作成できる', async () => {
      const mockCreatedPost = {
        id: mockPostId,
        user_id: mockUserId,
        content: validPost.content,
        tags: validPost.tags,
        likes_count: 0,
        comments_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockProfile = {
        full_name: 'テストユーザー',
        email: 'test@example.com'
      };

      // Mock permission check
      const { permissionManager } = require('../services/permissionManager');
      permissionManager.canCreatePost.mockResolvedValue({ allowed: true });

      // Mock database operations
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedPost,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const result = await communityFeedService.createPost(mockUserId, validPost);

      expect(result.content).toBe(validPost.content);
      expect(result.tags).toEqual(validPost.tags);
      expect(result.userId).toBe(mockUserId);
      expect(result.authorName).toBe(mockProfile.full_name);
    });

    it('権限のないユーザーの投稿作成を拒否する', async () => {
      const { permissionManager } = require('../services/permissionManager');
      permissionManager.canCreatePost.mockResolvedValue({
        allowed: false,
        reason: 'メンバーシップが必要です'
      });

      await expect(
        communityFeedService.createPost(mockUserId, validPost)
      ).rejects.toThrow('メンバーシップが必要です');
    });

    it('空のコンテンツを拒否する', async () => {
      const { permissionManager } = require('../services/permissionManager');
      permissionManager.canCreatePost.mockResolvedValue({ allowed: true });

      await expect(
        communityFeedService.createPost(mockUserId, { content: '' })
      ).rejects.toThrow('Post content cannot be empty');
    });

    it('長すぎるコンテンツを拒否する', async () => {
      const { permissionManager } = require('../services/permissionManager');
      permissionManager.canCreatePost.mockResolvedValue({ allowed: true });

      const longContent = 'あ'.repeat(5001);

      await expect(
        communityFeedService.createPost(mockUserId, { content: longContent })
      ).rejects.toThrow('Post content cannot exceed 5000 characters');
    });

    it('タグの数を制限する', async () => {
      const { permissionManager } = require('../services/permissionManager');
      permissionManager.canCreatePost.mockResolvedValue({ allowed: true });

      const manyTags = Array.from({ length: 15 }, (_, i) => `tag${i}`);
      const postWithManyTags = {
        content: 'テスト投稿',
        tags: manyTags
      };

      const mockCreatedPost = {
        id: mockPostId,
        user_id: mockUserId,
        content: postWithManyTags.content,
        tags: manyTags.slice(0, 10), // Should be limited to 10
        likes_count: 0,
        comments_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedPost,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { full_name: 'テストユーザー', email: 'test@example.com' },
              error: null,
            }),
          }),
        }),
      });

      const result = await communityFeedService.createPost(mockUserId, postWithManyTags);

      expect(result.tags).toHaveLength(10);
    });
  });

  describe('投稿取得機能', () => {
    it('投稿一覧を取得できる', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          user_id: 'user-1',
          content: '最初のテスト投稿',
          tags: ['テスト'],
          likes_count: 5,
          comments_count: 2,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'post-2',
          user_id: 'user-2',
          content: '二番目のテスト投稿',
          tags: ['学習'],
          likes_count: 3,
          comments_count: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Mock table check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock posts fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockPosts,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock count
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 2 }),
        }),
      });

      const result = await communityFeedService.getPosts(mockUserId, 20, 0);

      expect(result.posts).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('ページネーションが正しく動作する', async () => {
      const mockPosts = Array.from({ length: 10 }, (_, i) => ({
        id: `post-${i}`,
        user_id: `user-${i}`,
        content: `テスト投稿 ${i}`,
        tags: ['テスト'],
        likes_count: i,
        comments_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Mock table check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock posts fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockPosts,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock count
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 50 }),
        }),
      });

      const result = await communityFeedService.getPosts(mockUserId, 10, 0);

      expect(result.posts).toHaveLength(10);
      expect(result.total).toBe(50);
      expect(result.hasMore).toBe(true);
    });

    it('テーブルが利用できない場合に空の結果を返す', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          error: { message: 'Table not found' }
        }),
      });

      const result = await communityFeedService.getPosts(mockUserId, 20, 0);

      expect(result.posts).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('いいね機能', () => {
    it('投稿にいいねを追加できる', async () => {
      const { permissionManager } = require('../services/permissionManager');
      permissionManager.isAuthenticated.mockResolvedValue(true);

      // Mock post fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { likes_count: 5 },
              error: null,
            }),
          }),
        }),
      });

      // Mock table check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock existing like check (no existing like)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }, // No rows returned
              }),
            }),
          }),
        }),
      });

      // Mock like insert
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock updated post fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { likes_count: 6 },
              error: null,
            }),
          }),
        }),
      });

      const result = await communityFeedService.togglePostLike(mockUserId, mockPostId);

      expect(result.isLiked).toBe(true);
      expect(result.likesCount).toBe(6);
    });

    it('投稿のいいねを削除できる', async () => {
      const { permissionManager } = require('../services/permissionManager');
      permissionManager.isAuthenticated.mockResolvedValue(true);

      // Mock post fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { likes_count: 6 },
              error: null,
            }),
          }),
        }),
      });

      // Mock table check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock existing like check (existing like found)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'like-123' },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock like delete
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      // Mock updated post fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { likes_count: 5 },
              error: null,
            }),
          }),
        }),
      });

      const result = await communityFeedService.togglePostLike(mockUserId, mockPostId);

      expect(result.isLiked).toBe(false);
      expect(result.likesCount).toBe(5);
    });

    it('未認証ユーザーのいいねを拒否する', async () => {
      const { permissionManager } = require('../services/permissionManager');
      permissionManager.isAuthenticated.mockResolvedValue(false);

      await expect(
        communityFeedService.togglePostLike(mockUserId, mockPostId)
      ).rejects.toThrow('Please sign in to like posts');
    });

    it('いいねテーブルが利用できない場合にフォールバックする', async () => {
      const { permissionManager } = require('../services/permissionManager');
      permissionManager.isAuthenticated.mockResolvedValue(true);

      // Mock post fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { likes_count: 5 },
              error: null,
            }),
          }),
        }),
      });

      // Mock table check (table not available)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          error: { message: 'Table not found' }
        }),
      });

      const result = await communityFeedService.togglePostLike(mockUserId, mockPostId);

      expect(result.isLiked).toBe(false);
      expect(result.likesCount).toBe(5);
    });
  });

  describe('投稿削除機能', () => {
    it('自分の投稿を削除できる', async () => {
      const { permissionManager } = require('../services/permissionManager');
      
      // Mock post fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      // Mock permission check
      permissionManager.canDeletePost.mockResolvedValue({ allowed: true });

      // Mock soft delete
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(
        communityFeedService.deletePost(mockUserId, mockPostId)
      ).resolves.not.toThrow();
    });

    it('他人の投稿削除を拒否する', async () => {
      const { permissionManager } = require('../services/permissionManager');
      
      // Mock post fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 'other-user' },
              error: null,
            }),
          }),
        }),
      });

      // Mock permission check
      permissionManager.canDeletePost.mockResolvedValue({
        allowed: false,
        reason: '自分の投稿のみ削除できます'
      });

      await expect(
        communityFeedService.deletePost(mockUserId, mockPostId)
      ).rejects.toThrow('自分の投稿のみ削除できます');
    });

    it('存在しない投稿の削除を拒否する', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Post not found' },
            }),
          }),
        }),
      });

      await expect(
        communityFeedService.deletePost(mockUserId, 'nonexistent-post')
      ).rejects.toThrow('Post not found');
    });
  });

  describe('投稿検索機能', () => {
    it('コンテンツで投稿を検索できる', async () => {
      const searchQuery = 'JavaScript';
      const mockSearchResults = [
        {
          id: 'post-1',
          user_id: 'user-1',
          content: 'JavaScriptの学習について',
          tags: ['JavaScript', '学習'],
          likes_count: 10,
          comments_count: 3,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockSearchResults,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await communityFeedService.searchPosts(searchQuery, mockUserId, 20, 0);

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].content).toContain('JavaScript');
    });

    it('タグで投稿を検索できる', async () => {
      const searchQuery = 'React';
      const mockSearchResults = [
        {
          id: 'post-1',
          user_id: 'user-1',
          content: 'Reactコンポーネントの作成',
          tags: ['React', 'JavaScript'],
          likes_count: 8,
          comments_count: 2,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockSearchResults,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await communityFeedService.searchPosts(searchQuery, mockUserId, 20, 0);

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].tags).toContain('React');
    });
  });

  describe('ユーザー投稿取得', () => {
    it('特定ユーザーの投稿一覧を取得できる', async () => {
      const mockUserPosts = [
        {
          id: 'post-1',
          user_id: mockUserId,
          content: 'ユーザーの最初の投稿',
          tags: ['個人'],
          likes_count: 5,
          comments_count: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockUserPosts,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Mock profile fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { full_name: 'テストユーザー', email: 'test@example.com' },
              error: null,
            }),
          }),
        }),
      });

      // Mock count
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 1 }),
          }),
        }),
      });

      const result = await communityFeedService.getUserPosts(mockUserId, 20, 0);

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].userId).toBe(mockUserId);
    });
  });
});