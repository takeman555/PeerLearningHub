import { revenueCatService } from '../services/revenueCatService';

// RevenueCatのモック
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  logIn: jest.fn(),
  logOut: jest.fn(),
  getCustomerInfo: jest.fn(),
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  setAttributes: jest.fn(),
  setLogLevel: jest.fn(),
  LOG_LEVEL: {
    DEBUG: 'DEBUG',
  },
}));

// Supabaseのモック
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ error: null })),
      })),
      insert: jest.fn(() => ({ error: null })),
    })),
  },
}));

describe('RevenueCatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize RevenueCat service successfully', async () => {
      await expect(revenueCatService.initialize()).resolves.not.toThrow();
    });

    it('should not initialize twice', async () => {
      await revenueCatService.initialize();
      await expect(revenueCatService.initialize()).resolves.not.toThrow();
    });
  });

  describe('registerUser', () => {
    it('should register user with RevenueCat', async () => {
      const userId = 'test-user-id';
      const attributes = { email: 'test@example.com' };

      await expect(
        revenueCatService.registerUser(userId, attributes)
      ).resolves.not.toThrow();
    });
  });

  describe('getMembershipStatus', () => {
    it('should return visitor status when no active entitlement', async () => {
      const mockCustomerInfo = {
        entitlements: { active: {} },
      };

      const Purchases = require('react-native-purchases');
      Purchases.getCustomerInfo.mockResolvedValue(mockCustomerInfo);

      const status = await revenueCatService.getMembershipStatus();

      expect(status.isActive).toBe(false);
      expect(status.membershipType).toBe('visitor');
    });

    it('should return member status when active entitlement exists', async () => {
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
  });

  describe('purchaseMembership', () => {
    it('should handle successful purchase', async () => {
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

      const result = await revenueCatService.purchaseMembership(mockPackage as any);

      expect(result.success).toBe(true);
      expect(result.customerInfo).toBeDefined();
    });

    it('should handle purchase cancellation', async () => {
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

  describe('restorePurchases', () => {
    it('should restore purchases successfully', async () => {
      const mockCustomerInfo = {
        entitlements: { active: { premium_membership: {} } },
      };

      const Purchases = require('react-native-purchases');
      Purchases.restorePurchases.mockResolvedValue(mockCustomerInfo);

      const result = await revenueCatService.restorePurchases();

      expect(result.success).toBe(true);
      expect(result.customerInfo).toBeDefined();
    });
  });

  describe('checkMembershipExpiry', () => {
    it('should return expired when no active subscription', async () => {
      const Purchases = require('react-native-purchases');
      Purchases.getCustomerInfo.mockResolvedValue({
        entitlements: { active: {} },
      });

      const expiry = await revenueCatService.checkMembershipExpiry();

      expect(expiry.isExpired).toBe(true);
    });

    it('should calculate days until expiry correctly', async () => {
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

      const expiry = await revenueCatService.checkMembershipExpiry();

      expect(expiry.isExpired).toBe(false);
      expect(expiry.expiresIn).toBe(5);
      expect(expiry.willRenew).toBe(true);
    });
  });

  describe('syncMembershipStatus', () => {
    it('should sync membership status to database', async () => {
      const mockCustomerInfo = {
        originalAppUserId: 'test-user-id',
        entitlements: {
          active: {
            premium_membership: {
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      };

      await expect(
        revenueCatService.syncMembershipStatus(mockCustomerInfo as any)
      ).resolves.not.toThrow();
    });
  });

  describe('logOut', () => {
    it('should log out user from RevenueCat', async () => {
      await expect(revenueCatService.logOut()).resolves.not.toThrow();
    });
  });
});