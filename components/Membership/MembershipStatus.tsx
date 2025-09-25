import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useMembership } from '../../contexts/MembershipContext';
import { router } from 'expo-router';

interface MembershipStatusProps {
  showUpgradeButton?: boolean;
  compact?: boolean;
}

export default function MembershipStatus({ 
  showUpgradeButton = true, 
  compact = false 
}: MembershipStatusProps) {
  const { isActive, membershipType, subscriptionInfo, expiryInfo } = useMembership();

  const handleUpgrade = () => {
    router.push('/membership');
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, isActive ? styles.activeText : styles.inactiveText]}>
            {isActive ? 'メンバー' : 'ビジター'}
          </Text>
        </View>
        
        {!isActive && showUpgradeButton && (
          <TouchableOpacity style={styles.compactUpgradeButton} onPress={handleUpgrade}>
            <Text style={styles.compactUpgradeText}>アップグレード</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusHeader}>
        <Text style={styles.title}>メンバーシップ状態</Text>
        <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, isActive ? styles.activeText : styles.inactiveText]}>
            {isActive ? 'アクティブ' : '未加入'}
          </Text>
        </View>
      </View>

      {isActive && subscriptionInfo ? (
        <View style={styles.subscriptionInfo}>
          <Text style={styles.subscriptionTitle}>現在のプラン</Text>
          <Text style={styles.subscriptionDetail}>
            {subscriptionInfo.productIdentifier.includes('monthly') ? '月額プラン' :
             subscriptionInfo.productIdentifier.includes('yearly') ? '年額プラン' :
             subscriptionInfo.productIdentifier.includes('lifetime') ? '生涯プラン' : 'プラン'}
          </Text>
          
          {subscriptionInfo.expirationDate && (
            <Text style={styles.subscriptionDetail}>
              期限: {subscriptionInfo.expirationDate.toLocaleDateString('ja-JP')}
            </Text>
          )}
          
          <Text style={styles.subscriptionDetail}>
            自動更新: {subscriptionInfo.willRenew ? 'オン' : 'オフ'}
          </Text>

          {expiryInfo.isExpiring && (
            <View style={styles.expiryWarning}>
              <Text style={styles.expiryText}>
                ⚠️ {expiryInfo.daysLeft}日で期限切れです
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.upgradeInfo}>
          <Text style={styles.upgradeTitle}>メンバーになりませんか？</Text>
          <Text style={styles.upgradeDescription}>
            プレミアム機能をすべて利用できます
          </Text>
          
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>• すべての学習リソースにアクセス</Text>
            <Text style={styles.benefitItem}>• プレミアムコンテンツの利用</Text>
            <Text style={styles.benefitItem}>• 専用コミュニティへの参加</Text>
          </View>
        </View>
      )}

      {showUpgradeButton && !isActive && (
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
          <Text style={styles.upgradeButtonText}>メンバーになる</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeBadge: {
    backgroundColor: '#e8f5e8',
  },
  inactiveBadge: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#4CAF50',
  },
  inactiveText: {
    color: '#856404',
  },
  subscriptionInfo: {
    marginBottom: 16,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subscriptionDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  expiryWarning: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  expiryText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  upgradeInfo: {
    marginBottom: 16,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  benefitsList: {
    marginLeft: 8,
  },
  benefitItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  compactUpgradeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  compactUpgradeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});