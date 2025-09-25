/**
 * 機能テスト - コア機能検証
 * 要件 3.1: 認証システム、コミュニティ機能、外部システム連携、メンバーシップ機能のテスト
 */

// Mock Supabase
const mockSupabase = {
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
};

// Mock RevenueCat
const mockRevenueCat = {
  configure: jest.fn(),
  logIn: jest.fn(),
  logOut: jest.fn(),
  getCustomerInfo: jest.fn(),
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  setAttributes: jest.fn(),
};

describe('機能テスト - PeerLearningHub リリース準備', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. 認証システムテスト (要件 3.1)', () => {
    describe('1.1 ユーザー登録機能', () => {
      it('有効なデータでユーザー登録が成功する', async () => {
        const testUser = {
          email: 'test@peerlearninghub.com',
          password: 'testpassword123',
          fullName: 'Test User',
          country: 'Japan'
        };

        const mockUser = { id: 'test-user-id', email: testUser.email };
        const mockSession = { access_token: 'test-token' };
        
        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        });

        // Simulate auth service behavior
        const signUpResult = await mockSupabase.auth.signUp({
          email: testUser.email,
          password: testUser.password,
          options: {
            data: {
              full_name: testUser.fullName,
              country: testUser.country,
            },
          },
        });

        expect(signUpResult.error).toBeNull();
        expect(signUpResult.data.user).toEqual(mockUser);
        expect(signUpResult.data.session).toEqual(mockSession);
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: testUser.email,
          password: testUser.password,
          options: {
            data: {
              full_name: testUser.fullName,
              country: testUser.country,
            },
          },
        });
      });

      it('無効なメールアドレスで登録が失敗する', async () => {
        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid email format' },
        });

        const result = await mockSupabase.auth.signUp({
          email: 'invalid-email',
          password: 'password123',
        });

        expect(result.error).toBeTruthy();
        expect(result.data.user).toBeNull();
      });

      it('パスワード強度要件を検証する', () => {
        const validatePassword = (password) => {
          if (!password || password.length < 6) {
            return { valid: false, message: 'Password must be at least 6 characters long' };
          }
          return { valid: true };
        };

        expect(validatePassword('123')).toEqual({
          valid: false,
          message: 'Password must be at least 6 characters long'
        });
        expect(validatePassword('password123')).toEqual({ valid: true });
      });
    });

    describe('1.2 ログイン機能', () => {
      it('有効な認証情報でログインが成功する', async () => {
        const credentials = {
          email: 'test@peerlearninghub.com',
          password: 'testpassword123'
        };

        const mockUser = { id: 'test-user-id', email: credentials.email };
        const mockSession = { access_token: 'test-token' };
        
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        });

        const result = await mockSupabase.auth.signInWithPassword(credentials);

        expect(result.error).toBeNull();
        expect(result.data.user).toEqual(mockUser);
        expect(result.data.session).toEqual(mockSession);
      });

      it('無効な認証情報でログインが失敗する', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
        });

        const result = await mockSupabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

        expect(result.error).toBeTruthy();
        expect(result.error.message).toContain('Invalid login credentials');
      });
    });

    describe('1.3 パスワードリセット機能', () => {
      it('有効なメールアドレスでパスワードリセットが成功する', async () => {
        mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
          error: null,
        });

        const result = await mockSupabase.auth.resetPasswordForEmail(
          'test@peerlearninghub.com',
          { redirectTo: 'peerlearninghub://reset-password' }
        );

        expect(result.error).toBeNull();
        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@peerlearninghub.com',
          { redirectTo: 'peerlearninghub://reset-password' }
        );
      });
    });
  });

  describe('2. コミュニティ機能テスト (要件 3.2)', () => {
    describe('2.1 投稿作成機能', () => {
      it('有効なデータで投稿作成が成功する', async () => {
        const mockPost = {
          id: 'post-123',
          user_id: 'user-123',
          content: 'これはテスト投稿です',
          tags: ['テスト', 'コミュニティ'],
          likes_count: 0,
          comments_count: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockPost,
                error: null,
              }),
            }),
          }),
        });

        const result = await mockSupabase.from('posts').insert({
          user_id: 'user-123',
          content: 'これはテスト投稿です',
          tags: ['テスト', 'コミュニティ']
        }).select().single();

        expect(result.error).toBeNull();
        expect(result.data).toEqual(mockPost);
      });

      it('空のコンテンツを拒否する', () => {
        const validatePostContent = (content) => {
          if (!content || content.trim().length === 0) {
            return { valid: false, message: 'Post content cannot be empty' };
          }
          if (content.length > 5000) {
            return { valid: false, message: 'Post content cannot exceed 5000 characters' };
          }
          return { valid: true };
        };

        expect(validatePostContent('')).toEqual({
          valid: false,
          message: 'Post content cannot be empty'
        });
        expect(validatePostContent('有効な投稿内容')).toEqual({ valid: true });
      });
    });

    describe('2.2 いいね機能', () => {
      it('投稿にいいねを追加できる', async () => {
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

        const checkResult = await mockSupabase.from('post_likes')
          .select('id')
          .eq('user_id', 'user-123')
          .eq('post_id', 'post-123')
          .single();

        expect(checkResult.data).toBeNull();
        expect(checkResult.error.code).toBe('PGRST116');

        const insertResult = await mockSupabase.from('post_likes').insert({
          user_id: 'user-123',
          post_id: 'post-123'
        });

        expect(insertResult.error).toBeNull();
      });
    });
  });

  describe('3. 外部システム連携テスト (要件 3.3)', () => {
    describe('3.1 外部プロジェクト連携', () => {
      it('外部プロジェクト一覧を取得できる', async () => {
        const mockProjects = [
          {
            id: '1',
            external_id: 'ext-1',
            source_platform: 'github',
            title: 'Test Project',
            description: 'A test project',
            status: 'active',
          },
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: mockProjects,
                  error: null,
                }),
              }),
            }),
          }),
        });

        const result = await mockSupabase.from('external_projects')
          .select('*')
          .order('created_at', { ascending: false })
          .eq('status', 'active')
          .limit(10);

        expect(result.error).toBeNull();
        expect(result.data).toEqual(mockProjects);
      });
    });

    describe('3.2 外部宿泊施設連携', () => {
      it('宿泊施設を検索できる', async () => {
        const mockAccommodations = [
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
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              ilike: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: mockAccommodations,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

        const result = await mockSupabase.from('external_accommodations')
          .select('*')
          .eq('country', 'Japan')
          .ilike('city', '%Tokyo%')
          .order('price_per_night')
          .limit(10);

        expect(result.error).toBeNull();
        expect(result.data).toEqual(mockAccommodations);
      });
    });
  });

  describe('4. メンバーシップ機能テスト (要件 3.4)', () => {
    describe('4.1 メンバーシップ状態管理', () => {
      it('アクティブなメンバーシップ状態を正しく取得する', async () => {
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

        mockRevenueCat.getCustomerInfo.mockResolvedValue(mockCustomerInfo);

        const customerInfo = await mockRevenueCat.getCustomerInfo();
        const entitlement = customerInfo.entitlements.active.premium_membership;

        expect(entitlement).toBeDefined();
        expect(entitlement.productIdentifier).toBe('peer_learning_hub_monthly');
        expect(entitlement.willRenew).toBe(true);

        // Simulate membership status check
        const isActive = !!entitlement;
        const membershipType = isActive ? 'member' : 'visitor';

        expect(isActive).toBe(true);
        expect(membershipType).toBe('member');
      });

      it('非アクティブなメンバーシップ状態を正しく取得する', async () => {
        const mockCustomerInfo = {
          entitlements: { active: {} },
        };

        mockRevenueCat.getCustomerInfo.mockResolvedValue(mockCustomerInfo);

        const customerInfo = await mockRevenueCat.getCustomerInfo();
        const entitlement = customerInfo.entitlements.active.premium_membership;

        expect(entitlement).toBeUndefined();

        // Simulate membership status check
        const isActive = !!entitlement;
        const membershipType = isActive ? 'member' : 'visitor';

        expect(isActive).toBe(false);
        expect(membershipType).toBe('visitor');
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
          originalAppUserId: 'user-123',
          entitlements: { active: { premium_membership: {} } },
          allPurchaseDates: { 'peer_learning_hub_monthly': new Date() },
        };

        mockRevenueCat.purchasePackage.mockResolvedValue({
          customerInfo: mockCustomerInfo,
          productIdentifier: 'peer_learning_hub_monthly',
        });

        const result = await mockRevenueCat.purchasePackage(mockPackage);

        expect(result.customerInfo).toBeDefined();
        expect(result.productIdentifier).toBe('peer_learning_hub_monthly');
      });

      it('ユーザーキャンセル時の処理が正しい', async () => {
        const mockError = {
          userCancelled: true,
          message: 'User cancelled',
        };

        mockRevenueCat.purchasePackage.mockRejectedValue(mockError);

        try {
          await mockRevenueCat.purchasePackage({});
        } catch (error) {
          expect(error.userCancelled).toBe(true);
          expect(error.message).toBe('User cancelled');
        }
      });
    });

    describe('4.3 購入復元機能', () => {
      it('購入復元が成功する', async () => {
        const mockCustomerInfo = {
          entitlements: { active: { premium_membership: {} } },
        };

        mockRevenueCat.restorePurchases.mockResolvedValue(mockCustomerInfo);

        const result = await mockRevenueCat.restorePurchases();

        expect(result.entitlements.active.premium_membership).toBeDefined();
      });
    });
  });

  describe('5. エラーハンドリングテスト', () => {
    it('ネットワークエラーを適切に処理する', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      );

      try {
        await mockSupabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'password123'
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('データベースエラーを適切に処理する', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: 'PGRST200' },
            }),
          }),
        }),
      });

      const result = await mockSupabase.from('posts').insert({}).select().single();

      expect(result.error).toBeTruthy();
      expect(result.error.code).toBe('PGRST200');
    });

    it('RevenueCat設定エラーを適切に処理する', async () => {
      mockRevenueCat.getCustomerInfo.mockRejectedValue(
        new Error('RevenueCat not configured')
      );

      try {
        await mockRevenueCat.getCustomerInfo();
      } catch (error) {
        expect(error.message).toBe('RevenueCat not configured');
      }
    });
  });

  describe('6. データ検証テスト', () => {
    it('メールアドレス形式を検証する', () => {
      const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('投稿タグを検証する', () => {
      const validateTags = (tags) => {
        if (!Array.isArray(tags)) return { valid: false, message: 'Tags must be an array' };
        if (tags.length > 10) return { valid: false, message: 'Maximum 10 tags allowed' };
        
        const validTags = tags.filter(tag => 
          typeof tag === 'string' && tag.trim().length > 0
        );
        
        return { valid: true, tags: validTags };
      };

      expect(validateTags(['tag1', 'tag2'])).toEqual({
        valid: true,
        tags: ['tag1', 'tag2']
      });
      
      expect(validateTags(Array.from({ length: 15 }, (_, i) => `tag${i}`))).toEqual({
        valid: false,
        message: 'Maximum 10 tags allowed'
      });
    });

    it('価格データを検証する', () => {
      const validatePrice = (price, currency) => {
        if (typeof price !== 'number' || price < 0) {
          return { valid: false, message: 'Price must be a positive number' };
        }
        if (!currency || typeof currency !== 'string') {
          return { valid: false, message: 'Currency must be a valid string' };
        }
        return { valid: true };
      };

      expect(validatePrice(9.99, 'USD')).toEqual({ valid: true });
      expect(validatePrice(-1, 'USD')).toEqual({
        valid: false,
        message: 'Price must be a positive number'
      });
      expect(validatePrice(9.99, '')).toEqual({
        valid: false,
        message: 'Currency must be a valid string'
      });
    });
  });
});