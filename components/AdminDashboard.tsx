import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { groupsService, Group } from '../services/groupsService';
import { dataCleanupService, CompleteCleanupResult } from '../services/dataCleanupService';
import { permissionManager } from '../services/permissionManager';
import AdminGroupCreator from './AdminGroupCreator';

interface AdminDashboardProps {
  onNavigateToGroups?: () => void;
}

export default function AdminDashboard({ onNavigateToGroups }: AdminDashboardProps) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [systemStats, setSystemStats] = useState({
    postsCount: 0,
    groupsCount: 0,
    postLikesCount: 0,
    groupMembershipsCount: 0
  });

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (hasAdminAccess) {
      loadData();
    }
  }, [hasAdminAccess, user]);

  const checkAdminAccess = async () => {
    if (!user?.id) {
      setHasAdminAccess(false);
      return;
    }

    try {
      const permission = await permissionManager.canManageGroups(user.id);
      setHasAdminAccess(permission.allowed);
    } catch (error) {
      console.error('Error checking admin access:', error);
      setHasAdminAccess(false);
    }
  };

  const loadData = async () => {
    if (!user?.id) return;

    try {
      const [groupsResponse, cleanupStatus] = await Promise.all([
        groupsService.getAllGroups(),
        dataCleanupService.getCleanupStatus()
      ]);

      setGroups(groupsResponse.groups);
      setSystemStats({
        postsCount: cleanupStatus.postsCount,
        groupsCount: cleanupStatus.groupsCount,
        postLikesCount: cleanupStatus.postLikesCount,
        groupMembershipsCount: cleanupStatus.groupMembershipsCount
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDataCleanup = () => {
    Alert.alert(
      '⚠️ データクリーンアップ',
      'この操作により、すべての投稿とグループが削除されます。この操作は取り消せません。\n\n続行しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '実行',
          style: 'destructive',
          onPress: performDataCleanup
        }
      ]
    );
  };

  const performDataCleanup = async () => {
    if (!user?.id) {
      Alert.alert('エラー', 'ユーザー情報が取得できません');
      return;
    }

    setCleanupLoading(true);
    try {
      const result: CompleteCleanupResult = await dataCleanupService.performCompleteCleanup(user.id);
      
      if (result.overallSuccess) {
        Alert.alert(
          '✅ クリーンアップ完了',
          `投稿: ${result.postsCleanup.deletedCount}件削除\n` +
          `グループ: ${result.groupsCleanup.deletedCount}件削除\n` +
          `データ整合性: ${result.integrityValidation.isValid ? '正常' : '問題あり'}`,
          [{ text: 'OK', onPress: () => loadData() }]
        );
      } else {
        const issues = [
          !result.postsCleanup.success && `投稿削除エラー: ${result.postsCleanup.message}`,
          !result.groupsCleanup.success && `グループ削除エラー: ${result.groupsCleanup.message}`,
          !result.integrityValidation.isValid && `整合性問題: ${result.integrityValidation.issues.join(', ')}`
        ].filter(Boolean).join('\n');

        Alert.alert('⚠️ クリーンアップ完了（一部エラー）', issues);
        loadData();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      Alert.alert(
        'エラー',
        error instanceof Error ? error.message : 'クリーンアップに失敗しました'
      );
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleCreateInitialGroups = async () => {
    if (!user?.id) {
      Alert.alert('エラー', 'ユーザー情報が取得できません');
      return;
    }

    Alert.alert(
      '初期グループ作成',
      '8つの指定されたグループを作成しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '作成',
          onPress: async () => {
            setLoading(true);
            try {
              const initialGroups = [
                {
                  name: 'ピアラーニングハブ生成AI部',
                  description: '生成AIの活用と学習に関するディスカッション',
                  externalLink: 'https://example.com/ai-group'
                },
                {
                  name: 'さぬきピアラーニングハブゴルフ部',
                  description: 'ゴルフを通じた交流とネットワーキング',
                  externalLink: 'https://example.com/golf-group'
                },
                {
                  name: 'さぬきピアラーニングハブ英語部',
                  description: '英語学習とスキル向上のためのグループ',
                  externalLink: 'https://example.com/english-group'
                },
                {
                  name: 'WAOJEさぬきピアラーニングハブ交流会参加者',
                  description: 'WAOJE交流会参加者のネットワーキング',
                  externalLink: 'https://example.com/waoje-group'
                },
                {
                  name: '香川イノベーションベース',
                  description: 'イノベーションと起業に関する活動',
                  externalLink: 'https://example.com/innovation-group'
                },
                {
                  name: 'さぬきピアラーニングハブ居住者',
                  description: '地域居住者のコミュニティ',
                  externalLink: 'https://example.com/residents-group'
                },
                {
                  name: '英語キャンプ卒業者',
                  description: '英語キャンプ卒業者の継続学習コミュニティ',
                  externalLink: 'https://example.com/camp-alumni-group'
                }
              ];

              const createdGroups = await groupsService.createMultipleGroups(user.id, initialGroups);
              
              Alert.alert(
                '成功',
                `${createdGroups.length}個のグループが作成されました`,
                [{ text: 'OK', onPress: () => loadData() }]
              );
            } catch (error) {
              console.error('Error creating initial groups:', error);
              Alert.alert(
                'エラー',
                error instanceof Error ? error.message : '初期グループの作成に失敗しました'
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteGroup = (group: Group) => {
    Alert.alert(
      'グループ削除',
      `「${group.name}」を削除しますか？この操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            
            try {
              await groupsService.deleteGroup(user.id, group.id);
              Alert.alert('成功', 'グループが削除されました');
              loadData();
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert(
                'エラー',
                error instanceof Error ? error.message : 'グループの削除に失敗しました'
              );
            }
          }
        }
      ]
    );
  };

  if (!hasAdminAccess) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedIcon}>🚫</Text>
        <Text style={styles.accessDeniedTitle}>アクセス拒否</Text>
        <Text style={styles.accessDeniedText}>
          管理者ダッシュボードにアクセスする権限がありません。
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* System Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>📊 システム統計</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{systemStats.postsCount}</Text>
            <Text style={styles.statLabel}>投稿数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{systemStats.groupsCount}</Text>
            <Text style={styles.statLabel}>グループ数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{systemStats.postLikesCount}</Text>
            <Text style={styles.statLabel}>いいね数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{systemStats.groupMembershipsCount}</Text>
            <Text style={styles.statLabel}>メンバーシップ</Text>
          </View>
        </View>
      </View>

      {/* Data Cleanup Section */}
      <View style={styles.cleanupContainer}>
        <Text style={styles.sectionTitle}>🧹 データクリーンアップ</Text>
        <Text style={styles.cleanupDescription}>
          すべての投稿とグループを削除し、データベースをリセットします。
        </Text>
        <TouchableOpacity
          style={[styles.cleanupButton, cleanupLoading && styles.disabledButton]}
          onPress={handleDataCleanup}
          disabled={cleanupLoading}
        >
          {cleanupLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.cleanupButtonIcon}>🗑️</Text>
              <Text style={styles.cleanupButtonText}>データクリーンアップ実行</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Group Management Section */}
      <View style={styles.groupsContainer}>
        <View style={styles.groupsHeader}>
          <Text style={styles.sectionTitle}>👥 グループ管理</Text>
          <View style={styles.groupActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCreateInitialGroups}
            >
              <Text style={styles.actionButtonText}>初期グループ作成</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => setShowGroupCreator(true)}
            >
              <Text style={[styles.actionButtonText, styles.primaryButtonText]}>+ 新規作成</Text>
            </TouchableOpacity>
          </View>
        </View>

        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyStateTitle}>グループがありません</Text>
            <Text style={styles.emptyStateText}>
              「新規作成」または「初期グループ作成」ボタンからグループを作成してください
            </Text>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group) => (
              <View key={group.id} style={styles.groupCard}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  {group.description && (
                    <Text style={styles.groupDescription}>{group.description}</Text>
                  )}
                  <View style={styles.groupMeta}>
                    <Text style={styles.groupMetaText}>
                      👥 {group.memberCount} メンバー
                    </Text>
                    <Text style={styles.groupMetaText}>
                      📅 {group.createdAt.toLocaleDateString('ja-JP')}
                    </Text>
                  </View>
                  {group.externalLink && (
                    <Text style={styles.externalLink}>🔗 {group.externalLink}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteGroup(group)}
                >
                  <Text style={styles.deleteButtonText}>削除</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <AdminGroupCreator
        visible={showGroupCreator}
        onClose={() => setShowGroupCreator(false)}
        onGroupCreated={loadData}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 40,
  },
  accessDeniedIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  // Stats Styles
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Cleanup Styles
  cleanupContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  cleanupDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  cleanupButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cleanupButtonIcon: {
    fontSize: 16,
  },
  cleanupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Groups Styles
  groupsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  primaryButton: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButtonText: {
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  groupsList: {
    gap: 12,
  },
  groupCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  groupInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  groupMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  groupMetaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  externalLink: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
});