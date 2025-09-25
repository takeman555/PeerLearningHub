/**
 * 認証システム包括テスト
 * 要件 3.1: 認証システムの包括的テスト（登録・ログイン・パスワードリセット）
 */

import { authService } from '../services/auth';
import { supabase } from '../config/supabase';

// Mock Supabase
jest.mock('../config/supabase');

describe('認証システム包括テスト', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ユーザー登録フロー', () => {
    const validUser = {
      email: 'test@peerlearninghub.com',
      password: 'securepassword123',
      fullName: 'Test User',
      country: 'Japan'
    };

    it('正常な登録フローが完了する', async () => {
      const mockUser = { id: 'user-123', email: validUser.email };
      const mockSession = { access_token: 'token-123' };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signUp(validUser);

      expect(result.error).toBeNull();
      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: validUser.email,
        password: validUser.password,
        options: {
          data: {
            full_name: validUser.fullName,
            country: validUser.country,
          },
        },
      });
    });

    it('重複メールアドレスでの登録を拒否する', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });

      const result = await authService.signUp(validUser);

      expect(result.error).toBeTruthy();
      expect(result.user).toBeNull();
    });

    it('パスワード強度要件を検証する', async () => {
      const weakPasswordUser = { ...validUser, password: '123' };

      const result = await authService.signUp(weakPasswordUser);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Password must be at least 6 characters');
    });

    it('必須フィールドの検証を行う', async () => {
      const incompleteUser = { ...validUser, email: '', fullName: '' };

      const result = await authService.signUp(incompleteUser);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Email, password, and full name are required');
    });

    it('メールアドレス形式の検証を行う', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid email format' },
      });

      const invalidEmailUser = { ...validUser, email: 'invalid-email' };
      const result = await authService.signUp(invalidEmailUser);

      expect(result.error).toBeTruthy();
    });
  });

  describe('ログインフロー', () => {
    const validCredentials = {
      email: 'test@peerlearninghub.com',
      password: 'securepassword123'
    };

    it('正常なログインフローが完了する', async () => {
      const mockUser = { id: 'user-123', email: validCredentials.email };
      const mockSession = { access_token: 'token-123' };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signIn(validCredentials);

      expect(result.error).toBeNull();
      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
    });

    it('無効な認証情報でのログインを拒否する', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await authService.signIn({
        email: validCredentials.email,
        password: 'wrongpassword'
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Invalid email or password');
    });

    it('空の認証情報を拒否する', async () => {
      const result = await authService.signIn({ email: '', password: '' });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Email and password are required');
    });

    it('メール未確認アカウントのログインを適切に処理する', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' },
      });

      const result = await authService.signIn(validCredentials);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Please check your email and click the confirmation link');
    });

    it('レート制限エラーを適切に処理する', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Too many requests' },
      });

      const result = await authService.signIn(validCredentials);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Too many login attempts');
    });
  });

  describe('パスワードリセットフロー', () => {
    it('有効なメールアドレスでパスワードリセットを送信する', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      const result = await authService.resetPassword('test@peerlearninghub.com');

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@peerlearninghub.com',
        { redirectTo: 'peerlearninghub://reset-password' }
      );
    });

    it('存在しないメールアドレスでもエラーを返さない', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      const result = await authService.resetPassword('nonexistent@test.com');

      expect(result.error).toBeNull();
    });

    it('パスワード更新が成功する', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

      const result = await authService.updatePassword('newpassword123');

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });
  });

  describe('セッション管理', () => {
    it('現在のユーザーを取得する', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      const user = await authService.getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('現在のセッションを取得する', async () => {
      const mockSession = { access_token: 'token-123' };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      const session = await authService.getCurrentSession();

      expect(session).toEqual(mockSession);
    });

    it('ログアウトが成功する', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await authService.signOut();

      expect(result.error).toBeNull();
    });

    it('認証状態変更リスナーを設定する', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: mockUnsubscribe }
      });

      const subscription = authService.onAuthStateChange(mockCallback);

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback);
      expect(subscription).toBeDefined();
    });
  });

  describe('プロフィール管理', () => {
    const mockUserId = 'user-123';
    const mockProfile = {
      id: mockUserId,
      full_name: 'Test User',
      email: 'test@example.com',
      country: 'Japan',
      bio: 'Test bio',
      skills: ['JavaScript', 'React'],
    };

    it('ユーザープロフィールを取得する', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const profile = await authService.getProfile(mockUserId);

      expect(profile).toEqual(mockProfile);
    });

    it('プロフィールを更新する', async () => {
      const updateData = {
        bio: 'Updated bio',
        skills: ['TypeScript', 'Node.js'],
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockProfile, ...updateData },
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await authService.updateProfile(mockUserId, updateData);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({ ...mockProfile, ...updateData });
    });

    it('存在しないユーザーのプロフィール取得でnullを返す', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' },
            }),
          }),
        }),
      });

      const profile = await authService.getProfile('nonexistent-user');

      expect(profile).toBeNull();
    });
  });

  describe('エラーハンドリング', () => {
    it('ネットワークエラーを適切に処理する', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Network connection failed')
      );

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Network connection failed');
    });

    it('Supabase設定エラーを適切に処理する', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid API key' },
      });

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('アプリの設定に問題があります');
    });

    it('予期しないエラーを適切に処理する', async () => {
      mockSupabase.auth.getCurrentUser = jest.fn().mockRejectedValue(
        new Error('Unexpected error')
      );

      const user = await authService.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('モック認証モード', () => {
    beforeEach(() => {
      // Force mock auth mode
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'placeholder';
    });

    afterEach(() => {
      // Reset environment
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    });

    it('モック認証モードで動作する', async () => {
      // This would test the mock authentication service
      // For now, we just verify it doesn't throw errors
      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      });

      // Mock auth should handle this gracefully
      expect(result).toBeDefined();
    });
  });
});