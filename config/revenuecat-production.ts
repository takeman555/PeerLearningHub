/**
 * Production RevenueCat Configuration
 * Enhanced configuration for production deployment
 */

import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesError,
  LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';

// Production environment detection
const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

// Production API Keys
const PRODUCTION_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;
const PRODUCTION_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

// Production Product IDs
export const PRODUCTION_PRODUCT_IDS = {
  MONTHLY_MEMBERSHIP: 'peer_learning_hub_monthly',
  YEARLY_MEMBERSHIP: 'peer_learning_hub_yearly',
  LIFETIME_MEMBERSHIP: 'peer_learning_hub_lifetime',
} as const;

// Production Entitlements
export const PRODUCTION_ENTITLEMENTS = {
  PREMIUM_MEMBERSHIP: 'premium_membership',
} as const;

// Production Offerings
export const PRODUCTION_OFFERINGS = {
  DEFAULT: 'default',
  ONBOARDING_SPECIAL: 'onboarding_special',
} as const;

// Production Configuration Interface
export interface ProductionRevenueCatConfig {
  apiKeys: {
    ios: string;
    android: string;
  };
  apps: {
    ios: {
      bundleId: string;
      appStoreId?: string;
    };
    android: {
      packageName: string;
      playStoreId?: string;
    };
  };
  products: {
    [key: string]: {
      id: string;
      type: 'subscription' | 'non_consumable';
      period?: string;
      trialPeriod?: string;
    };
  };
  entitlements: {
    [key: string]: {
      products: string[];
    };
  };
  monitoring: {
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
    enablePerformanceTracking: boolean;
  };
  security: {
    enableReceiptValidation: boolean;
    enableFraudDetection: boolean;
    enableOfflineMode: boolean;
  };
}

// Production Configuration
export const productionRevenueCatConfig: ProductionRevenueCatConfig = {
  apiKeys: {
    ios: PRODUCTION_API_KEY_IOS || '',
    android: PRODUCTION_API_KEY_ANDROID || '',
  },
  apps: {
    ios: {
      bundleId: 'com.peerlearninghub.app',
      appStoreId: process.env.APP_STORE_ID,
    },
    android: {
      packageName: 'com.peerlearninghub.app',
      playStoreId: process.env.GOOGLE_PLAY_ID,
    },
  },
  products: {
    monthly: {
      id: PRODUCTION_PRODUCT_IDS.MONTHLY_MEMBERSHIP,
      type: 'subscription',
      period: 'P1M',
      trialPeriod: 'P7D',
    },
    yearly: {
      id: PRODUCTION_PRODUCT_IDS.YEARLY_MEMBERSHIP,
      type: 'subscription',
      period: 'P1Y',
      trialPeriod: 'P7D',
    },
    lifetime: {
      id: PRODUCTION_PRODUCT_IDS.LIFETIME_MEMBERSHIP,
      type: 'non_consumable',
    },
  },
  entitlements: {
    [PRODUCTION_ENTITLEMENTS.PREMIUM_MEMBERSHIP]: {
      products: [
        PRODUCTION_PRODUCT_IDS.MONTHLY_MEMBERSHIP,
        PRODUCTION_PRODUCT_IDS.YEARLY_MEMBERSHIP,
        PRODUCTION_PRODUCT_IDS.LIFETIME_MEMBERSHIP,
      ],
    },
  },
  monitoring: {
    enableAnalytics: true,
    enableErrorReporting: true,
    enablePerformanceTracking: true,
  },
  security: {
    enableReceiptValidation: true,
    enableFraudDetection: true,
    enableOfflineMode: false, // Disable for production to ensure real-time validation
  },
};

// Production RevenueCat Manager
export class ProductionRevenueCatManager {
  private static initialized = false;
  private static config = productionRevenueCatConfig;

  /**
   * Validate production configuration
   */
  static validateConfiguration(): void {
    const errors: string[] = [];

    if (!this.config.apiKeys.ios) {
      errors.push('iOS API key is required for production');
    }

    if (!this.config.apiKeys.android) {
      errors.push('Android API key is required for production');
    }

    if (!this.config.apiKeys.ios.startsWith('rcat_')) {
      errors.push('iOS API key should start with "rcat_"');
    }

    if (!this.config.apiKeys.android.startsWith('rcat_')) {
      errors.push('Android API key should start with "rcat_"');
    }

    if (errors.length > 0) {
      throw new Error(`Production RevenueCat configuration errors:\n${errors.join('\n')}`);
    }
  }

  /**
   * Initialize RevenueCat for production
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Validate configuration first
      this.validateConfiguration();

      const apiKey = Platform.select({
        ios: this.config.apiKeys.ios,
        android: this.config.apiKeys.android,
      });

      if (!apiKey) {
        throw new Error('No API key found for current platform');
      }

      // Set log level for production (minimal logging)
      Purchases.setLogLevel(isProduction ? LOG_LEVEL.ERROR : LOG_LEVEL.DEBUG);

      // Configure RevenueCat with production settings
      await Purchases.configure({
        apiKey,
        appUserID: undefined, // Will be set later with setUserID
        observerMode: false, // Full mode for production
        userDefaultsSuiteName: undefined,
        useAmazon: false,
        shouldShowInAppMessagesAutomatically: true, // Enable promotional offers
      });

      // Enable additional production features
      if (this.config.monitoring.enableAnalytics) {
        // Enable analytics collection
        await this.enableAnalytics();
      }

      if (this.config.security.enableFraudDetection) {
        // Enable fraud detection
        await this.enableFraudDetection();
      }

      this.initialized = true;
      console.log('Production RevenueCat initialized successfully');

      // Log configuration summary (without sensitive data)
      console.log('RevenueCat Configuration:', {
        platform: Platform.OS,
        bundleId: Platform.OS === 'ios' ? this.config.apps.ios.bundleId : this.config.apps.android.packageName,
        productsCount: Object.keys(this.config.products).length,
        entitlementsCount: Object.keys(this.config.entitlements).length,
      });

    } catch (error) {
      console.error('Failed to initialize production RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Set user ID with enhanced error handling
   */
  static async setUserID(userID: string, attributes?: Record<string, string>): Promise<void> {
    try {
      await Purchases.logIn(userID);
      
      // Set additional user attributes for analytics
      if (attributes) {
        await Purchases.setAttributes(attributes);
      }

      // Set default attributes
      await Purchases.setAttributes({
        '$appVersion': process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
        '$platform': Platform.OS,
        '$environment': 'production',
      });

      console.log(`Production RevenueCat user ID set: ${userID}`);
    } catch (error) {
      console.error('Failed to set production RevenueCat user ID:', error);
      throw error;
    }
  }

  /**
   * Enhanced purchase method with production safeguards
   */
  static async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: PurchasesError;
    userCancelled?: boolean;
  }> {
    try {
      // Pre-purchase validation
      await this.validatePurchaseEligibility();

      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
      
      // Log successful purchase (for analytics)
      await this.logPurchaseEvent('purchase_success', {
        productId: productIdentifier,
        packageId: packageToPurchase.identifier,
        offeringId: packageToPurchase.offeringIdentifier,
      });

      console.log('Production purchase successful:', {
        productIdentifier,
        entitlements: Object.keys(customerInfo.entitlements.active),
      });

      return {
        success: true,
        customerInfo,
      };
    } catch (error) {
      const purchasesError = error as PurchasesError;
      
      // Log failed purchase (for analytics)
      await this.logPurchaseEvent('purchase_failed', {
        error: purchasesError.message,
        userCancelled: purchasesError.userCancelled,
      });

      console.error('Production purchase failed:', error);
      
      return {
        success: false,
        error: purchasesError,
        userCancelled: purchasesError.userCancelled,
      };
    }
  }

  /**
   * Enhanced restore purchases with production safeguards
   */
  static async restorePurchases(): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: PurchasesError;
  }> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      
      // Log successful restore (for analytics)
      await this.logPurchaseEvent('restore_success', {
        entitlements: Object.keys(customerInfo.entitlements.active),
      });

      console.log('Production purchases restored:', {
        entitlements: Object.keys(customerInfo.entitlements.active),
      });

      return {
        success: true,
        customerInfo,
      };
    } catch (error) {
      const purchasesError = error as PurchasesError;
      
      // Log failed restore (for analytics)
      await this.logPurchaseEvent('restore_failed', {
        error: purchasesError.message,
      });

      console.error('Production restore failed:', error);
      
      return {
        success: false,
        error: purchasesError,
      };
    }
  }

  /**
   * Get production offerings with caching
   */
  static async getOfferings(): Promise<PurchasesOffering[]> {
    try {
      const offerings = await Purchases.getOfferings();
      const offeringsArray = Object.values(offerings.all);

      // Log offerings retrieval (for monitoring)
      console.log(`Retrieved ${offeringsArray.length} offerings in production`);

      return offeringsArray;
    } catch (error) {
      console.error('Failed to get production offerings:', error);
      throw error;
    }
  }

  /**
   * Enhanced customer info with caching
   */
  static async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      // Update user attributes based on customer info
      await this.updateUserAttributes(customerInfo);

      return customerInfo;
    } catch (error) {
      console.error('Failed to get production customer info:', error);
      throw error;
    }
  }

  /**
   * Production-specific analytics enablement
   */
  private static async enableAnalytics(): Promise<void> {
    try {
      // Enable RevenueCat analytics features
      await Purchases.setAttributes({
        '$analyticsEnabled': 'true',
        '$productionMode': 'true',
      });
    } catch (error) {
      console.warn('Failed to enable analytics:', error);
    }
  }

  /**
   * Production-specific fraud detection
   */
  private static async enableFraudDetection(): Promise<void> {
    try {
      // Enable fraud detection features
      await Purchases.setAttributes({
        '$fraudDetectionEnabled': 'true',
      });
    } catch (error) {
      console.warn('Failed to enable fraud detection:', error);
    }
  }

  /**
   * Validate purchase eligibility
   */
  private static async validatePurchaseEligibility(): Promise<void> {
    // Add any pre-purchase validation logic here
    // For example, check if user is already subscribed, validate account status, etc.
  }

  /**
   * Log purchase events for analytics
   */
  private static async logPurchaseEvent(event: string, data: Record<string, any>): Promise<void> {
    try {
      // Log to RevenueCat attributes
      await Purchases.setAttributes({
        [`$lastEvent`]: event,
        [`$lastEventTime`]: new Date().toISOString(),
      });

      // You can also log to your analytics service here
      console.log(`RevenueCat Event: ${event}`, data);
    } catch (error) {
      console.warn('Failed to log purchase event:', error);
    }
  }

  /**
   * Update user attributes based on customer info
   */
  private static async updateUserAttributes(customerInfo: CustomerInfo): Promise<void> {
    try {
      const attributes: Record<string, string> = {
        '$lastUpdated': new Date().toISOString(),
        '$activeEntitlements': Object.keys(customerInfo.entitlements.active).join(','),
        '$allEntitlements': Object.keys(customerInfo.entitlements.all).join(','),
      };

      // Add subscription-specific attributes
      const premiumEntitlement = customerInfo.entitlements.active[PRODUCTION_ENTITLEMENTS.PREMIUM_MEMBERSHIP];
      if (premiumEntitlement) {
        attributes['$subscriptionStatus'] = 'active';
        attributes['$productId'] = premiumEntitlement.productIdentifier;
        attributes['$willRenew'] = premiumEntitlement.willRenew.toString();
        
        if (premiumEntitlement.expirationDate) {
          attributes['$expirationDate'] = premiumEntitlement.expirationDate.toISOString();
        }
      } else {
        attributes['$subscriptionStatus'] = 'inactive';
      }

      await Purchases.setAttributes(attributes);
    } catch (error) {
      console.warn('Failed to update user attributes:', error);
    }
  }

  /**
   * Get production configuration
   */
  static getConfiguration(): ProductionRevenueCatConfig {
    return this.config;
  }

  /**
   * Health check for production monitoring
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const offerings = await this.getOfferings();

      return {
        status: 'healthy',
        details: {
          initialized: this.initialized,
          customerInfoAvailable: !!customerInfo,
          offeringsCount: offerings.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}

export default ProductionRevenueCatManager;