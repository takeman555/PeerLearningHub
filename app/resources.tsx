import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import AuthGuard from '../components/AuthGuard';
import resourceService from '../services/resourceService';
import { Resource as CMSResource } from '../types/resources';

interface Resource {
  id: number;
  type: 'tutorial' | 'documentation' | 'video' | 'book' | 'tool' | 'course';
  title: string;
  description: string;
  author: string;
  url: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  rating: number;
  reviews: number;
  tags: string[];
  isFree: boolean;
  price?: number;
  language: 'ja' | 'en' | 'multi';
  lastUpdated: string;
}

interface Announcement {
  id: number;
  type: 'news' | 'update' | 'event' | 'maintenance';
  title: string;
  content: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
}

export default function Resources() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'resources' | 'announcements' | 'help'>('resources');
  const [resourceFilter, setResourceFilter] = useState<'all' | 'tutorial' | 'documentation' | 'video' | 'book' | 'tool' | 'course'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cmsResources, setCmsResources] = useState<CMSResource[]>([]);
  const [loadingCmsResources, setLoadingCmsResources] = useState(false);

  // 統合されたリソースシステム - すべてCMSから取得
  const [allResources, setAllResources] = useState<CMSResource[]>([]);

  const [announcements] = useState<Announcement[]>([
    {
      id: 1,
      type: 'news',
      title: '新機能リリース: AI学習アシスタント',
      content: 'AI技術を活用した学習アシスタント機能をリリースしました。個人の学習進度に合わせたカスタマイズされた学習プランを提供します。',
      date: '2024-01-14',
      priority: 'high',
      isRead: false
    },
    {
      id: 2,
      type: 'event',
      title: 'グローバル学習イベント開催のお知らせ',
      content: '2024年2月15日〜17日に開催される国際的な学習イベントの参加者を募集しています。世界中の学習者と交流する絶好の機会です。',
      date: '2024-01-12',
      priority: 'medium',
      isRead: true
    },
    {
      id: 3,
      type: 'update',
      title: 'アプリアップデート v2.1.0',
      content: 'パフォーマンスの向上とバグ修正を含むアップデートをリリースしました。新しいダークモードテーマも追加されています。',
      date: '2024-01-10',
      priority: 'medium',
      isRead: true
    },
    {
      id: 4,
      type: 'maintenance',
      title: 'システムメンテナンスのお知らせ',
      content: '2024年1月20日 2:00-4:00（JST）にシステムメンテナンスを実施します。この間、一部機能がご利用いただけません。',
      date: '2024-01-08',
      priority: 'high',
      isRead: false
    }
  ]);

  // Load all resources from CMS
  useEffect(() => {
    loadAllResources();
  }, []);

  const loadAllResources = async () => {
    setLoadingCmsResources(true);
    try {
      const publishedResources = await resourceService.getResources({ published: true });
      setAllResources(publishedResources);
      // 注目リソース用に別途設定
      setCmsResources(publishedResources.filter(r => r.featured));
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoadingCmsResources(false);
    }
  };

  // CMSリソースをレガシーリソース形式に変換
  const convertCMSToLegacyResource = (cmsResource: CMSResource): Resource => {
    const typeMapping: { [key: string]: Resource['type'] } = {
      'article': 'tutorial',
      'video': 'video',
      'document': 'documentation',
      'course': 'course',
      'link': 'documentation'
    };

    const difficultyMapping: { [key: string]: Resource['difficulty'] } = {
      'beginner': 'beginner',
      'intermediate': 'intermediate',
      'advanced': 'advanced',
      'all_levels': 'intermediate'
    };

    return {
      id: parseInt(cmsResource.id),
      type: typeMapping[cmsResource.type] || 'tutorial',
      title: cmsResource.title,
      description: cmsResource.description,
      author: cmsResource.author_name,
      url: cmsResource.file_url || '#',
      difficulty: difficultyMapping[cmsResource.level] || 'intermediate',
      duration: cmsResource.duration ? `${Math.floor(cmsResource.duration / 60)}時間` : undefined,
      rating: 4.5 + (cmsResource.likes / 100), // 簡易的な評価計算
      reviews: cmsResource.views,
      tags: cmsResource.tags,
      isFree: !cmsResource.file_url?.includes('price'),
      price: cmsResource.file_url?.includes('price') ? 2980 : undefined,
      language: cmsResource.language,
      lastUpdated: new Date(cmsResource.updated_at).toISOString().split('T')[0]
    };
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'tutorial': return '📖';
      case 'documentation': return '📋';
      case 'video': return '🎥';
      case 'book': return '📚';
      case 'tool': return '🛠️';
      case 'course': return '🎓';
      default: return '📄';
    }
  };

  const getResourceTypeText = (type: string) => {
    switch (type) {
      case 'tutorial': return 'チュートリアル';
      case 'documentation': return 'ドキュメント';
      case 'video': return '動画';
      case 'book': return '書籍';
      case 'tool': return 'ツール';
      case 'course': return 'コース';
      default: return type;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '初級';
      case 'intermediate': return '中級';
      case 'advanced': return '上級';
      default: return difficulty;
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'news': return '📢';
      case 'update': return '🔄';
      case 'event': return '🎉';
      case 'maintenance': return '🔧';
      default: return '📝';
    }
  };

  const getAnnouncementTypeText = (type: string) => {
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

  const getLanguageText = (language: string) => {
    switch (language) {
      case 'ja': return '日本語';
      case 'en': return '英語';
      case 'multi': return '多言語';
      default: return language;
    }
  };

  // CMSリソースをレガシー形式に変換
  const legacyResources = allResources.map(convertCMSToLegacyResource);

  const filteredResources = resourceFilter === 'all' 
    ? legacyResources 
    : legacyResources.filter(resource => resource.type === resourceFilter);

  const searchFilteredResources = searchQuery.trim() 
    ? filteredResources.filter(resource => 
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : filteredResources;

  const handleResourcePress = (resource: Resource) => {
    console.log(`Opening resource: ${resource.title}`);
    // CMSリソースの場合は詳細表示、外部URLの場合はブラウザで開く
    if (resource.url && resource.url !== '#') {
      // 実際のアプリでは外部ブラウザで開く処理を実装
      console.log(`Opening URL: ${resource.url}`);
    }
  };

  const renderResources = () => (
    <ScrollView style={styles.tabContent}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="リソースを検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterButtons}>
            {[
              { key: 'all', label: 'すべて' },
              { key: 'tutorial', label: 'チュートリアル' },
              { key: 'video', label: '動画' },
              { key: 'documentation', label: 'ドキュメント' },
              { key: 'book', label: '書籍' },
              { key: 'course', label: 'コース' },
              { key: 'tool', label: 'ツール' }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  resourceFilter === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setResourceFilter(filter.key as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  resourceFilter === filter.key && styles.filterButtonTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* CMS Resources Section */}
      {cmsResources.length > 0 && (
        <View style={styles.cmsResourcesSection}>
          <Text style={styles.sectionTitle}>📚 学習リソース</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cmsResourcesScroll}>
            <View style={styles.cmsResourcesContainer}>
              {cmsResources.slice(0, 5).map((resource) => (
                <TouchableOpacity key={resource.id} style={styles.cmsResourceCard}>
                  <View style={styles.cmsResourceHeader}>
                    <Text style={styles.cmsResourceTitle}>{resource.title}</Text>
                    {resource.featured && (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredText}>注目</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cmsResourceDescription} numberOfLines={2}>
                    {resource.description}
                  </Text>
                  <View style={styles.cmsResourceMeta}>
                    <Text style={styles.cmsResourceCategory}>{resource.category}</Text>
                    <Text style={styles.cmsResourceLevel}>{resource.level}</Text>
                  </View>
                  <View style={styles.cmsResourceStats}>
                    <Text style={styles.cmsResourceStat}>👁 {resource.views}</Text>
                    <Text style={styles.cmsResourceStat}>❤️ {resource.likes}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Resources List */}
      <View style={styles.resourcesContainer}>
        {searchFilteredResources.map((resource) => (
          <TouchableOpacity 
            key={resource.id} 
            style={styles.resourceCard}
            onPress={() => handleResourcePress(resource)}
          >
            <View style={styles.resourceHeader}>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceIcon}>{getResourceIcon(resource.type)}</Text>
                <View style={styles.resourceDetails}>
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                  <Text style={styles.resourceAuthor}>by {resource.author}</Text>
                </View>
              </View>
              <View style={styles.resourceMeta}>
                <View style={[styles.typeBadge, { backgroundColor: '#3b82f6' + '20' }]}>
                  <Text style={[styles.typeText, { color: '#3b82f6' }]}>
                    {getResourceTypeText(resource.type)}
                  </Text>
                </View>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(resource.difficulty) + '20' }]}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(resource.difficulty) }]}>
                    {getDifficultyText(resource.difficulty)}
                  </Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.resourceDescription}>{resource.description}</Text>
            
            {/* Resource Info */}
            <View style={styles.resourceInfoRow}>
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>⭐ {resource.rating}</Text>
                <Text style={styles.reviews}>({resource.reviews}件)</Text>
              </View>
              {resource.duration && (
                <Text style={styles.duration}>⏱️ {resource.duration}</Text>
              )}
              <Text style={styles.language}>🌐 {getLanguageText(resource.language)}</Text>
            </View>
            
            {/* Tags */}
            <View style={styles.tagsContainer}>
              {resource.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
            
            {/* Price */}
            <View style={styles.priceContainer}>
              {resource.isFree ? (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeText}>無料</Text>
                </View>
              ) : (
                <Text style={styles.price}>¥{resource.price?.toLocaleString()}</Text>
              )}
              <Text style={styles.lastUpdated}>更新: {resource.lastUpdated}</Text>
            </View>
          </TouchableOpacity>
        ))}
        
        {searchFilteredResources.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>リソースが見つかりません</Text>
            <Text style={styles.emptySubtext}>検索条件を変更してみてください</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderAnnouncements = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.announcementsHeader}>
        <Text style={styles.announcementsTitle}>📢 お知らせ・公式情報</Text>
        <Text style={styles.announcementsSubtitle}>最新のニュースとアップデート情報</Text>
      </View>
      
      {announcements.map((announcement) => (
        <View key={announcement.id} style={[
          styles.announcementCard,
          !announcement.isRead && styles.unreadCard
        ]}>
          <View style={styles.announcementHeader}>
            <View style={styles.announcementInfo}>
              <Text style={styles.announcementIcon}>{getAnnouncementIcon(announcement.type)}</Text>
              <View style={styles.announcementDetails}>
                <Text style={styles.announcementTitle}>{announcement.title}</Text>
                <Text style={styles.announcementDate}>{announcement.date}</Text>
              </View>
            </View>
            <View style={styles.announcementMeta}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(announcement.priority) + '20' }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(announcement.priority) }]}>
                  {getAnnouncementTypeText(announcement.type)}
                </Text>
              </View>
              {!announcement.isRead && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>NEW</Text>
                </View>
              )}
            </View>
          </View>
          
          <Text style={styles.announcementContent}>{announcement.content}</Text>
        </View>
      ))}
    </ScrollView>
  );

  const renderHelp = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.helpContainer}>
        <Text style={styles.helpTitle}>❓ ヘルプ・サポート</Text>
        
        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqSectionTitle}>よくある質問</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Q. プロジェクトに参加するにはどうすればよいですか？</Text>
            <Text style={styles.faqAnswer}>A. プロジェクト画面から興味のあるプロジェクトを選択し、「プロジェクトに参加」ボタンをタップしてください。</Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Q. 宿泊施設の予約をキャンセルできますか？</Text>
            <Text style={styles.faqAnswer}>A. 予約履歴画面から該当する予約を選択し、キャンセルボタンからお手続きいただけます。キャンセル料については各施設の規定に従います。</Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Q. 学習ポイントはどのように獲得できますか？</Text>
            <Text style={styles.faqAnswer}>A. プロジェクトの完了、セッションへの参加、コミュニティへの貢献などでポイントを獲得できます。</Text>
          </View>
        </View>
        
        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactSectionTitle}>お問い合わせ</Text>
          
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactIcon}>📧</Text>
            <Text style={styles.contactText}>メールサポート</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactIcon}>💬</Text>
            <Text style={styles.contactText}>チャットサポート</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactIcon}>📞</Text>
            <Text style={styles.contactText}>電話サポート</Text>
          </TouchableOpacity>
        </View>
        
        {/* Links Section */}
        <View style={styles.linksSection}>
          <Text style={styles.linksSectionTitle}>関連リンク</Text>
          
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>利用規約</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>プライバシーポリシー</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>コミュニティガイドライン</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <AuthGuard requireAuth={false}>
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resources' && styles.activeTab]}
          onPress={() => setActiveTab('resources')}
        >
          <Text style={[styles.tabText, activeTab === 'resources' && styles.activeTabText]}>
            リソース
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'announcements' && styles.activeTab]}
          onPress={() => setActiveTab('announcements')}
        >
          <Text style={[styles.tabText, activeTab === 'announcements' && styles.activeTabText]}>
            お知らせ
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'help' && styles.activeTab]}
          onPress={() => setActiveTab('help')}
        >
          <Text style={[styles.tabText, activeTab === 'help' && styles.activeTabText]}>
            ヘルプ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'resources' && renderResources()}
      {activeTab === 'announcements' && renderAnnouncements()}
      {activeTab === 'help' && renderHelp()}
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
  // Search Styles
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
    color: '#6b7280',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  // Filter Styles
  filterContainer: {
    marginBottom: 20,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  // Resource Styles
  resourcesContainer: {
    gap: 16,
  },
  resourceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resourceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resourceDetails: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  resourceAuthor: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  resourceMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  resourceDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  resourceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    color: '#f59e0b',
  },
  reviews: {
    fontSize: 11,
    color: '#6b7280',
  },
  duration: {
    fontSize: 11,
    color: '#6b7280',
  },
  language: {
    fontSize: 11,
    color: '#6b7280',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    color: '#6b7280',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  freeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  lastUpdated: {
    fontSize: 10,
    color: '#9ca3af',
  },
  // Announcements Styles
  announcementsHeader: {
    marginBottom: 20,
  },
  announcementsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  announcementsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  announcementCard: {
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
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  announcementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  announcementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  announcementDetails: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  announcementDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  announcementMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unreadText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'white',
  },
  announcementContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  // Help Styles
  helpContainer: {
    gap: 24,
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  faqSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faqSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  contactSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  contactIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  linksSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  linksSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  linkButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  linkText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  // CMS Resources Styles
  cmsResourcesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  cmsResourcesScroll: {
    flexGrow: 0,
  },
  cmsResourcesContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  cmsResourceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cmsResourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cmsResourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  featuredBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1e40af',
  },
  cmsResourceDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  cmsResourceMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  cmsResourceCategory: {
    fontSize: 12,
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cmsResourceLevel: {
    fontSize: 12,
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cmsResourceStats: {
    flexDirection: 'row',
    gap: 12,
  },
  cmsResourceStat: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
  },
});