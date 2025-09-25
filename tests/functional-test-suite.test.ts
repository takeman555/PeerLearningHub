/**
 * 機能テストスイート - PeerLearningHub リリース準備
 * 
 * このテストスイートは以下の要件を検証します:
 * - 要件 3.1: 認証システムの包括的テスト（登録・ログイン・パスワードリセット）
 * - 要件 3.2: コミュニティ機能のテスト（投稿・コメント・いいね・グループ管理）
 * - 要件 3.3: 外部システム連携のテスト（宿泊予約・学習リソース）
 * - 要件 3.4: メンバーシップ機能のテスト（購入・復元・状態管理）
 */

import { authService } from '../services/auth';
import { communityFeedService } from '../services/communityFeedService';
import { revenueCatService } from '../services/revenueCatService';
import { ExternalSystemsService } from '../services/externalSystemsService';
import { supabase } from '../config/supabase';

// Test data
const TEST_USER = {
  email: 'test@peerlearninghub.com',
  password: 'testpassword123',
  fullName: 'Test User',
  country: 'Japan'
};

const TEST_POST = {
  content: 'This is a test post for the community feed',
  tags: ['testing', 'community', 'peerlearning']
};

// Mock Supabase for controlled testing
jest.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null })),
          order: jest.fn(() => ({
            range: jest.fn(() => ({ data: [], error: null })),
          })),
        })),
        order: jest.fn(() => ({
          range: jest.fn(() => ({ data: [], error: null })),
        })),
        ilike: jest.fn(() => ({ data: [], error: null })),
        or: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => ({ data: [], error: null })),
          })),
        })),
        in: jest.fn(() => ({ data: [], error: null })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ data: null, error: null })),
        select: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({ error: null })),
      })),
      upsert: jest.fn(() => ({ data: null, error: null })),
    })),
  },
}));

describe('機能テストスイート - PeerLearningHub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. 認証システムテスト (要件 3.1)', () => {
    describe('1.1 ユーザー登録機能', () => {
      it('有効なデータでユーザー登録が成功する', async () => {
        // Mock successful registration
        const mockUser = { id: 'test-user-id', email: TEST_USER.email };
        const mockSession = { access_token: 'test-token' };
        
        (supabase.auth.signUp as jest.Mock).mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        });

        const result = await authService.signUp(TEST_USER);

        expect(result.error).toBeNull();
        expect(result.user).toEqual(mockUser);
        expect(result.session).toEqual(mockSession);
        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: TEST_USER.email,
          password: TEST_USER.password,
          options: {
            data: {
              full_name: TEST_USER.fullName,
              country: TEST_USER.country,
            },
          },
        });
      });

      it('無効なメールアドレスで登録が失敗する', async () => {
        const invalidUser = { ...TEST_USER, email: 'invalid-email' };
        
        (supabase.auth.signUp as jest.Mock).mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid email format' },
        });

        const result = await authService.signUp(invalidUser);

        expect(result.error).toBeTruthy();
        expect(result.user).toBeNull();
      });

      it('短すぎるパスワードで登録が失敗する', async () => {
        const invalidUser = { ...TEST_USER, password: '123' };

        const result = await authService.signUp(invalidUser);

        expect(result.error).toBeTruthy();
        expect(result.error.message).toContain('Password must be at least 6 characters');
      });

      it('必須フィールドが空の場合登録が失敗する', async () => {
        const invalidUser = { ...TEST_USER, email: '', fullName: '' };

        const result = await authService.signUp(invalidUser);

        expect(result.error).toBeTruthy();
        expect(result.error.message).toContain('Email, password, and full name are required');
      });
    });

    describe('1.2 ユーザーログイン機能', () => {
      it('有効な認証情報でログインが成功する', async () => {
        const mockUser = { id: 'test-user-id', email: TEST_USER.email };
        const mockSession = { access_token: 'test-token' };
        
        (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        });

        const result = await authService.signIn({
          email: TEST_USER.email,
          password: TEST_USER.password,
        });

        expect(result.error).toBeNull();
        expect(result.user).toEqual(mockUser);
        expect(result.session).toEqual(mockSession);
      });

      it('無効な認証情報でログインが失敗する', async () => {
        (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
        });

        const result = await authService.signIn({
          email: TEST_USER.email,
          password: 'wrongpassword',
        });

        expect(result.error).toBeTruthy();
        expect(result.error.message).toContain('Invalid email or password');
      });

      it('空の認証情報でログインが失敗する', async () => {
        const result = await authService.signIn({
          email: '',
          password: '',
        });

        expect(result.error).toBeTruthy();
        expect(result.error.message).toContain('Email and password are required');
      });
    });

    describe('1.3 パスワードリセット機能', () => {
      it('有効なメールアドレスでパスワードリセットが成功する', async () => {
        (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
          error: null,
        });

        const result = await authService.resetPassword(TEST_USER.email);

        expect(result.error).toBeNull();
        expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          TEST_USER.email,
          { redirectTo: 'peerlearninghub://reset-password' }
        );
      });

      it('無効なメールアドレスでもエラーを返さない（セキュリティ上の理由）', async () => {
        (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
          error: null,
        });

        const result = await authService.resetPassword('nonexistent@test.com');

        expect(result.error).toBeNull();
      });
    });

    describe('1.4 セッション管理機能', () => {
      it('現在のユーザーを取得できる', async () => {
        const mockUser = { id: 'test-user-id', email: TEST_USER.email };
        
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({
          data: { user: mockUser },
        });

        const user = await authService.getCurrentUser();

        expect(user).toEqual(mockUser);
      });

      it('現在のセッションを取得できる', async () => {
        const mockSession = { access_token: 'test-token' };
        
        (supabase.auth.getSession as jest.Mock).mockResolvedValue({
          data: { session: mockSession },
        });

        const session = await authService.getCurrentSession();

        expect(session).toEqual(mockSession);
      });

      it('ログアウトが成功する', async () => {
        (supabase.auth.signOut as jest.Mock).mockResolvedValue({
          error: null,
        });

        const result = await authService.signOut();

        expect(result.error).toBeNull();
      });
    });
  });

  describe('2. コミュニティ機能テスト (要件 3.2)', () => {
    const mockUserId = 'test-user-id';
    const mockPostId = 'test-post-id';

    describe('2.1 投稿作成機能', () => {
      it('有効なデータで投稿作成が成功する', async () => {
        const mockPost = {
          id: mockPostId,
          user_id: mockUserId,
          content: TEST_POST.content,
          tags: TEST_POST.tags,
          likes_count: 0,
          comments_count: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Mock permission check
        jest.doMock('../services/permissionManager', () => ({
          permissionManager: {
            canCreatePost: jest.fn().mockResolvedValue({ allowed: true }),
          },
        }));

        // Mock database insert
        (supabase.from as jest.Mock).mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockPost,
                error: null,
              }),
            }),
          }),
        });

        // Mock profile fetch
        (supabase.from as jest.Mock).mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { full_name: 'Test User', email: 'test@example.com' },
                error: null,
              }),
            }),
          }),
        });

        const result = await communityFeedService.createPost(mockUserId, TEST_POST);

        expect(result.content).toBe(TEST_POST.content);
        expect(result.tags).toEqual(TEST_POST.tags);
        expect(result.userId).toBe(mockUserId);
      });

      it('空のコンテンツで投稿作成が失敗する', async () => {
        jest.doMock('../services/permissionManager', () => ({
          permissionManager: {
            canCreatePost: jest.fn().mockResolvedValue({ allowed: true }),
          },
        }));

        await expect(
          communityFeedService.createPost(mockUserId, { content: '' })
        ).rejects.toThrow('Post content cannot be empty');
      });

      it('長すぎるコンテンツで投稿作成が失敗する', async () => {
        jest.doMock('../services/permissionManager', () => ({
          permissionManager: {
            canCreatePost: jest.fn().mockResolvedValue({ allowed: true }),
          },
        }));

        const longContent = 'a'.repeat(5001);

        await expect(
          communityFeedService.createPost(mockUserId, { content: longContent })
        ).rejects.toThrow('Post content cannot exceed 5000 characters');
      });
    });

    describe('2.2 投稿取得機能', () => {
      it('投稿一覧を取得できる', async () => {
        const mockPosts = [
          {
            id: 'post-1',
            user_id: 'user-1',
            content: 'Test post 1',
            tags: ['test'],
            likes_count: 5,
            comments_count: 2,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

        // Mock table check
        (supabase.from as jest.Mock).mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ error: null }),
        });

        // Mock posts fetch
        (supabase.from as jest.Mock).mockReturnValueOnce({
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
        (supabase.from as jest.Mock).mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 1 }),
          }),
        });

        const result = await communityFeedService.getPosts(mockUserId, 20, 0);

        expect(result.posts).toHaveLength(1);
        expect(result.total).toBe(1);
      });
    });

    describe('2.3 いいね機能', () => {
      it('投稿にいいねを追加できる', async () => {
        // Mock authentication check
        jest.doMock('../services/permissionManager', () => ({
          permissionManager: {
            isAuthenticated: jest.fn().mockResolvedValue(true),
          },
        }));

        // Mock post fetch
        (supabase.from as jest.Mock).mockReturnValueOnce({
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
        (supabase.from as jest.Mock).mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({ error: null }),
        });

        // Mock existing like check
        (supabase.from as jest.Mock).mockReturnValueOnce({
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
        (supabase.from as jest.Mock).mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ error: null }),
        });

        // Mock updated post fetch
        (supabase.from as jest.Mock).mockReturnValueOnce({
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
    });
  });

  describe('3. 外部システム連携テスト (要件 3.3)', () => {
    describe('3.1 外部プロジェクト連携', () => {
      it('外部プロジェクト一覧を取得できる', async () => {
        // Mock external projects fetch
        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  data: [
                    {
                      id: '1',
                      external_id: 'ext-1',
                      source_platform: 'github',
                      title: 'Test Project',
                      description: 'A test project',
                      status: 'active',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        });

        const filters = {
          platform: 'github',
          status: 'active',
          limit: 10,
          offset: 0,
        };

        const result = await ExternalSystemsService.globalSearch('test', {
          types: ['projects'],
          limit: 10,
        });

        expect(result).toBeDefined();
        expect(result.projects).toBeDefined();
      });
    });

    describe('3.2 外部セッション連携', () => {
      it('今日のセッション一覧を取得できる', async () => {
        // Mock today's sessions fetch
        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    data: [
                      {
                        id: '1',
                        external_id: 'ext-session-1',
                        source_platform: 'zoom',
                        title: 'Test Session',
                        session_type: 'workshop',
                        start_time: new Date().toISOString(),
                        status: 'scheduled',
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

        const result = await ExternalSystemsService.getDashboardStats();

        expect(result).toBeDefined();
        expect(result.todaySessionsCount).toBeDefined();
      });
    });

    describe('3.3 外部宿泊施設連携', () => {
      it('宿泊施設を検索できる', async () => {
        // Mock accommodations search
        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              ilike: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      limit: jest.fn().mockReturnValue({
                        data: [
                          {
                            id: '1',
                            external_id: 'ext-acc-1',
                            source_platform: 'airbnb',
                            name: 'Test Accommodation',
                            city: 'Tokyo',
                            country: 'Japan',
                            price_per_night: 100,
                            currency: 'USD',
                          },
                        ],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        });

        const result = await ExternalSystemsService.globalSearch('Tokyo', {
          types: ['accommodations'],
          limit: 10,
        });

        expect(result).toBeDefined();
        expect(result.accommodations).toBeDefined();
      });
    });
  });

  describe('4. メンバーシップ機能テスト (要件 3.4)', () => {
    describe('4.1 メンバーシップ状態管理', () => {
      it('メンバーシップ状態を取得できる', async () => {
        // Mock RevenueCat customer info
        const mockCustomerInfo = {
          entitlements: {
            active: {
              premium_membership: {
                productIdentifier: 'peer_learning_hub_monthly',
                latestPurchaseDate: new Date(),
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                willRenew: true,
              },
            },
          },
        };

        const Purchases = require('react-native-purchases');
        Purchases.getCustomerInfo.mockResolvedValue(mockCustomerInfo);

        const status = await revenueCatService.getMembershipStatus();

        expect(status.isActive).toBe(true);
        expect(status.membershipType).toBe('member');
        expect(status.subscriptionInfo).toBeDefined();
      });

      it('非アクティブなメンバーシップ状態を正しく返す', async () => {
        const mockCustomerInfo = {
          entitlements: { active: {} },
        };

        const Purchases = require('react-native-purchases');
        Purchases.getCustomerInfo.mockResolvedValue(mockCustomerInfo);

        const status = await revenueCatService.getMembershipStatus();

        expect(status.isActive).toBe(false);
        expect(status.membershipType).toBe('visitor');
      });
    });

    describe('4.2 メンバーシップ購入機能', () => {
      it('メンバーシップ購入が成功する', async () => {
        const mockPackage = {
          product: {
            identifier: 'peer_learning_hub_monthly',
            price: 9.99,
            currencyCode: 'USD',
          },
        };

        const mockCustomerInfo = {
          originalAppUserId: 'test-user-id',
          entitlements: { active: { premium_membership: {} } },
          allPurchaseDates: { 'peer_learning_hub_monthly': new Date() },
        };

        const Purchases = require('react-native-purchases');
        Purchases.purchasePackage.mockResolvedValue({
          customerInfo: mockCustomerInfo,
          productIdentifier: 'peer_learning_hub_monthly',
        });

        // Mock database update
        (supabase.from as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        });

        const result = await revenueCatService.purchaseMembership(mockPackage as any);

        expect(result.success).toBe(true);
        expect(result.customerInfo).toBeDefined();
      });

      it('ユーザーキャンセル時の処理が正しい', async () => {
        const mockPackage = {
          product: {
            identifier: 'peer_learning_hub_monthly',
            price: 9.99,
            currencyCode: 'USD',
          },
        };

        const mockError = {
          userCancelled: true,
          message: 'User cancelled',
        };

        const Purchases = require('react-native-purchases');
        Purchases.purchasePackage.mockRejectedValue(mockError);

        const result = await revenueCatService.purchaseMembership(mockPackage as any);

        expect(result.success).toBe(false);
        expect(result.userCancelled).toBe(true);
      });
    });

    describe('4.3 購入復元機能', () => {
      it('購入復元が成功する', async () => {
        const mockCustomerInfo = {
          entitlements: { active: { premium_membership: {} } },
        };

        const Purchases = require('react-native-purchases');
        Purchases.restorePurchases.mockResolvedValue(mockCustomerInfo);

        // Mock database update
        (supabase.from as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        });

        const result = await revenueCatService.restorePurchases();

        expect(result.success).toBe(true);
        expect(result.customerInfo).toBeDefined();
      });
    });

    describe('4.4 メンバーシップ期限管理', () => {
      it('メンバーシップ期限を正しく計算する', async () => {
        const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

        const mockCustomerInfo = {
          entitlements: {
            active: {
              premium_membership: {
                expirationDate: futureDate,
                willRenew: true,
              },
            },
          },
        };

        const Purchases = require('react-native-purchases');
        Purchases.getCustomerInfo.mockResolvedValue(mockCustomerInfo);

        // Mock subscription info
        jest.doMock('../config/revenuecat', () => ({
          RevenueCatConfig: {
            getSubscriptionInfo: jest.fn().mockResolvedValue({
              isActive: true,
              expirationDate: futureDate,
              willRenew: true,
            }),
          },
        }));

        const expiry = await revenueCatService.checkMembershipExpiry();

        expect(expiry.isExpired).toBe(false);
        expect(expiry.expiresIn).toBe(5);
        expect(expiry.willRenew).toBe(true);
      });

      it('期限切れメンバーシップを正しく検出する', async () => {
        const Purchases = require('react-native-purchases');
        Purchases.getCustomerInfo.mockResolvedValue({
          entitlements: { active: {} },
        });

        const expiry = await revenueCatService.checkMembershipExpiry();

        expect(expiry.isExpired).toBe(true);
      });
    });
  });

  describe('5. エラーハンドリングテスト', () => {
    it('ネットワークエラーを適切に処理する', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await authService.signIn({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Network error');
    });

    it('データベースエラーを適切に処理する', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: 'PGRST200' },
            }),
          }),
        }),
      });

      jest.doMock('../services/permissionManager', () => ({
        permissionManager: {
          canCreatePost: jest.fn().mockResolvedValue({ allowed: true }),
        },
      }));

      await expect(
        communityFeedService.createPost(mockUserId, TEST_POST)
      ).rejects.toThrow('Posts table is not available');
    });

    it('RevenueCat設定エラーを適切に処理する', async () => {
      const Purchases = require('react-native-purchases');
      Purchases.getCustomerInfo.mockRejectedValue(new Error('RevenueCat not configured'));

      const status = await revenueCatService.getMembershipStatus();

      expect(status.isActive).toBe(false);
      expect(status.membershipType).toBe('visitor');
    });
  });

  describe('6. パフォーマンステスト', () => {
    it('大量の投稿取得が適切な時間内に完了する', async () => {
      const startTime = Date.now();

      // Mock large dataset
      const mockPosts = Array.from({ length: 100 }, (_, i) => ({
        id: `post-${i}`,
        user_id: `user-${i}`,
        content: `Test post ${i}`,
        tags: ['test'],
        likes_count: i,
        comments_count: i % 5,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Mock table check
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock posts fetch
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockPosts.slice(0, 20),
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock count
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 100 }),
        }),
      });

      const result = await communityFeedService.getPosts(mockUserId, 20, 0);
      const endTime = Date.now();

      expect(result.posts).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});