/**
 * Admin Post Management Component
 * Provides interface for administrators to manage posts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { adminPostManagementService, AdminPostSummary } from '../services/adminPostManagementService';
import { useAuth } from '../contexts/AuthContext';

interface AdminPostManagementProps {
  onClose?: () => void;
}

export const AdminPostManagement: React.FC<AdminPostManagementProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<AdminPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeInactive, setIncludeInactive] = useState(true);
  const [selectedPost, setSelectedPost] = useState<AdminPostSummary | null>(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [stats, setStats] = useState({
    totalPosts: 0,
    activePosts: 0,
    deletedPosts: 0,
    postsToday: 0,
    postsThisWeek: 0
  });

  useEffect(() => {
    if (user?.id) {
      loadPosts();
      loadStats();
    }
  }, [user?.id, includeInactive]);

  const loadPosts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await adminPostManagementService.getAllPostsForAdmin(
        user.id,
        50,
        0,
        includeInactive
      );
      setPosts(result.posts);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('エラー', '投稿の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;

    try {
      const statsData = await adminPostManagementService.getModerationStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    await loadStats();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!user?.id || !searchQuery.trim()) {
      loadPosts();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await adminPostManagementService.searchPostsForAdmin(
        user.id,
        searchQuery.trim(),
        includeInactive
      );
      setPosts(searchResults);
    } catch (error) {
      console.error('Error searching posts:', error);
      Alert.alert('エラー', '検索に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = (post: AdminPostSummary) => {
    Alert.alert(
      '投稿を削除',
      `「${post.content.substring(0, 50)}...」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => confirmDeletePost(post)
        }
      ]
    );
  };

  const confirmDeletePost = async (post: AdminPostSummary) => {
    if (!user?.id) return;

    try {
      await adminPostManagementService.deletePost(
        user.id,
        post.id,
        '管理者による削除'
      );
      
      Alert.alert('成功', '投稿を削除しました');
      loadPosts();
      loadStats();
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('エラー', '投稿の削除に失敗しました');
    }
  };

  const handleRestorePost = async (post: AdminPostSummary) => {
    if (!user?.id) return;

    try {
      await adminPostManagementService.restorePost(
        user.id,
        post.id,
        '管理者による復元'
      );
      
      Alert.alert('成功', '投稿を復元しました');
      loadPosts();
      loadStats();
    } catch (error) {
      console.error('Error restoring post:', error);
      Alert.alert('エラー', '投稿の復元に失敗しました');
    }
  };

  const renderPostItem = ({ item }: { item: AdminPostSummary }) => (
    <View style={styles.postItem}>
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.authorName}</Text>
          <Text style={styles.authorEmail}>{item.authorEmail}</Text>
        </View>
        <View style={styles.postStatus}>
          <Text style={[
            styles.statusText,
            { color: item.isActive ? '#4CAF50' : '#F44336' }
          ]}>
            {item.isActive ? 'アクティブ' : '削除済み'}
          </Text>
        </View>
      </View>

      <Text style={styles.postContent} numberOfLines={3}>
        {item.content}
      </Text>

      <View style={styles.postMeta}>
        <Text style={styles.metaText}>
          👍 {item.likesCount} | 💬 {item.commentsCount}
        </Text>
        <Text style={styles.metaText}>
          {item.createdAt.toLocaleDateString('ja-JP')}
        </Text>
      </View>

      {item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <Text key={index} style={styles.tag}>#{tag}</Text>
          ))}
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => {
            setSelectedPost(item);
            setShowPostDetail(true);
          }}
        >
          <Text style={styles.detailButtonText}>詳細</Text>
        </TouchableOpacity>

        {item.isActive ? (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePost(item)}
          >
            <Text style={styles.deleteButtonText}>削除</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={() => handleRestorePost(item)}
          >
            <Text style={styles.restoreButtonText}>復元</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPostDetail = () => (
    <Modal
      visible={showPostDetail}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>投稿詳細</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowPostDetail(false)}
          >
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>

        {selectedPost && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>投稿者</Text>
              <Text style={styles.detailValue}>{selectedPost.authorName}</Text>
              <Text style={styles.detailSubValue}>{selectedPost.authorEmail}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>投稿内容</Text>
              <Text style={styles.detailValue}>{selectedPost.content}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>統計</Text>
              <Text style={styles.detailValue}>
                いいね: {selectedPost.likesCount} | コメント: {selectedPost.commentsCount}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>作成日時</Text>
              <Text style={styles.detailValue}>
                {selectedPost.createdAt.toLocaleString('ja-JP')}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>更新日時</Text>
              <Text style={styles.detailValue}>
                {selectedPost.updatedAt.toLocaleString('ja-JP')}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>ステータス</Text>
              <Text style={[
                styles.detailValue,
                { color: selectedPost.isActive ? '#4CAF50' : '#F44336' }
              ]}>
                {selectedPost.isActive ? 'アクティブ' : '削除済み'}
              </Text>
            </View>

            {selectedPost.tags.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>タグ</Text>
                <View style={styles.tagsContainer}>
                  {selectedPost.tags.map((tag, index) => (
                    <Text key={index} style={styles.tag}>#{tag}</Text>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>投稿管理</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalPosts}</Text>
          <Text style={styles.statLabel}>総投稿数</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.activePosts}</Text>
          <Text style={styles.statLabel}>アクティブ</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.deletedPosts}</Text>
          <Text style={styles.statLabel}>削除済み</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.postsToday}</Text>
          <Text style={styles.statLabel}>今日</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="投稿を検索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>検索</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>削除済み投稿も表示</Text>
        <Switch
          value={includeInactive}
          onValueChange={setIncludeInactive}
        />
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? '読み込み中...' : '投稿が見つかりません'}
            </Text>
          </View>
        }
      />

      {renderPostDetail()}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row' as const,
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center' as const,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold' as const,
  },
  filterContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 16,
    color: '#333',
  },
  postItem: {
    backgroundColor: '#fff',
    margin: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  authorEmail: {
    fontSize: 12,
    color: '#666',
  },
  postStatus: {
    alignItems: 'flex-end' as const,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  postMeta: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
  },
  detailButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  detailButtonText: {
    color: '#333',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  restoreButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  restoreButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
};

export default AdminPostManagement;