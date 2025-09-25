/**
 * メンバーシップ機能テスト
 * 要件 3.4: メンバーシップ機能のテスト（購入・復元・状態管理）
 */

import { revenueCatService } from '../services/revenueCatService';
import { supabase } from '../config/supabase';

// Mock dependencies
jest.mock('../config/supabase');
jest.mock('react-native-purchases');

describe('メンバーシップ機能テスト', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('メンバーシップ状態管理', () => {
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

      const Purchases = require('react-native-purchases');
      Purchases.getCustomerInfo.mockResolvedValue(mockCustomerInfo);

      const status = await revenueCatService.getMembershipStatus();

      expect(status.isActive).toBe(true);
      expect(status.membershipType).toBe('member');
      expect(status.subscriptionInfo).toBeDefined();
      expect(status.subscriptionInfo?.productIdentifier).toBe('peer_learning_hub_monthly');
      expect(status.subscriptionInfo?.willRenew).toBe(true);
    });

    it('非アクティブなメンバーシップ状態を正しく取得する', async () => {
      const mockCustomerInfo = {
        entitlements: { active: {} },
      };

      const Purchases = require('react-native-purchases');
      Purchases.getCustomerInfo.mockResolvedValue(mockCustomerInfo);

      const status = await revenueCatService.getMembershipStatus();

      expect(status.isActive).toBe(false);
      expect(status.membershipType).toBe('visitor');
      expect(status.subscriptionInfo).toBeUndefined();
    });

    it('RevenueCat設定エラー時にデフォルト状態を返す', async () => {
      const Purchases = require('react-native-purchases');
      Purchases.getCustomerInfo.mockRejectedValue(new Error('RevenueCat not configured'));

      const status = await revenueCatService.getMembershipStatus();

      expect(status.isActive).toBe(false);
      expect(status.membershipType).toBe('visitor');
    });
  });

  describe('メンバーシップ購入機能', () => {
    const mockMonthlyPackage = {
      product: {
        identifier: 'peer_learning_hub_monthly',
        price: 9.99,
        currencyCode: 'USD',
      },
    };

    it('月額メンバーシップの購入が成功する', async () => {
      const mockCustomerInfo = {
        originalAppUserId: mockUserId,
        entitlements: { active: { premium_membership: {} } },
        allPurchaseDates: { 'peer_learning_hub_monthly': new Date() },
      };

      const Purchases = require('react-native-purchases');
      Purchases.purchasePackage.mockResolvedValue({
        customerInfo: mockCustomerInfo,
        productIdentifier: 'peer_learning_hub_monthly',
      });

      // Mock database updates
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await revenueCatService.purchaseMembership(mockMonthlyPackage as any);

      expect(result.success).toBe(true);
      expect(result.customerInfo).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.userCancelled).toBeUndefined();
    });

    it('年額メンバーシップの購入が成功する', async () => {
      const mockYearlyPackage = {
        product: {
          identifier: 'peer_learning_hub_yearly',
          price: 99.99,
          currencyCode: 'USD',
        },
      };

      const mockCustomerInfo = {
        originalAppUserId: mockUserId,
        entitlements: { active: { premium_membership: {} } },
        allPurchaseDates: { 'peer_learning_hub_yearly': new Date() },
      };

      const Purchases = require('react-native-purchases');
      Purchases.purchasePackage.mockResolvedValue({
        customerInfo: mockCustomerInfo,
        productIdentifier: 'peer_learning_hub_yearly',
      });

      // Mock database updates
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await revenueCatService.purchaseMembership(mockYearlyPackage as any);

      expect(result.success).toBe(true);
      expect(result.customerInfo).toBeDefined();
    });

    it('ユーザーキャンセル時の処理が正しい', async () => {
      const mockError = {
        userCancelled: true,
        message: 'User cancelled',
      };

      const Purchases = require('react-native-purchases');
      Purchases.purchasePackage.mockRejectedValue(mockError);

      const result = await revenueCatService.purchaseMembership(mockMonthlyPackage as any);

      expect(result.success).toBe(false);
      expect(result.userCancelled).toBe(true);
      expect(result.error).toBe('User cancelled');
    });

    it('購入エラー時の処理が正しい', async () => {
      const mockError = {
        userCancelled: false,
        message: 'Payment failed',
      };

      const Purchases = require('react-native-purchases');
      Purchases.purchasePackage.mockRejectedValue(mockError);

      const result = await revenueCatService.purchaseMembership(mockMonthlyPackage as any);

      expect(result.success).toBe(false);
      expect(result.userCancelled).toBeFalsy();
      expect(result.error).toBe('Payment failed');
    });

    it('ネットワークエラー時の処理が正しい', async () => {
      const Purchases = require('react-native-purchases');
      Purchases.purchasePackage.mockRejectedValue(new Error('Network error'));

      const result = await revenueCatService.purchaseMembership(mockMonthlyPackage as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('購入復元機能', () => {
    it('購入復元が成功する', async () => {
      const mockCustomerInfo = {
        originalAppUserId: mockUserId,
        entitlements: { active: { premium_membership: {} } },
      };

      const Purchases = require('react-native-purchases');
      Purchases.restorePurchases.mockResolvedValue(mockCustomerInfo);

      // Mock database update
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await revenueCatService.restorePurchases();

      expect(result.success).toBe(true);
      expect(result.customerInfo).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('復元する購入がない場合の処理が正しい', async () => {
      const mockCustomerInfo = {
        originalAppUserId: mockUserId,
        entitlements: { active: {} },
      };

      const Purchases = require('react-native-purchases');
      Purchases.restorePurchases.mockResolvedValue(mockCustomerInfo);

      // Mock database update
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await revenueCatService.restorePurchases();

      expect(result.success).toBe(true);
      expect(result.customerInfo).toBeDefined();
    });

    it('復元エラー時の処理が正しい', async () => {
      const Purchases = require('react-native-purchases');
      Purchases.restorePurchases.mockRejectedValue(new Error('Restore failed'));

      const result = await revenueCatService.restorePurchases();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Restore failed');
    });
  });

  describe('メンバーシップ期限管理', () => {
    it('有効期限を正しく計算する', async () => {
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

      // Mock RevenueCat config
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
      expect(expiry.expiresIn).toBeUndefined();
      expect(expiry.willRenew).toBeUndefined();
    });

    it('今日期限切れのメンバーシップを正しく検出する', async () => {
      const todayDate = new Date();
      todayDate.setHours(23, 59, 59, 999); // End of today

      const mockCustomerInfo = {
        entitlements: {
          active: {
            premium_membership: {
              expirationDate: todayDate,
              willRenew: false,
            },
          },
        },
      };

      const Purchases = require('react-native-purchases');
      Purchases.getCustomerInfo.mockResolvedValue(mockCustomerInfo);

      jest.doMock('../config/revenuecat', () => ({
        RevenueCatConfig: {
          getSubscriptionInfo: jest.fn().mockResolvedValue({
            isActive: true,
            expirationDate: todayDate,
            willRenew: false,
          }),
        },
      }));

      const expiry = await revenueCatService.checkMembershipExpiry();

      expect(expiry.isExpired).toBe(true);
      expect(expiry.expiresIn).toBe(0);
      expect(expiry.willRenew).toBe(false);
    });
  });

  describe('データベース同期機能', () => {
    it('メンバーシップ状態をデータベースに同期する', async () => {
      const mockCustomerInfo = {
        originalAppUserId: mockUserId,
        entitlements: {
          active: {
            premium_membership: {
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(
        revenueCatService.syncMembershipStatus(mockCustomerInfo as any)
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('非アクティブメンバーシップをデータベースに同期する', async () => {
      const mockCustomerInfo = {
        originalAppUserId: mockUserId,
        entitlements: { active: {} },
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(
        revenueCatService.syncMembershipStatus(mockCustomerInfo as any)
      ).resolves.not.toThrow();
    });

    it('データベース同期エラーを適切に処理する', async () => {
      const mockCustomerInfo = {
        originalAppUserId: mockUserId,
        entitlements: { active: {} },
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Database error' },
          }),
        }),
      });

      await expect(
        revenueCatService.syncMembershipStatus(mockCustomerInfo as any)
      ).rejects.toThrow();
    });

    it('ユーザーIDがない場合の同期を適切に処理する', async () => {
      const mockCustomerInfo = {
        originalAppUserId: null,
        entitlements: { active: {} },
      };

      await expect(
        revenueCatService.syncMembershipStatus(mockCustomerInfo as any)
      ).resolves.not.toThrow();

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('利用可能プラン取得', () => {
    it('利用可能なメンバーシッププランを取得する', async () => {
      const mockOfferings = [
        {
          identifier: 'default',
          availablePackages: [
            {
              product: {
                identifier: 'peer_learning_hub_monthly',
                price: 9.99,
                currencyCode: 'USD',
              },
            },
            {
              product: {
                identifier: 'peer_learning_hub_yearly',
                price: 99.99,
                currencyCode: 'USD',
              },
            },
          ],
        },
      ];

      jest.doMock('../config/revenuecat', () => ({
        RevenueCatConfig: {
          getOfferings: jest.fn().mockResolvedValue(mockOfferings),
        },
        PRODUCT_IDS: {
          MONTHLY_MEMBERSHIP: 'peer_learning_hub_monthly',
          YEARLY_MEMBERSHIP: 'peer_learning_hub_yearly',
          LIFETIME_MEMBERSHIP: 'peer_learning_hub_lifetime',
        },
      }));

      const plans = await revenueCatService.getAvailablePlans();

      expect(plans.monthly).toBeDefined();
      expect(plans.yearly).toBeDefined();
      expect(plans.monthly?.product.identifier).toBe('peer_learning_hub_monthly');
      expect(plans.yearly?.product.identifier).toBe('peer_learning_hub_yearly');
    });

    it('デフォルトオファリングが見つからない場合のエラー処理', async () => {
      jest.doMock('../config/revenuecat', () => ({
        RevenueCatConfig: {
          getOfferings: jest.fn().mockResolvedValue([]),
        },
      }));

      await expect(revenueCatService.getAvailablePlans()).rejects.toThrow(
        'Default offering not found'
      );
    });

    it('開発環境で空のプランを返す', async () => {
      // Mock development environment
      (global as any).__DEV__ = true;

      jest.doMock('../config/revenuecat', () => ({
        RevenueCatConfig: {
          getOfferings: jest.fn().mockRejectedValue(new Error('Not configured')),
        },
      }));

      const plans = await revenueCatService.getAvailablePlans();

      expect(plans).toEqual({});
    });
  });

  describe('ユーザー登録・ログアウト', () => {
    it('ユーザーをRevenueCatに登録する', async () => {
      const userAttributes = {
        email: 'test@example.com',
        country: 'Japan',
      };

      jest.doMock('../config/revenuecat', () => ({
        RevenueCatConfig: {
          setUserID: jest.fn().mockResolvedValue(undefined),
          setCustomerAttributes: jest.fn().mockResolvedValue(undefined),
        },
      }));

      await expect(
        revenueCatService.registerUser(mockUserId, userAttributes)
      ).resolves.not.toThrow();
    });

    it('開発環境でユーザー登録をスキップする', async () => {
      (global as any).__DEV__ = true;

      jest.doMock('../config/revenuecat', () => ({
        RevenueCatConfig: {
          setUserID: jest.fn().mockRejectedValue(new Error('Not configured')),
        },
      }));

      await expect(
        revenueCatService.registerUser(mockUserId)
      ).resolves.not.toThrow();
    });

    it('ユーザーをRevenueCatからログアウトする', async () => {
      jest.doMock('../config/revenuecat', () => ({
        RevenueCatConfig: {
          logOut: jest.fn().mockResolvedValue(undefined),
        },
      }));

      await expect(revenueCatService.logOut()).resolves.not.toThrow();
    });

    it('ログアウトエラーを適切に処理する', async () => {
      jest.doMock('../config/revenuecat', () => ({
        RevenueCatConfig: {
          logOut: jest.fn().mockRejectedValue(new Error('Logout failed')),
        },
      }));

      await expect(revenueCatService.logOut()).rejects.toThrow('Logout failed');
    });
  });

  describe('デバッグ機能', () => {
    it('デバッグ情報を取得する', async () => {
      const mockDebugInfo = {
        userId: mockUserId,
        isConfigured: true,
        offerings: [],
      };

      jest.doMock('../config/revenuecat', () => ({
        RevenueCatConfig: {
          getDebugInfo: jest.fn().mockResolvedValue(mockDebugInfo),
        },
      }));

      const debugInfo = await revenueCatService.getDebugInfo();

      expect(debugInfo).toEqual(mockDebugInfo);
    });

    it('デバッグ情報取得エラーを適切に処理する', async () => {
      jest.doMock('../config/revenuecat', () => ({
        RevenueCatConfig: {
          getDebugInfo: jest.fn().mockRejectedValue(new Error('Debug failed')),
        },
      }));

      await expect(revenueCatService.getDebugInfo()).rejects.toThrow('Debug failed');
    });
  });
});