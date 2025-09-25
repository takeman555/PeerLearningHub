import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useMembership } from '../../contexts/MembershipContext';
import { formatPrice, formatPeriod } from '../../config/revenuecat';
import { PurchasesPackage } from 'react-native-purchases';

export default function MembershipScreen() {
  const {
    isLoading,
    isActive,
    membershipType,
    availablePlans,
    subscriptionInfo,
    purchaseMembership,
    restorePurchases,
    expiryInfo,
  } = useMembership();

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    setPurchasing(true);
    
    try {
      const result = await purchaseMembership(packageToPurchase);
      
      if (result.success) {
        Alert.alert(
          '購入完了',
          'メンバーシップの購入が完了しました！',
          [{ text: 'OK' }]
        );
      } else if (result.userCancelled) {
        // ユーザーがキャンセルした場合は何もしない
      } else {
        Alert.alert(
          '購入エラー',
          result.error || '購入に失敗しました。もう一度お試しください。',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'エラー',
        '予期しないエラーが発生しました。',
        [{ text: 'OK' }]
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    
    try {
      const result = await restorePurchases();
      
      if (result.success) {
        Alert.alert(
          '復元完了',
          '購入履歴の復元が完了しました。',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '復元エラー',
          result.error || '購入履歴の復元に失敗しました。',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'エラー',
        '予期しないエラーが発生しました。',
        [{ text: 'OK' }]
      );
    } finally {
      setRestoring(false);
    }
  };

  const renderPlanCard = (
    plan: PurchasesPackage,
    title: string,
    description: string,
    isRecommended?: boolean
  ) => (
    <View style={[styles.planCard, isRecommended && styles.recommendedCard]}>
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>おすすめ</Text>
        </View>
      )}
      
      <Text style={styles.planTitle}>{title}</Text>
      <Text style={styles.planDescription}>{description}</Text>
      
      <View style={styles.priceContainer}>
        <Text style={styles.price}>
          {formatPrice(plan.product.price, plan.product.currencyCode)}
        </Text>
        <Text style={styles.period}>
          / {formatPeriod(plan.product.subscriptionPeriod?.numberOfUnits?.toString() || '1', 
                         plan.product.subscriptionPeriod?.unit || 'MONTH')}
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.purchaseButton, isRecommended && styles.recommendedButton]}
        onPress={() => handlePurchase(plan)}
        disabled={purchasing}
      >
        {purchasing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.purchaseButtonText}>選択する</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  // 開発環境でRevenueCatが設定されていない場合の表示
  const hasPlans = Object.keys(availablePlans).length > 0;
  if (!hasPlans && __DEV__) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>メンバーシップ（開発モード）</Text>
          <Text style={styles.statusInactive}>RevenueCat未設定</Text>
        </View>

        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>開発環境について</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>• RevenueCatのAPIキーが設定されていません</Text>
            <Text style={styles.benefitItem}>• 実際の課金機能をテストするには設定が必要です</Text>
            <Text style={styles.benefitItem}>• 現在は開発モードで動作しています</Text>
            <Text style={styles.benefitItem}>• アプリの他の機能は正常に動作します</Text>
          </View>
        </View>

        <View style={styles.plansContainer}>
          <Text style={styles.plansTitle}>設定方法</Text>
          <View style={styles.planCard}>
            <Text style={styles.planTitle}>RevenueCat設定</Text>
            <Text style={styles.planDescription}>
              .envファイルに以下を追加してください：{'\n'}
              EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_key{'\n'}
              EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_key
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.upgradeButton} 
            onPress={() => console.log('開発モード: RevenueCat未設定')}
          >
            <Text style={styles.upgradeButtonText}>開発モード（機能無効）</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>メンバーシップ</Text>
        
        {isActive ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusActive}>✓ アクティブなメンバー</Text>
            {subscriptionInfo && (
              <View style={styles.subscriptionDetails}>
                <Text style={styles.subscriptionText}>
                  プラン: {subscriptionInfo.productIdentifier}
                </Text>
                {subscriptionInfo.expirationDate && (
                  <Text style={styles.subscriptionText}>
                    期限: {subscriptionInfo.expirationDate.toLocaleDateString('ja-JP')}
                  </Text>
                )}
                <Text style={styles.subscriptionText}>
                  自動更新: {subscriptionInfo.willRenew ? 'オン' : 'オフ'}
                </Text>
              </View>
            )}
            
            {expiryInfo.isExpiring && (
              <View style={styles.expiryWarning}>
                <Text style={styles.expiryText}>
                  ⚠️ メンバーシップが{expiryInfo.daysLeft}日で期限切れです
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.statusInactive}>メンバーシップが必要です</Text>
        )}
      </View>

      {!isActive && (
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>メンバーになると</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>✓ すべての学習リソースにアクセス</Text>
            <Text style={styles.benefitItem}>✓ プレミアムコンテンツの利用</Text>
            <Text style={styles.benefitItem}>✓ 専用コミュニティへの参加</Text>
            <Text style={styles.benefitItem}>✓ 個別サポートの提供</Text>
            <Text style={styles.benefitItem}>✓ 広告なしの体験</Text>
          </View>
        </View>
      )}

      <View style={styles.plansContainer}>
        <Text style={styles.plansTitle}>プランを選択</Text>
        
        {availablePlans.monthly && renderPlanCard(
          availablePlans.monthly,
          '月額プラン',
          '毎月自動更新されます'
        )}
        
        {availablePlans.yearly && renderPlanCard(
          availablePlans.yearly,
          '年額プラン',
          '年間で最大20%お得！',
          true
        )}
        
        {availablePlans.lifetime && renderPlanCard(
          availablePlans.lifetime,
          '生涯プラン',
          '一度の支払いで永続利用'
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <Text style={styles.restoreButtonText}>購入履歴を復元</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>
          購入は自動的に更新されます。設定からいつでもキャンセルできます。
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusActive: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
  },
  statusInactive: {
    fontSize: 18,
    color: '#FF9800',
    fontWeight: '600',
  },
  subscriptionDetails: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
  },
  subscriptionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  expiryWarning: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  expiryText: {
    fontSize: 14,
    color: '#856404',
  },
  benefitsContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  benefitsList: {
    marginLeft: 8,
  },
  benefitItem: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    lineHeight: 24,
  },
  plansContainer: {
    margin: 20,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  recommendedCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f8f9ff',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  period: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  purchaseButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  recommendedButton: {
    backgroundColor: '#007AFF',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  restoreButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});