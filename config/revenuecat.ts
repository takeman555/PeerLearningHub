import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesError,
  LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';

/**
 * RevenueCat設定とユーティリティ - ピアラーニングハブ
 */

// RevenueCat API Keys
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

// 開発環境でRevenueCatを無効化するフラグ
const DISABLE_REVENUECAT_IN_DEV = __DEV__ && (!REVENUECAT_API_KEY_IOS && !REVENUECAT_API_KEY_ANDROID);

// プロダクトID定義
export const PRODUCT_IDS = {
  MONTHLY_MEMBERSHIP: 'peer_learning_hub_monthly',
  YEARLY_MEMBERSHIP: 'peer_learning_hub_yearly',
  LIFETIME_MEMBERSHIP: 'peer_learning_hub_lifetime',
} as const;

// エンタイトルメント定義
export const ENTITLEMENTS = {
  PREMIUM_MEMBERSHIP: 'premium_membership',
} as const;

// オファリング定義
export const OFFERINGS = {
  DEFAULT: 'default',
  ONBOARDING: 'onboarding_special',
} as const;

// メンバーシップタイプ
export type MembershipType = 'visitor' | 'member' | 'admin';

// 購入結果の型定義
export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: PurchasesError;
  userCancelled?: boolean;
}

// オファリング情報の型定義
export interface OfferingInfo {
  identifier: string;
  serverDescription: string;
  availablePackages: PurchasesPackage[];
}

/**
 * RevenueCat初期化クラス
 */
export class RevenueCatConfig {
  private static initialized = false;

  /**
   * RevenueCatを初期化
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 開発環境でAPIキーがない場合は初期化をスキップ
    if (DISABLE_REVENUECAT_IN_DEV) {
      console.log('RevenueCat disabled in development mode (no API keys)');
      this.initialized = true;
      return;
    }

    try {
      const apiKey = Platform.select({
        ios: REVENUECAT_API_KEY_IOS,
        android: REVENUECAT_API_KEY_ANDROID,
      });

      if (!apiKey) {
        throw new Error('RevenueCat API key not found for current platform');
      }

      // デバッグモードの設定
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // RevenueCat初期化
      await Purchases.configure({
        apiKey,
        appUserID: undefined, // 後でsetAppUserIDで設定
      });

      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  /**
   * ユーザーIDを設定
   */
  static async setUserID(userID: string): Promise<void> {
    if (DISABLE_REVENUECAT_IN_DEV) {
      console.log(`RevenueCat disabled - skipping user ID setup: ${userID}`);
      return;
    }

    try {
      await Purchases.logIn(userID);
      console.log(`RevenueCat user ID set to: ${userID}`);
    } catch (error) {
      console.error('Failed to set RevenueCat user ID:', error);
      throw error;
    }
  }

  /**
   * ユーザーをログアウト
   */
  static async logOut(): Promise<void> {
    try {
      await Purchases.logOut();
      console.log('RevenueCat user logged out');
    } catch (error) {
      console.error('Failed to log out RevenueCat user:', error);
      throw error;
    }
  }

  /**
   * 現在のカスタマー情報を取得
   */
  static async getCustomerInfo(): Promise<CustomerInfo> {
    if (DISABLE_REVENUECAT_IN_DEV) {
      // 開発環境用のモックデータ
      return {
        originalAppUserId: 'dev-user',
        entitlements: { active: {}, all: {} },
        allPurchaseDates: {},
        latestExpirationDate: null,
        originalPurchaseDate: null,
      } as CustomerInfo;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  /**
   * 利用可能なオファリングを取得
   */
  static async getOfferings(): Promise<PurchasesOffering[]> {
    if (DISABLE_REVENUECAT_IN_DEV) {
      // 開発環境用の空の配列を返す
      return [];
    }

    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Failed to get offerings:', error);
      throw error;
    }
  }

  /**
   * 特定のオファリングを取得
   */
  static async getOffering(identifier: string): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.all[identifier] || null;
    } catch (error) {
      console.error(`Failed to get offering ${identifier}:`, error);
      return null;
    }
  }

  /**
   * パッケージを購入
   */
  static async purchasePackage(packageToPurchase: PurchasesPackage): Promise<PurchaseResult> {
    try {
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
      
      console.log('Purchase successful:', {
        productIdentifier,
        entitlements: Object.keys(customerInfo.entitlements.active),
      });

      return {
        success: true,
        customerInfo,
      };
    } catch (error) {
      console.error('Purchase failed:', error);
      
      const purchasesError = error as PurchasesError;
      
      return {
        success: false,
        error: purchasesError,
        userCancelled: purchasesError.userCancelled,
      };
    }
  }

  /**
   * 購入を復元
   */
  static async restorePurchases(): Promise<PurchaseResult> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      
      console.log('Purchases restored:', {
        entitlements: Object.keys(customerInfo.entitlements.active),
      });

      return {
        success: true,
        customerInfo,
      };
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      
      return {
        success: false,
        error: error as PurchasesError,
      };
    }
  }

  /**
   * プレミアムメンバーシップの状態をチェック
   */
  static async isPremiumMember(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM_MEMBERSHIP] !== undefined;
    } catch (error) {
      console.error('Failed to check premium membership:', error);
      return false;
    }
  }

  /**
   * メンバーシップタイプを取得
   */
  static async getMembershipType(): Promise<MembershipType> {
    try {
      const isPremium = await this.isPremiumMember();
      return isPremium ? 'member' : 'visitor';
    } catch (error) {
      console.error('Failed to get membership type:', error);
      return 'visitor';
    }
  }

  /**
   * サブスクリプション情報を取得
   */
  static async getSubscriptionInfo(): Promise<{
    isActive: boolean;
    productIdentifier?: string;
    purchaseDate?: Date;
    expirationDate?: Date;
    willRenew?: boolean;
  }> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM_MEMBERSHIP];

      if (!entitlement) {
        return { isActive: false };
      }

      return {
        isActive: true,
        productIdentifier: entitlement.productIdentifier,
        purchaseDate: entitlement.latestPurchaseDate,
        expirationDate: entitlement.expirationDate,
        willRenew: entitlement.willRenew,
      };
    } catch (error) {
      console.error('Failed to get subscription info:', error);
      return { isActive: false };
    }
  }

  /**
   * カスタマー属性を設定
   */
  static async setCustomerAttributes(attributes: Record<string, string>): Promise<void> {
    try {
      await Purchases.setAttributes(attributes);
      console.log('Customer attributes set:', attributes);
    } catch (error) {
      console.error('Failed to set customer attributes:', error);
      throw error;
    }
  }

  /**
   * デバッグ情報を取得
   */
  static async getDebugInfo(): Promise<{
    customerInfo: CustomerInfo;
    offerings: PurchasesOffering[];
    isConfigured: boolean;
  }> {
    try {
      const [customerInfo, offerings] = await Promise.all([
        this.getCustomerInfo(),
        this.getOfferings(),
      ]);

      return {
        customerInfo,
        offerings,
        isConfigured: this.initialized,
      };
    } catch (error) {
      console.error('Failed to get debug info:', error);
      throw error;
    }
  }
}

// ヘルパー関数
export const formatPrice = (price: number, currencyCode: string): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currencyCode,
  }).format(price);
};

export const formatPeriod = (period: string, periodUnit: string): string => {
  const unitMap: Record<string, string> = {
    DAY: '日',
    WEEK: '週',
    MONTH: 'ヶ月',
    YEAR: '年',
  };

  return `${period}${unitMap[periodUnit] || periodUnit}`;
};

export default RevenueCatConfig;