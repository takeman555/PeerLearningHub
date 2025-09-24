import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AuthGuard from '../components/AuthGuard';

interface SearchResult {
  id: number;
  type: 'project' | 'session' | 'accommodation' | 'resource' | 'member';
  title: string;
  description: string;
  location?: string;
  date?: string;
  price?: number;
  currency?: string;
  rating?: number;
  tags: string[];
  availability?: boolean;
  url?: string;
}

export default function Search() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'project' | 'session' | 'accommodation' | 'resource' | 'member'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'rating' | 'price'>('relevance');

  const [searchResults] = useState<SearchResult[]>([
    {
      id: 1,
      type: 'project',
      title: 'React Native モバイルアプリ開発',
      description: 'TypeScriptとExpoを使用してクロスプラットフォーム対応のモバイルアプリケーションを開発するプロジェクトです。',
      date: '2024-01-20',
      tags: ['React Native', 'TypeScript', 'Mobile', 'Expo'],
      availability: true
    },
    {
      id: 2,
      type: 'session',
      title: 'AI・機械学習入門セッション',
      description: 'Pythonを使用した機械学習の基礎から実践まで学習します。初心者歓迎です。',
      date: '2024-01-18',
      tags: ['Python', 'AI', 'Machine Learning', 'Data Science'],
      availability: true
    },
    {
      id: 3,
      type: 'accommodation',
      title: 'Sanuki Peer Learning Hub',
      description: '香川県にあるピアラーニング専用施設。コワーキングスペースと食事サービスを提供。学習者同士の交流に最適。',
      location: '香川, 日本',
      tags: ['AirBnB', 'Coworking', '食事'],
      availability: true,
      url: 'https://www.airbnb.jp/rooms/1406333733661938726'
    },
    {
      id: 4,
      type: 'resource',
      title: 'TypeScript完全ガイド',
      description: 'TypeScriptの基礎から応用まで網羅した包括的な学習リソースです。',
      tags: ['TypeScript', 'JavaScript', 'Programming', 'Guide'],
      availability: true
    },
    {
      id: 5,
      type: 'member',
      title: 'Maria Santos - React Native Developer',
      description: 'ブラジル出身のReact Native開発者。5年の経験を持ち、モバイルアプリ開発のメンターとして活動中。',
      location: 'ブラジル',
      tags: ['React Native', 'Mobile', 'Mentor', 'Brazil'],
      availability: true
    },
    {
      id: 6,
      type: 'accommodation',
      title: 'vKirirom Pine Resort',
      description: '自然豊かなキリロム国立公園内のリゾート施設。静寂な環境で集中して学習できます。',
      location: 'キリロム, カンボジア',
      tags: ['Retreat', 'Digital Nomad', 'Nature', 'Bali'],
      availability: true,
      url: 'https://www.vkirirom.com'
    },
    {
      id: 7,
      type: 'project',
      title: 'Web3・ブロックチェーン開発',
      description: 'スマートコントラクトとDAppの開発を学習するプロジェクトです。',
      date: '2024-01-25',
      tags: ['Web3', 'Blockchain', 'Smart Contracts', 'DApp'],
      availability: false
    },
    {
      id: 8,
      type: 'resource',
      title: 'React Hooks実践ガイド',
      description: 'React Hooksの効果的な使い方と実践的なパターンを学習できるリソースです。',
      tags: ['React', 'Hooks', 'JavaScript', 'Frontend'],
      availability: true
    }
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return '🚀';
      case 'session': return '👥';
      case 'accommodation': return '🏨';
      case 'resource': return '📚';
      case 'member': return '👤';
      default: return '📝';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'project': return 'プロジェクト';
      case 'session': return 'セッション';
      case 'accommodation': return '宿泊施設';
      case 'resource': return 'リソース';
      case 'member': return 'メンバー';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project': return '#3b82f6';
      case 'session': return '#10b981';
      case 'accommodation': return '#f59e0b';
      case 'resource': return '#8b5cf6';
      case 'member': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredResults = activeFilter === 'all' 
    ? searchResults 
    : searchResults.filter(result => result.type === activeFilter);

  const searchFilteredResults = searchQuery.trim() 
    ? filteredResults.filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : filteredResults;

  const sortedResults = [...searchFilteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'rating':
        if (!a.rating && !b.rating) return 0;
        if (!a.rating) return 1;
        if (!b.rating) return -1;
        return b.rating - a.rating;
      case 'price':
        if (!a.price && !b.price) return 0;
        if (!a.price) return 1;
        if (!b.price) return -1;
        return a.price - b.price;
      default:
        return 0;
    }
  });

  const handleResultPress = (result: SearchResult) => {
    switch (result.type) {
      case 'project':
        router.push('/projects');
        break;
      case 'session':
        router.push('/peer-sessions');
        break;
      case 'accommodation':
        if (result.url) {
          // 外部URLがある場合は外部リンクを開く
          Linking.canOpenURL(result.url)
            .then((supported) => {
              if (supported) {
                return Linking.openURL(result.url!);
              } else {
                Alert.alert(
                  'リンクを開けません',
                  `以下のURLを手動でブラウザで開いてください：\n${result.url}`,
                  [{ text: 'OK' }]
                );
              }
            })
            .catch((err) => {
              console.error('URL open error:', err);
              Alert.alert(
                'エラー',
                `リンクを開けませんでした：\n${result.url}`
              );
            });
        } else {
          router.push('/accommodation');
        }
        break;
      case 'resource':
        router.push('/resources');
        break;
      case 'member':
        router.push('/community');
        break;
    }
  };

  return (
    <AuthGuard requireAuth={false}>
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="プロジェクト、セッション、宿泊施設、リソースを検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filterButtons}>
            {[
              { key: 'all', label: 'すべて', count: searchResults.length },
              { key: 'project', label: 'プロジェクト', count: searchResults.filter(r => r.type === 'project').length },
              { key: 'session', label: 'セッション', count: searchResults.filter(r => r.type === 'session').length },
              { key: 'accommodation', label: '宿泊施設', count: searchResults.filter(r => r.type === 'accommodation').length },
              { key: 'resource', label: 'リソース', count: searchResults.filter(r => r.type === 'resource').length },
              { key: 'member', label: 'メンバー', count: searchResults.filter(r => r.type === 'member').length }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  activeFilter === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setActiveFilter(filter.key as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  activeFilter === filter.key && styles.filterButtonTextActive
                ]}>
                  {filter.label} ({filter.count})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>並び替え:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
          <View style={styles.sortButtons}>
            {[
              { key: 'relevance', label: '関連度' },
              { key: 'date', label: '日付' },
              { key: 'rating', label: '評価' },
              { key: 'price', label: '価格' }
            ].map((sort) => (
              <TouchableOpacity
                key={sort.key}
                style={[
                  styles.sortButton,
                  sortBy === sort.key && styles.sortButtonActive
                ]}
                onPress={() => setSortBy(sort.key as any)}
              >
                <Text style={[
                  styles.sortButtonText,
                  sortBy === sort.key && styles.sortButtonTextActive
                ]}>
                  {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {sortedResults.length}件の結果
            {searchQuery && ` - "${searchQuery}"`}
          </Text>
        </View>

        {sortedResults.map((result) => (
          <TouchableOpacity 
            key={result.id} 
            style={styles.resultCard}
            onPress={() => handleResultPress(result)}
          >
            <View style={styles.resultHeader}>
              <View style={styles.resultInfo}>
                <Text style={styles.resultIcon}>{getTypeIcon(result.type)}</Text>
                <View style={styles.resultDetails}>
                  <Text style={styles.resultTitle}>{result.title}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(result.type) + '20' }]}>
                    <Text style={[styles.typeText, { color: getTypeColor(result.type) }]}>
                      {getTypeText(result.type)}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Price/Rating - 宿泊施設の場合は表示しない */}
              <View style={styles.resultMeta}>
                {result.price && result.type !== 'accommodation' && (
                  <Text style={styles.resultPrice}>
                    {result.currency === 'JPY' ? '¥' : result.currency === 'USD' ? '$' : '€'}
                    {result.price.toLocaleString()}
                  </Text>
                )}
                {result.rating && result.type !== 'accommodation' && (
                  <Text style={styles.resultRating}>⭐ {result.rating}</Text>
                )}
                {result.date && (
                  <Text style={styles.resultDate}>{result.date}</Text>
                )}
                {result.url && result.type === 'accommodation' && (
                  <Text style={styles.externalLinkText}>🔗 外部サイト</Text>
                )}
              </View>
            </View>
            
            <Text style={styles.resultDescription}>{result.description}</Text>
            
            {result.location && (
              <Text style={styles.resultLocation}>📍 {result.location}</Text>
            )}
            
            {/* Tags */}
            <View style={styles.tagsContainer}>
              {result.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {result.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{result.tags.length - 3}</Text>
              )}
            </View>
            
            {/* Availability */}
            <View style={styles.availabilityContainer}>
              <View style={[
                styles.availabilityBadge,
                { backgroundColor: result.availability ? '#dcfce7' : '#fee2e2' }
              ]}>
                <Text style={[
                  styles.availabilityText,
                  { color: result.availability ? '#16a34a' : '#dc2626' }
                ]}>
                  {result.availability ? '利用可能' : '利用不可'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        {sortedResults.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>検索結果が見つかりません</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? '別のキーワードで検索してみてください' 
                : 'フィルターを変更してみてください'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Search Suggestions */}
      {!searchQuery && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>💡 人気の検索キーワード</Text>
          <View style={styles.suggestionsList}>
            {['React Native', 'TypeScript', 'AI', 'Web3', '東京', 'バリ'].map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionButton}
                onPress={() => setSearchQuery(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Search Header
  searchHeader: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#6b7280',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  // Filters
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filtersScroll: {
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
  // Sort
  sortContainer: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sortLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 12,
  },
  sortScroll: {
    flexGrow: 0,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sortButtonActive: {
    backgroundColor: '#eff6ff',
  },
  sortButtonText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  sortButtonTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  // Results
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resultDetails: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  resultMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  resultRating: {
    fontSize: 12,
    color: '#f59e0b',
  },
  resultDate: {
    fontSize: 11,
    color: '#6b7280',
  },
  resultDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  resultLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
    alignItems: 'center',
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
  moreTagsText: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  availabilityContainer: {
    alignItems: 'flex-end',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  // Suggestions
  suggestionsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  suggestionText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  externalLinkText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
});