import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import AuthGuard from '../components/AuthGuard';
import GroupCard from '../components/GroupCard';
import AdminGroupCreator from '../components/AdminGroupCreator';
import { useAuth } from '../contexts/AuthContext';
import { communityFeedService, Post } from '../services/communityFeedService';
import { membersService, Member } from '../services/membersService';
import { groupsService, Group } from '../services/groupsService';
import { permissionManager } from '../services/permissionManager';

// Remove old interfaces as we're using the service interfaces now

export default function Community() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'groups'>('feed');
  const [newPost, setNewPost] = useState('');
  
  // State for posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for members
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  
  // State for groups
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  
  // Permission states
  const [canCreatePost, setCanCreatePost] = useState(false);
  const [canViewMembers, setCanViewMembers] = useState(false);
  const [canManageGroups, setCanManageGroups] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  
  // Admin group creation state
  const [showGroupCreator, setShowGroupCreator] = useState(false);

  // Load data and permissions on component mount and user change
  useEffect(() => {
    loadPermissions();
    if (activeTab === 'feed') {
      loadPosts();
    } else if (activeTab === 'members') {
      loadMembers();
    } else if (activeTab === 'groups') {
      loadGroups();
    }
  }, [user, activeTab]);

  const loadPermissions = async () => {
    if (!user?.id) {
      setCanCreatePost(false);
      setCanViewMembers(false);
      setCanManageGroups(false);
      setPermissionsLoading(false);
      return;
    }

    try {
      setPermissionsLoading(true);
      const [postPermission, memberPermission, groupPermission] = await Promise.all([
        permissionManager.canCreatePost(user.id),
        permissionManager.canViewMembers(user.id),
        permissionManager.canManageGroups(user.id)
      ]);
      
      setCanCreatePost(postPermission.allowed);
      setCanViewMembers(memberPermission.allowed);
      setCanManageGroups(groupPermission.allowed);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setCanCreatePost(false);
      setCanViewMembers(false);
      setCanManageGroups(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const loadPosts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setPostsLoading(true);
      }
      
      const response = await communityFeedService.getPosts(user?.id);
      setPosts(response.posts);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('エラー', '投稿の読み込みに失敗しました');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setPostsLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'feed') {
      loadPosts(true);
    } else if (activeTab === 'members') {
      loadMembers();
    } else if (activeTab === 'groups') {
      loadGroups();
    }
  };

  const loadMembers = async () => {
    if (!canViewMembers && !user?.id) {
      return;
    }

    try {
      setMembersLoading(true);
      const response = await membersService.getActiveMembers(user?.id);
      setMembers(response.members);
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('エラー', 'メンバーの読み込みに失敗しました');
    } finally {
      setMembersLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await groupsService.getAllGroups();
      setGroups(response.groups);
    } catch (error) {
      console.error('Error loading groups:', error);
      // Don't show alert for groups loading error as it might be expected
      // if the database is not set up yet
      console.warn('Groups loading failed, this might be expected if database is not set up');
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user?.id) {
      Alert.alert('ログインが必要です', 'いいねをするにはログインしてください');
      return;
    }

    try {
      const result = await communityFeedService.togglePostLike(user.id, postId);
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, isLikedByUser: result.isLiked, likesCount: result.likesCount }
            : post
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      const errorMessage = error instanceof Error ? error.message : 'いいねの処理に失敗しました';
      
      if (errorMessage.includes('temporarily unavailable')) {
        // Show a less intrusive message for temporary unavailability
        console.warn('Like functionality temporarily unavailable');
        // Don't show alert for this case, just log it
      } else if (errorMessage.includes('Please sign in')) {
        Alert.alert('ログインが必要です', 'いいねをするにはログインしてください');
      } else {
        Alert.alert('エラー', 'いいね機能で問題が発生しました。後でもう一度お試しください。');
      }
    }
  };

  const handleCommentPost = (postId: string) => {
    // TODO: Implement comment functionality
    Alert.alert('開発中', 'コメント機能は開発中です');
  };

  const handleConnectMember = (memberId: string) => {
    // TODO: Implement connection functionality
    Alert.alert('開発中', 'つながり機能は開発中です');
  };

  const handleJoinGroup = (groupId: string) => {
    // This is for internal group joining (not external links)
    // TODO: Implement internal group membership functionality
    Alert.alert('開発中', 'グループメンバーシップ機能は開発中です');
  };

  const handlePostSubmit = async () => {
    if (!newPost.trim()) return;
    
    if (!user?.id) {
      Alert.alert('ログインが必要です', '投稿するにはログインしてください');
      return;
    }

    try {
      setPostSubmitting(true);
      
      // Extract tags from content (simple implementation)
      const tags = newPost.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];
      
      const post = await communityFeedService.createPost(user.id, {
        content: newPost.trim(),
        tags
      });
      
      // Add new post to the beginning of the list
      setPosts(prevPosts => [post, ...prevPosts]);
      setNewPost('');
      
      Alert.alert('成功', '投稿が作成されました！');
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert('エラー', error.message || '投稿の作成に失敗しました');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user?.id) return;

    Alert.alert(
      '投稿を削除',
      'この投稿を削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityFeedService.deletePost(user.id, postId);
              setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
              Alert.alert('成功', '投稿が削除されました');
            } catch (error: any) {
              console.error('Error deleting post:', error);
              Alert.alert('エラー', error.message || '投稿の削除に失敗しました');
            }
          }
        }
      ]
    );
  };

  const renderFeed = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#3b82f6']}
          tintColor="#3b82f6"
        />
      }
    >
      {/* Permission-based Post Creation Form - Requirements: 2.3 */}
      {user && canCreatePost && !permissionsLoading ? (
        <View style={styles.newPostContainer}>
          <Text style={styles.newPostTitle}>💭 何を共有しますか？</Text>
          <Text style={styles.memberOnlyBadge}>👥 メンバー限定機能</Text>
          <TextInput
            style={styles.newPostInput}
            placeholder="学習の進捗、質問、発見を共有しましょう... (#タグ を使ってカテゴリ分けできます)"
            multiline
            value={newPost}
            onChangeText={setNewPost}
            editable={!postSubmitting}
          />
          <TouchableOpacity 
            style={[
              styles.postButton, 
              (!newPost.trim() || postSubmitting) && styles.postButtonDisabled
            ]}
            onPress={handlePostSubmit}
            disabled={!newPost.trim() || postSubmitting}
          >
            {postSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.postButtonText}>投稿する</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : user && !canCreatePost && !permissionsLoading ? (
        <View style={styles.restrictedAccessContainer}>
          <Text style={styles.restrictedAccessTitle}>🔒 メンバー限定機能</Text>
          <Text style={styles.restrictedAccessText}>
            投稿機能はメンバーのみご利用いただけます。現在のアカウントには投稿権限がありません。
          </Text>
          <Text style={styles.restrictedAccessSubtext}>
            メンバーシップの詳細については管理者にお問い合わせください。
          </Text>
        </View>
      ) : !user ? (
        <View style={styles.visitorNoticeContainer}>
          <Text style={styles.visitorNoticeTitle}>👋 コミュニティへようこそ</Text>
          <Text style={styles.visitorNoticeText}>
            投稿やメンバーとの交流には会員登録が必要です。
          </Text>
          <TouchableOpacity 
            style={styles.loginPromptButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginPromptButtonText}>ログイン・登録</Text>
          </TouchableOpacity>
        </View>
      ) : permissionsLoading ? (
        <View style={styles.loadingPermissionsContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingPermissionsText}>権限を確認中...</Text>
        </View>
      ) : null}

      {/* Loading indicator */}
      {postsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>投稿を読み込み中...</Text>
        </View>
      ) : (
        <>
          {/* Posts */}
          {posts.length > 0 ? (
            posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.authorInfo}>
                    <Text style={styles.avatar}>{post.authorAvatar || '👤'}</Text>
                    <View style={styles.authorDetails}>
                      <Text style={styles.authorName}>{post.authorName}</Text>
                      <Text style={styles.authorCountry}>
                        {formatTimestamp(post.createdAt)}
                        {post.updatedAt.getTime() !== post.createdAt.getTime() && ' (編集済み)'}
                      </Text>
                    </View>
                  </View>
                  {/* Delete button for own posts */}
                  {user && (user.id === post.userId) && (
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeletePost(post.id)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <Text style={styles.postContent}>{formatPostContent(post.content)}</Text>
                
                {/* Tags */}
                {post.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {post.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Actions */}
                <View style={styles.postActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleLikePost(post.id)}
                  >
                    <Text style={[styles.actionIcon, post.isLikedByUser && styles.likedIcon]}>
                      {post.isLikedByUser ? '❤️' : '🤍'}
                    </Text>
                    <Text style={styles.actionText}>{post.likesCount}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleCommentPost(post.id)}
                  >
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionText}>{post.commentsCount}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionIcon}>🔗</Text>
                    <Text style={styles.actionText}>共有</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>📝 まだ投稿がありません</Text>
              <Text style={styles.emptyStateText}>
                最初の投稿を作成して、コミュニティを盛り上げましょう！
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    });
  };

  const renderMembers = () => {
    if (!user) {
      return (
        <ScrollView style={styles.tabContent}>
          <View style={styles.visitorNoticeContainer}>
            <Text style={styles.visitorNoticeTitle}>👋 メンバーリストを見るには</Text>
            <Text style={styles.visitorNoticeText}>
              メンバーリストを表示するにはログインが必要です。
            </Text>
            <TouchableOpacity 
              style={styles.loginPromptButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginPromptButtonText}>ログイン・登録</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    if (!canViewMembers && !permissionsLoading) {
      return (
        <ScrollView style={styles.tabContent}>
          <View style={styles.visitorNoticeContainer}>
            <Text style={styles.visitorNoticeTitle}>🔒 メンバーリストへのアクセス</Text>
            <Text style={styles.visitorNoticeText}>
              メンバーリストの表示にはメンバー権限が必要です。管理者にお問い合わせください。
            </Text>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView 
        style={styles.tabContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        <View style={styles.membersHeader}>
          <Text style={styles.membersTitle}>🌍 コミュニティメンバー</Text>
          <Text style={styles.membersSubtitle}>実際にデータベースに登録されているメンバーとつながりましょう</Text>
          <View style={styles.membersBadge}>
            <Text style={styles.membersBadgeText}>📊 実際のユーザーデータ</Text>
          </View>
        </View>
        
        {membersLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>メンバーを読み込み中...</Text>
          </View>
        ) : members.length > 0 ? (
          members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <View style={styles.memberInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.memberAvatar}>
                      {member.avatarUrl ? '👤' : '👨‍💻'}
                    </Text>
                    {member.isOnline && <View style={styles.onlineIndicator} />}
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{member.displayName}</Text>
                    <Text style={styles.memberCountry}>
                      {formatMemberJoinDate(member.joinedAt)}
                    </Text>
                    <Text style={styles.mutualConnections}>
                      役割: {member.roles.join(', ') || 'メンバー'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.connectButton}
                  onPress={() => handleConnectMember(member.id)}
                >
                  <Text style={styles.connectButtonText}>つながる</Text>
                </TouchableOpacity>
              </View>
              
              {/* Skills - Show placeholder for now */}
              {member.skills && member.skills.length > 0 && (
                <View style={styles.skillsContainer}>
                  <Text style={styles.skillsLabel}>スキル:</Text>
                  <View style={styles.skillsList}>
                    {member.skills.map((skill, index) => (
                      <View key={index} style={styles.skillTag}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>👥 登録メンバーが見つかりません</Text>
            <Text style={styles.emptyStateText}>
              現在、データベースに登録されているアクティブなメンバーがいません。
              {'\n'}新しいメンバーの登録をお待ちください。
            </Text>
            <View style={styles.databaseInfoBadge}>
              <Text style={styles.databaseInfoText}>
                💾 データベースから実際のユーザー情報を表示
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  const formatMemberJoinDate = (date: Date): string => {
    return `${date.toLocaleDateString('ja-JP')} に参加`;
  };

  const formatPostContent = (content: string): string => {
    // Simple content formatting - in a real app you might want more sophisticated formatting
    return content
      .replace(/\n\n+/g, '\n\n') // Normalize multiple line breaks
      .trim();
  };

  const renderGroups = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#3b82f6']}
          tintColor="#3b82f6"
        />
      }
    >
      <View style={styles.groupsHeader}>
        <Text style={styles.groupsTitle}>👥 コミュニティグループ</Text>
        <Text style={styles.groupsSubtitle}>
          データベースから取得したグループに参加して、メンバーと交流しましょう
        </Text>
        <View style={styles.groupsBadge}>
          <Text style={styles.groupsBadgeText}>🗄️ データベース連携</Text>
        </View>
      </View>
      
      {/* Admin-only Group Creation Interface - Requirements: 6.3 */}
      {user && canManageGroups && !permissionsLoading && (
        <View style={styles.adminGroupSection}>
          <Text style={styles.adminSectionTitle}>🔧 管理者専用機能</Text>
          <TouchableOpacity 
            style={styles.createGroupButton}
            onPress={() => setShowGroupCreator(true)}
          >
            <Text style={styles.createGroupButtonText}>➕ 新しいグループを作成</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {groupsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>グループを読み込み中...</Text>
        </View>
      ) : groups.length > 0 ? (
        groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onJoinGroup={handleJoinGroup}
          />
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>👥 グループが見つかりません</Text>
          <Text style={styles.emptyStateText}>
            現在、データベースにアクティブなグループが登録されていません。
            {'\n'}管理者がグループを作成するまでお待ちください。
          </Text>
          <View style={styles.databaseInfoBadge}>
            <Text style={styles.databaseInfoText}>
              🗄️ データベースから実際のグループ情報を表示
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => loadGroups()}
          >
            <Text style={styles.refreshButtonText}>再読み込み</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  return (
    <AuthGuard requireAuth={false}>
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            フィード
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            メンバー
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
            グループ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'feed' && renderFeed()}
      {activeTab === 'members' && renderMembers()}
      {activeTab === 'groups' && renderGroups()}
      
      {/* Admin Group Creator Modal */}
      <AdminGroupCreator
        visible={showGroupCreator}
        onClose={() => setShowGroupCreator(false)}
        onGroupCreated={() => {
          loadGroups(); // Refresh groups list
        }}
      />
    </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  // New Post Styles
  newPostContainer: {
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
    borderLeftColor: '#10b981',
  },
  newPostTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  memberOnlyBadge: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  newPostInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  postButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  postButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  postButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Visitor Notice Styles
  visitorNoticeContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  restrictedAccessContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  restrictedAccessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  restrictedAccessText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
    marginBottom: 8,
  },
  restrictedAccessSubtext: {
    fontSize: 12,
    color: '#a16207',
    fontStyle: 'italic',
  },
  loadingPermissionsContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPermissionsText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  visitorNoticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  visitorNoticeText: {
    fontSize: 14,
    color: '#3730a3',
    lineHeight: 20,
    marginBottom: 12,
  },
  loginPromptButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  loginPromptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Post Styles
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 32,
    marginRight: 12,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  authorCountry: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 16,
  },
  likedIcon: {
    color: '#ef4444',
  },
  actionText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  // Members Styles
  membersHeader: {
    marginBottom: 20,
  },
  membersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  membersSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  membersBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  membersBadgeText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  databaseInfoBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'center',
  },
  databaseInfoText: {
    fontSize: 11,
    color: '#0277bd',
    fontWeight: '500',
    textAlign: 'center',
  },
  memberCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  memberAvatar: {
    fontSize: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: 'white',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  memberCountry: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  mutualConnections: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  skillsContainer: {
    marginTop: 8,
  },
  skillsLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skillTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 10,
    color: '#374151',
  },
  // Groups Styles
  groupsHeader: {
    marginBottom: 20,
  },
  groupsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  groupsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  groupsBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  groupsBadgeText: {
    fontSize: 12,
    color: '#0277bd',
    fontWeight: '600',
  },
  adminGroupSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  adminSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  createGroupButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  createGroupButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  groupStat: {
    fontSize: 12,
    color: '#9ca3af',
  },
  joinGroupButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinGroupButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Loading and empty state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Delete button styles
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  // Refresh button styles
  refreshButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});