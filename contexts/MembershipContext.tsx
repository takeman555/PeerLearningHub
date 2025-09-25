import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PurchasesPackage } from 'react-native-purchases';
import { revenueCatService } from '../services/revenueCatService';
import { useAuth } from './AuthContext';

interface MembershipContextType {
  // 状態
  isLoading: boolean;
  isActive: boolean;
  membershipType: 'visitor' | 'member';
  availablePlans: {
    monthly?: PurchasesPackage;
    yearly?: PurchasesPackage;
    lifetime?: PurchasesPackage;
  };
  subscriptionInfo?: {
    productIdentifier: string;
    purchaseDate: Date;
    expirationDate?: Date;
    willRenew: boolean;
  };
  
  // アクション
  purchaseMembership: (packageToPurchase: PurchasesPackage) => Promise<{
    success: boolean;
    error?: string;
    userCancelled?: boolean;
  }>;
  restorePurchases: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  refreshMembershipStatus: () => Promise<void>;
  
  // 期限切れ情報
  expiryInfo: {
    isExpired: boolean;
    expiresIn?: number;
    willRenew?: boolean;
  };
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

interface MembershipProviderProps {
  children: ReactNode;
}

export function MembershipProvider({ children }: MembershipProviderProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [membershipType, setMembershipType] = useState<'visitor' | 'member'>('visitor');
  const [availablePlans, setAvailablePlans] = useState<{
    monthly?: PurchasesPackage;
    yearly?: PurchasesPackage;
    lifetime?: PurchasesPackage;
  }>({});
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    productIdentifier: string;
    purchaseDate: Date;
    expirationDate?: Date;
    willRenew: boolean;
  } | undefined>();
  const [expiryInfo, setExpiryInfo] = useState<{
    isExpired: boolean;
    expiresIn?: number;
    willRenew?: boolean;
  }>({ isExpired: true });

  // RevenueCatサービスの初期化
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        await revenueCatService.initialize();
        
        if (user) {
          await revenueCatService.registerUser(user.id, {
            email: user.email || '',
            user_type: 'visitor'
          });
        }
      } catch (error) {
        // 開発環境では初期化エラーを無視
        if (__DEV__) {
          console.log('RevenueCat initialization skipped in development mode');
        } else {
          console.error('RevenueCat initialization failed:', error);
        }
      }
    };

    initializeRevenueCat();
  }, [user]);

  // メンバーシップ状態の取得
  const refreshMembershipStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // メンバーシップ状態を取得
      const status = await revenueCatService.getMembershipStatus();
      setIsActive(status.isActive);
      setMembershipType(status.membershipType);
      setSubscriptionInfo(status.subscriptionInfo);

      // 利用可能なプランを取得
      const plans = await revenueCatService.getAvailablePlans();
      setAvailablePlans(plans);

      // 期限切れ情報を取得
      const expiry = await revenueCatService.checkMembershipExpiry();
      setExpiryInfo(expiry);

    } catch (error) {
      console.warn('Failed to refresh membership status (development mode):', error.message);
      // 開発環境では基本的な状態を設定
      setIsActive(false);
      setMembershipType('visitor');
      setAvailablePlans({});
      setExpiryInfo({ isExpired: true });
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザーが変更されたときにメンバーシップ状態を更新
  useEffect(() => {
    refreshMembershipStatus();
  }, [user]);

  // メンバーシップ購入
  const purchaseMembership = async (packageToPurchase: PurchasesPackage) => {
    try {
      const result = await revenueCatService.purchaseMembership(packageToPurchase);
      
      if (result.success) {
        // 成功時にメンバーシップ状態を更新
        await refreshMembershipStatus();
      }

      return {
        success: result.success,
        error: result.error,
        userCancelled: result.userCancelled,
      };
    } catch (error) {
      console.error('Failed to purchase membership:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // 購入復元
  const restorePurchases = async () => {
    try {
      const result = await revenueCatService.restorePurchases();
      
      if (result.success) {
        // 成功時にメンバーシップ状態を更新
        await refreshMembershipStatus();
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const value: MembershipContextType = {
    isLoading,
    isActive,
    membershipType,
    availablePlans,
    subscriptionInfo,
    purchaseMembership,
    restorePurchases,
    refreshMembershipStatus,
    expiryInfo,
  };

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
}

// カスタムフック
export function useMembership() {
  const context = useContext(MembershipContext);
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
}

// 便利なカスタムフック
export function useIsMember(): boolean {
  const { isActive } = useMembership();
  return isActive;
}

export function useMembershipExpiry(): {
  isExpiring: boolean;
  daysLeft?: number;
  willRenew?: boolean;
} {
  const { expiryInfo } = useMembership();
  
  return {
    isExpiring: !expiryInfo.isExpired && (expiryInfo.expiresIn || 0) <= 7,
    daysLeft: expiryInfo.expiresIn,
    willRenew: expiryInfo.willRenew,
  };
}

export function useMembershipPlans() {
  const { availablePlans, isLoading } = useMembership();
  
  return {
    plans: availablePlans,
    isLoading,
    hasPlans: Object.keys(availablePlans).length > 0,
  };
}