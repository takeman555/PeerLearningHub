import { 
  CustomerInfo, 
  PurchasesOffering, 
  PurchasesPackage,
  PurchasesError 
} from 'react-native-purchases';
import { RevenueCatConfig, PurchaseResult, ENTITLEMENTS, PRODUCT_IDS } from '../config/revenuecat';
import { supabase } from '../config/supabase';

/**
 * RevenueCatサービスクラス - ピアラーニングハブ
 * メンバーシップ管理とRevenueCat統合を担当
 */
export class RevenueCatService {
  private static instance: RevenueCatService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  /**
   * サービスを初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await RevenueCatConfig.initialize();
      this.isInitialized = true;
      console.log('RevenueCatService initialized');
    } catch (error) {
      console.error('Failed to initialize RevenueCatService:', error);
      throw error;
    }
  }

  /**
   * ユーザーをRevenueCatに登録
   */
  async registerUser(userId: string, userAttributes?: Record<string, string>): Promise<void> {
    if (!this.isInitialized) {
      console.log('RevenueCat disabled - skipping user registration:', userId);
      return;
    }

    try {
      await RevenueCatConfig.setUserID(userId);
      
      if (userAttributes) {
        await RevenueCatConfig.setCustomerAttributes(userAttributes);
      }

      console.log(`User ${userId} registered with RevenueCat`);
    } catch (error) {
      if (__DEV__) {
        console.log(`RevenueCat disabled - skipping user registration: ${userId}`);
        return;
      }
      console.error('Failed to register user with RevenueCat:', error);
      throw error;
    }
  }

  /**
   * 利用可能なメンバーシッププランを取得
   */
  async getAvailablePlans(): Promise<{
    monthly?: PurchasesPackage;
    yearly?: PurchasesPackage;
    lifetime?: PurchasesPackage;
  }> {
    if (!this.isInitialized) {
      console.warn('RevenueCat not configured - returning empty plans');
      return {};
    }

    try {
      const offerings = await RevenueCatConfig.getOfferings();
      const defaultOffering = offerings.find(o => o.identifier === 'default');
      
      if (!defaultOffering) {
        throw new Error('Default offering not found');
      }

      const plans: any = {};
      
      for (const pkg of defaultOffering.availablePackages) {
        switch (pkg.product.identifier) {
          case PRODUCT_IDS.MONTHLY_MEMBERSHIP:
            plans.monthly = pkg;
            break;
          case PRODUCT_IDS.YEARLY_MEMBERSHIP:
            plans.yearly = pkg;
            break;
          case PRODUCT_IDS.LIFETIME_MEMBERSHIP:
            plans.lifetime = pkg;
            break;
        }
      }

      return plans;
    } catch (error) {
      console.warn('RevenueCat not configured - returning empty plans');
      return {};
    }
  }

  /**
   * メンバーシップを購入
   */
  async purchaseMembership(packageToPurchase: PurchasesPackage): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
    userCancelled?: boolean;
  }> {
    try {
      const result = await RevenueCatConfig.purchasePackage(packageToPurchase);
      
      if (result.success && result.customerInfo) {
        // データベースのメンバーシップ状態を更新
        await this.syncMembershipStatus(result.customerInfo);
        
        // 購入履歴をデータベースに記録
        await this.recordPurchase(result.customerInfo, packageToPurchase);
      }

      return {
        success: result.success,
        customerInfo: result.customerInfo,
        error: result.error?.message,
        userCancelled: result.userCancelled,
      };
    } catch (error) {
      console.error('Failed to purchase membership:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 購入を復元
   */
  async restorePurchases(): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    try {
      const result = await RevenueCatConfig.restorePurchases();
      
      if (result.success && result.customerInfo) {
        // データベースのメンバーシップ状態を更新
        await this.syncMembershipStatus(result.customerInfo);
      }

      return {
        success: result.success,
        customerInfo: result.customerInfo,
        error: result.error?.message,
      };
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 現在のメンバーシップ状態を取得
   */
  async getMembershipStatus(): Promise<{
    isActive: boolean;
    membershipType: 'visitor' | 'member';
    subscriptionInfo?: {
      productIdentifier: string;
      purchaseDate: Date;
      expirationDate?: Date;
      willRenew: boolean;
    };
  }> {
    try {
      const customerInfo = await RevenueCatConfig.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM_MEMBERSHIP];

      if (!entitlement) {
        return {
          isActive: false,
          membershipType: 'visitor',
        };
      }

      return {
        isActive: true,
        membershipType: 'member',
        subscriptionInfo: {
          productIdentifier: entitlement.productIdentifier,
          purchaseDate: entitlement.latestPurchaseDate,
          expirationDate: entitlement.expirationDate || undefined,
          willRenew: entitlement.willRenew,
        },
      };
    } catch (error) {
      if (__DEV__) {
        console.warn('RevenueCat not configured - returning default membership status');
      } else {
        console.error('Failed to get membership status:', error);
      }
      return {
        isActive: false,
        membershipType: 'visitor',
      };
    }
  }

  /**
   * メンバーシップ状態をデータベースと同期
   */
  async syncMembershipStatus(customerInfo?: CustomerInfo): Promise<void> {
    try {
      const info = customerInfo || await RevenueCatConfig.getCustomerInfo();
      const entitlement = info.entitlements.active[ENTITLEMENTS.PREMIUM_MEMBERSHIP];
      
      // 現在のユーザーIDを取得
      const userId = info.originalAppUserId;
      
      if (!userId) {
        console.warn('User ID not found, cannot sync membership status');
        return;
      }

      const membershipStatus = entitlement ? 'active' : 'none';
      const userType = entitlement ? 'member' : 'visitor';
      const expiresAt = entitlement?.expirationDate?.toISOString();

      // データベースのユーザープロフィールを更新
      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: userType,
          membership_status: membershipStatus,
          membership_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      console.log(`Membership status synced for user ${userId}:`, {
        membershipStatus,
        userType,
        expiresAt,
      });
    } catch (error) {
      console.error('Failed to sync membership status:', error);
      throw error;
    }
  }

  /**
   * 購入履歴をデータベースに記録
   */
  private async recordPurchase(
    customerInfo: CustomerInfo,
    packagePurchased: PurchasesPackage
  ): Promise<void> {
    try {
      const userId = customerInfo.originalAppUserId;
      
      if (!userId) {
        console.warn('User ID not found, cannot record purchase');
        return;
      }

      // 最新の購入情報を取得
      const latestTransaction = customerInfo.latestExpirationDate 
        ? customerInfo.allPurchaseDates[packagePurchased.product.identifier]
        : new Date();

      if (!latestTransaction) {
        console.warn('Purchase date not found');
        return;
      }

      // データベースに購入履歴を記録
      const { error } = await supabase
        .from('in_app_purchases')
        .insert({
          user_id: userId,
          product_id: packagePurchased.product.identifier,
          transaction_id: `rc_${Date.now()}`,
          amount: packagePurchased.product.price,
          currency: packagePurchased.product.currencyCode,
          purchase_date: latestTransaction.toISOString(),
          revenuecat_transaction_id: customerInfo.originalPurchaseDate?.toISOString(),
        });

      if (error) {
        throw error;
      }

      console.log('Purchase recorded in database:', {
        userId,
        productId: packagePurchased.product.identifier,
        amount: packagePurchased.product.price,
      });
    } catch (error) {
      console.error('Failed to record purchase:', error);
      // 購入記録の失敗は購入自体を失敗させない
    }
  }

  /**
   * メンバーシップの期限切れをチェック
   */
  async checkMembershipExpiry(): Promise<{
    isExpired: boolean;
    expiresIn?: number; // 日数
    willRenew?: boolean;
  }> {
    try {
      const subscriptionInfo = await RevenueCatConfig.getSubscriptionInfo();
      
      if (!subscriptionInfo.isActive || !subscriptionInfo.expirationDate) {
        return { isExpired: true };
      }

      const now = new Date();
      const expirationDate = subscriptionInfo.expirationDate;
      const timeDiff = expirationDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return {
        isExpired: daysDiff <= 0,
        expiresIn: Math.max(0, daysDiff),
        willRenew: subscriptionInfo.willRenew,
      };
    } catch (error) {
      console.error('Failed to check membership expiry:', error);
      return { isExpired: true };
    }
  }

  /**
   * ユーザーをログアウト
   */
  async logOut(): Promise<void> {
    try {
      await RevenueCatConfig.logOut();
      console.log('User logged out from RevenueCat');
    } catch (error) {
      console.error('Failed to log out from RevenueCat:', error);
      throw error;
    }
  }

  /**
   * デバッグ情報を取得
   */
  async getDebugInfo(): Promise<any> {
    try {
      return await RevenueCatConfig.getDebugInfo();
    } catch (error) {
      console.error('Failed to get debug info:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const revenueCatService = RevenueCatService.getInstance();

export default RevenueCatService;