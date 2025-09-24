import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import AuthGuard from '../../components/AuthGuard';
import AnnouncementEditor from '../../components/AnnouncementEditor';
import announcementService, { Announcement } from '../../services/announcementService';
import { useAuth } from '../../contexts/AuthContext';

export default function AnnouncementManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>();
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    featured: 0,
    byType: {} as Record<string, number>,
    byPriority: {} as Record<string, number>
  });

  useEffect(() => {
    loadAnnouncements();
    loadStats();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await announcementService.getAllAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      Alert.alert('エラー', 'お知らせの読み込みに失敗しました。');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await announcementService.getAnnouncementStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnnouncements();
    loadStats();
  };

  const handleCreateNew = () => {
    setEditingAnnouncement(undefined);
    setShowEditor(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowEditor(true);
  };

  const handleSave = (announcement: Announcement) => {
    setShowEditor(false);
    setEditingAnnouncement(undefined);
    loadAnnouncements();
    loadStats();
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingAnnouncement(undefined);
  };

  const handleTogglePublished = async (announcement: Announcement) => {
    try {
      await announcementService.togglePublished(announcement.id);
      loadAnnouncements();
      loadStats();
    } catch (error) {
      console.error('Failed to toggle published status:', error);
      Alert.alert('エラー', '公開状態の変更に失敗しました。');
    }
  };

  const handleToggleFeatured = async (announcement: Announcement) => {
    try {
      await announcementService.toggleFeatured(announcement.id);
      loadAnnouncements();
      loadStats();
    } catch (error) {
      console.error('Failed to toggle featured status:', error);
      Alert.alert('エラー', '注目状態の変更に失敗しました。');
    }
  };

  const handleDelete = (announcement: Announcement) => {
    Alert.alert(
      '削除確認',
      `「${announcement.title}」を削除しますか？この操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await announcementService.deleteAnnouncement(announcement.id);
              loadAnnouncements();
              loadStats();
            } catch (error) {
              console.error('Failed to delete announcement:', error);
              Alert.alert('エラー', 'お知らせの削除に失敗しました。');
            }
          }
        }
      ]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'news': return '📢';
      case 'update': return '🔄';
      case 'event': return '🎉';
      case 'maintenance': return '🔧';
      default: return '📝';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'news': return 'ニュース';
      case 'update': return 'アップデート';
      case 'event': return 'イベント';
      case 'maintenance': return 'メンテナンス';
      default: return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AuthGuard requireAuth={true} requiredRole="admin">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>お知らせ管理</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateNew}
          >
            <Text style={styles.createButtonText}>+ 新規作成</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>総数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.published}</Text>
            <Text style={styles.statLabel}>公開中</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.featured}</Text>
            <Text style={styles.statLabel}>注目</Text>
          </View>
        </View>

        {/* Announcements List */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {announcements.map((announcement) => (
            <View key={announcement.id} style={[
              styles.announcementCard,
              announcement.featured && styles.featuredCard
            ]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardIcon}>{getTypeIcon(announcement.type)}</Text>
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardTitle}>{announcement.title}</Text>
                    <Text style={styles.cardMeta}>
                      {announcement.author_name} • {formatDate(announcement.created_at)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardBadges}>
                  <View style={[
                    styles.typeBadge,
                    { backgroundColor: getPriorityColor(announcement.priority) + '20' }
                  ]}>
                    <Text style={[
                      styles.typeBadgeText,
                      { color: getPriorityColor(announcement.priority) }
                    ]}>
                      {getTypeText(announcement.type)}
                    </Text>
                  </View>
                  {announcement.published && (
                    <View style={styles.publishedBadge}>
                      <Text style={styles.publishedBadgeText}>公開中</Text>
                    </View>
                  )}
                  {announcement.featured && (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeText}>注目</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.cardContent} numberOfLines={2}>
                {announcement.content}
              </Text>

              {announcement.expires_at && (
                <Text style={styles.expiryText}>
                  有効期限: {formatDate(announcement.expires_at)}
                </Text>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(announcement)}
                >
                  <Text style={styles.actionButtonText}>編集</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    announcement.published ? styles.unpublishButton : styles.publishButton
                  ]}
                  onPress={() => handleTogglePublished(announcement)}
                >
                  <Text style={[
                    styles.actionButtonText,
                    announcement.published ? styles.unpublishButtonText : styles.publishButtonText
                  ]}>
                    {announcement.published ? '非公開' : '公開'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    announcement.featured ? styles.unfeaturedButton : styles.featuredActionButton
                  ]}
                  onPress={() => handleToggleFeatured(announcement)}
                >
                  <Text style={[
                    styles.actionButtonText,
                    announcement.featured ? styles.unfeaturedButtonText : styles.featuredActionButtonText
                  ]}>
                    {announcement.featured ? '注目解除' : '注目'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(announcement)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>削除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {announcements.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>お知らせがありません</Text>
              <TouchableOpacity
                style={styles.emptyCreateButton}
                onPress={handleCreateNew}
              >
                <Text style={styles.emptyCreateButtonText}>最初のお知らせを作成</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Editor Modal */}
        <Modal
          visible={showEditor}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <AnnouncementEditor
            announcement={editingAnnouncement}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </Modal>
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  announcementCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cardMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  cardBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  publishedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  publishedBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  featuredBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'white',
  },
  cardContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  expiryText: {
    fontSize: 12,
    color: '#f59e0b',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  publishButton: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  publishButtonText: {
    color: '#16a34a',
  },
  unpublishButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  unpublishButtonText: {
    color: '#f59e0b',
  },
  featuredActionButton: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  featuredActionButtonText: {
    color: '#3b82f6',
  },
  unfeaturedButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#6b7280',
  },
  unfeaturedButtonText: {
    color: '#6b7280',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 16,
  },
  emptyCreateButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyCreateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});