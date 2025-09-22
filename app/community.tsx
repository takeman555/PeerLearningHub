import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import AuthGuard from '../components/AuthGuard';
import { useAuth } from '../contexts/AuthContext';

interface CommunityPost {
  id: number;
  author: string;
  avatar: string;
  country: string;
  timestamp: string;
  content: string;
  likes: number;
  comments: number;
  tags: string[];
  isLiked?: boolean;
}

interface CommunityMember {
  id: number;
  name: string;
  country: string;
  avatar: string;
  skills: string[];
  isOnline: boolean;
  mutualConnections: number;
}

export default function Community() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'groups'>('feed');
  const [newPost, setNewPost] = useState('');

  const [posts] = useState<CommunityPost[]>([
    {
      id: 1,
      author: 'Maria Santos',
      avatar: '🇧🇷',
      country: 'ブラジル',
      timestamp: '2時間前',
      content: 'React Nativeプロジェクトでアニメーションを実装中です。Reanimated 3の新機能を試していますが、とても滑らかで感動しています！皆さんはどんなアニメーションライブラリを使っていますか？',
      likes: 24,
      comments: 8,
      tags: ['React Native', 'Animation', 'Reanimated'],
      isLiked: false
    },
    {
      id: 2,
      author: 'Ahmed Hassan',
      avatar: '🇪🇬',
      country: 'エジプト',
      timestamp: '4時間前',
      content: 'TypeScriptの型システムについて深く学んでいます。Conditional Typesの概念が最初は難しかったですが、実際に使ってみると非常に強力ですね。型安全性が格段に向上しました。',
      likes: 31,
      comments: 12,
      tags: ['TypeScript', 'Types', 'Programming'],
      isLiked: true
    },
    {
      id: 3,
      author: 'Sophie Chen',
      avatar: '🇫🇷',
      country: 'フランス',
      timestamp: '6時間前',
      content: '今日のピア学習セッションでWeb3開発について学びました。スマートコントラクトの概念が理解できて、ブロックチェーン技術の可能性を感じています。次はDAppを作ってみたいです！',
      likes: 18,
      comments: 5,
      tags: ['Web3', 'Blockchain', 'Smart Contracts'],
      isLiked: false
    },
    {
      id: 4,
      author: 'Raj Patel',
      avatar: '🇮🇳',
      country: 'インド',
      timestamp: '8時間前',
      content: 'AI/MLプロジェクトでPythonのscikit-learnを使って機械学習モデルを構築しています。データの前処理が思った以上に重要だということを実感しました。良いデータセットの見つけ方について教えてください！',
      likes: 27,
      comments: 15,
      tags: ['Python', 'Machine Learning', 'Data Science'],
      isLiked: true
    }
  ]);

  const [members] = useState<CommunityMember[]>([
    {
      id: 1,
      name: 'Elena Rodriguez',
      country: 'スペイン',
      avatar: '🇪🇸',
      skills: ['React', 'Node.js', 'GraphQL'],
      isOnline: true,
      mutualConnections: 5
    },
    {
      id: 2,
      name: 'Yuki Tanaka',
      country: '日本',
      avatar: '🇯🇵',
      skills: ['Flutter', 'Dart', 'Firebase'],
      isOnline: true,
      mutualConnections: 3
    },
    {
      id: 3,
      name: 'David Kim',
      country: '韓国',
      avatar: '🇰🇷',
      skills: ['Vue.js', 'Python', 'Django'],
      isOnline: false,
      mutualConnections: 8
    },
    {
      id: 4,
      name: 'Lisa Johnson',
      country: 'アメリカ',
      avatar: '🇺🇸',
      skills: ['iOS', 'Swift', 'SwiftUI'],
      isOnline: true,
      mutualConnections: 2
    },
    {
      id: 5,
      name: 'Marco Rossi',
      avatar: '🇮🇹',
      country: 'イタリア',
      skills: ['Angular', 'TypeScript', 'NestJS'],
      isOnline: false,
      mutualConnections: 6
    }
  ]);

  const handleLikePost = (postId: number) => {
    console.log(`Liked post ${postId}`);
  };

  const handleCommentPost = (postId: number) => {
    console.log(`Comment on post ${postId}`);
  };

  const handleConnectMember = (memberId: number) => {
    console.log(`Connect with member ${memberId}`);
  };

  const handlePostSubmit = () => {
    if (newPost.trim()) {
      console.log('New post:', newPost);
      setNewPost('');
    }
  };

  const renderFeed = () => (
    <ScrollView style={styles.tabContent}>
      {/* New Post - Only for authenticated users */}
      {user ? (
        <View style={styles.newPostContainer}>
          <Text style={styles.newPostTitle}>💭 何を共有しますか？</Text>
          <TextInput
            style={styles.newPostInput}
            placeholder="学習の進捗、質問、発見を共有しましょう..."
            multiline
            value={newPost}
            onChangeText={setNewPost}
          />
          <TouchableOpacity 
            style={[styles.postButton, !newPost.trim() && styles.postButtonDisabled]}
            onPress={handlePostSubmit}
            disabled={!newPost.trim()}
          >
            <Text style={styles.postButtonText}>投稿する</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
      )}

      {/* Posts */}
      {posts.map((post) => (
        <View key={post.id} style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <Text style={styles.avatar}>{post.avatar}</Text>
              <View style={styles.authorDetails}>
                <Text style={styles.authorName}>{post.author}</Text>
                <Text style={styles.authorCountry}>{post.country} • {post.timestamp}</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.postContent}>{post.content}</Text>
          
          {/* Tags */}
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
          
          {/* Actions */}
          <View style={styles.postActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleLikePost(post.id)}
            >
              <Text style={[styles.actionIcon, post.isLiked && styles.likedIcon]}>
                {post.isLiked ? '❤️' : '🤍'}
              </Text>
              <Text style={styles.actionText}>{post.likes}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleCommentPost(post.id)}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>{post.comments}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>🔗</Text>
              <Text style={styles.actionText}>共有</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderMembers = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.membersHeader}>
        <Text style={styles.membersTitle}>🌍 グローバルメンバー</Text>
        <Text style={styles.membersSubtitle}>世界中の学習者とつながりましょう</Text>
      </View>
      
      {members.map((member) => (
        <View key={member.id} style={styles.memberCard}>
          <View style={styles.memberHeader}>
            <View style={styles.memberInfo}>
              <View style={styles.avatarContainer}>
                <Text style={styles.memberAvatar}>{member.avatar}</Text>
                {member.isOnline && <View style={styles.onlineIndicator} />}
              </View>
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberCountry}>{member.country}</Text>
                <Text style={styles.mutualConnections}>
                  {member.mutualConnections}人の共通の知り合い
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
          
          {/* Skills */}
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
        </View>
      ))}
    </ScrollView>
  );

  const renderGroups = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.groupsHeader}>
        <Text style={styles.groupsTitle}>👥 学習グループ</Text>
        <Text style={styles.groupsSubtitle}>興味のあるトピックでグループに参加</Text>
      </View>
      
      <View style={styles.groupCard}>
        <Text style={styles.groupName}>React Native 開発者</Text>
        <Text style={styles.groupDescription}>
          React Nativeでのモバイルアプリ開発について議論し、知識を共有するグループです。
        </Text>
        <View style={styles.groupStats}>
          <Text style={styles.groupStat}>👥 1,234名</Text>
          <Text style={styles.groupStat}>📝 週5-10投稿</Text>
        </View>
        <TouchableOpacity style={styles.joinGroupButton}>
          <Text style={styles.joinGroupButtonText}>グループに参加</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.groupCard}>
        <Text style={styles.groupName}>AI・機械学習</Text>
        <Text style={styles.groupDescription}>
          人工知能と機械学習の最新技術について学び、プロジェクトを共有するコミュニティです。
        </Text>
        <View style={styles.groupStats}>
          <Text style={styles.groupStat}>👥 856名</Text>
          <Text style={styles.groupStat}>📝 週3-7投稿</Text>
        </View>
        <TouchableOpacity style={styles.joinGroupButton}>
          <Text style={styles.joinGroupButtonText}>グループに参加</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.groupCard}>
        <Text style={styles.groupName}>Web3・ブロックチェーン</Text>
        <Text style={styles.groupDescription}>
          分散型アプリケーション開発とブロックチェーン技術について学習するグループです。
        </Text>
        <View style={styles.groupStats}>
          <Text style={styles.groupStat}>👥 642名</Text>
          <Text style={styles.groupStat}>📝 週2-5投稿</Text>
        </View>
        <TouchableOpacity style={styles.joinGroupButton}>
          <Text style={styles.joinGroupButtonText}>グループに参加</Text>
        </TouchableOpacity>
      </View>
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
  },
  newPostTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
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
});