/**
 * Resource Management Service
 * Handles creation, editing, and management of learning resources
 */

export interface Resource {
  id: string;
  type: 'tutorial' | 'documentation' | 'video' | 'book' | 'tool' | 'course' | 'article' | 'guide';
  title: string;
  description: string;
  content?: string; // Full content for articles/guides
  author: string;
  url?: string; // External URL
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  rating: number;
  reviews: number;
  tags: string[];
  isFree: boolean;
  price?: number;
  language: 'ja' | 'en' | 'multi';
  category: 'programming' | 'language' | 'design' | 'business' | 'general';
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // User ID
}

export interface Announcement {
  id: string;
  type: 'news' | 'update' | 'event' | 'maintenance';
  title: string;
  content: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

class ResourceManagerService {
  private resources: Map<string, Resource> = new Map();
  private announcements: Map<string, Announcement> = new Map();

  constructor() {
    this.initializeDefaultContent();
  }

  /**
   * Initialize with default content
   */
  private initializeDefaultContent() {
    // Default resources
    const defaultResources: Resource[] = [
      {
        id: 'res-1',
        type: 'tutorial',
        title: 'React Native完全ガイド',
        description: 'React Nativeの基礎から応用まで、実践的なサンプルコードと共に学習できる包括的なチュートリアルです。',
        author: 'Tech Learning Hub',
        url: 'https://reactnative.dev/docs/getting-started',
        difficulty: 'intermediate',
        duration: '8時間',
        rating: 4.8,
        reviews: 234,
        tags: ['React Native', 'Mobile', 'JavaScript', 'TypeScript'],
        isFree: true,
        language: 'ja',
        category: 'programming',
        isPublished: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
        createdBy: 'admin'
      },
      {
        id: 'res-2',
        type: 'video',
        title: 'TypeScript入門講座',
        description: '初心者向けのTypeScript講座。基本的な型システムから実践的な使い方まで動画で学習できます。',
        author: 'Code Academy',
        url: 'https://www.typescriptlang.org/docs/',
        difficulty: 'beginner',
        duration: '4時間',
        rating: 4.6,
        reviews: 156,
        tags: ['TypeScript', 'JavaScript', 'Programming'],
        isFree: false,
        price: 2980,
        language: 'ja',
        category: 'programming',
        isPublished: true,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-08T00:00:00Z',
        createdBy: 'admin'
      },
      {
        id: 'res-3',
        type: 'guide',
        title: '日本語学習のコツ',
        description: '効果的な日本語学習方法とピアラーニングの活用法',
        content: `# 日本語学習のコツ

## 1. 基礎固め
- ひらがな・カタカナの完全習得
- 基本的な漢字（常用漢字）の学習
- 基礎文法の理解

## 2. ピアラーニングの活用
- 言語交換パートナーとの練習
- グループ学習セッションへの参加
- 実践的な会話練習

## 3. 継続的な学習
- 毎日の学習習慣の確立
- 目標設定と進捗管理
- モチベーション維持の工夫

## 4. 文化理解
- 日本の文化・習慣の学習
- ビジネスマナーの習得
- 地域による違いの理解`,
        author: 'ピアラーニングハブ',
        difficulty: 'beginner',
        duration: '読了目安: 30分',
        rating: 4.9,
        reviews: 89,
        tags: ['日本語', '学習法', 'ピアラーニング', '文化'],
        isFree: true,
        language: 'ja',
        category: 'language',
        isPublished: true,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-12T00:00:00Z',
        createdBy: 'admin'
      },
      {
        id: 'res-4',
        type: 'article',
        title: 'デジタルノマドのための日本生活ガイド',
        description: '日本でデジタルノマドとして生活するための実践的なアドバイス',
        content: `# デジタルノマドのための日本生活ガイド

## ビザと滞在許可
- 観光ビザでの滞在制限
- ワーキングホリデービザの活用
- 長期滞在のオプション

## 住居の確保
- 短期賃貸アパートメント
- ゲストハウス・シェアハウス
- Airbnbの長期利用

## インターネット環境
- ポケットWiFiレンタル
- SIMカードの購入
- コワーキングスペースの活用

## 生活の基本
- 銀行口座の開設
- 携帯電話の契約
- 健康保険の加入

## コミュニティ
- 外国人コミュニティへの参加
- 言語交換イベント
- ピアラーニングハブの活用`,
        author: 'ピアラーニングハブ',
        difficulty: 'intermediate',
        duration: '読了目安: 45分',
        rating: 4.7,
        reviews: 67,
        tags: ['デジタルノマド', '日本生活', 'ビザ', '住居', 'コミュニティ'],
        isFree: true,
        language: 'ja',
        category: 'general',
        isPublished: true,
        createdAt: '2024-01-04T00:00:00Z',
        updatedAt: '2024-01-11T00:00:00Z',
        createdBy: 'admin'
      }
    ];

    // Default announcements
    const defaultAnnouncements: Announcement[] = [
      {
        id: 'ann-1',
        type: 'news',
        title: '新機能リリース: AI学習アシスタント',
        content: 'AI技術を活用した学習アシスタント機能をリリースしました。個人の学習進度に合わせたカスタマイズされた学習プランを提供します。',
        date: '2024-01-14',
        priority: 'high',
        isPublished: true,
        createdBy: 'admin',
        createdAt: '2024-01-14T00:00:00Z',
        updatedAt: '2024-01-14T00:00:00Z'
      },
      {
        id: 'ann-2',
        type: 'event',
        title: 'グローバル学習イベント開催のお知らせ',
        content: '2024年2月15日〜17日に開催される国際的な学習イベントの参加者を募集しています。世界中の学習者と交流する絶好の機会です。',
        date: '2024-01-12',
        priority: 'medium',
        isPublished: true,
        createdBy: 'admin',
        createdAt: '2024-01-12T00:00:00Z',
        updatedAt: '2024-01-12T00:00:00Z'
      }
    ];

    // Store default content
    defaultResources.forEach(resource => {
      this.resources.set(resource.id, resource);
    });

    defaultAnnouncements.forEach(announcement => {
      this.announcements.set(announcement.id, announcement);
    });

    console.log('✅ Default resources and announcements initialized');
  }

  /**
   * Get all published resources
   */
  async getPublishedResources(): Promise<Resource[]> {
    const allResources = Array.from(this.resources.values());
    return allResources.filter(resource => resource.isPublished);
  }

  /**
   * Get all resources (admin only)
   */
  async getAllResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  /**
   * Get resource by ID
   */
  async getResourceById(id: string): Promise<Resource | null> {
    return this.resources.get(id) || null;
  }

  /**
   * Create new resource
   */
  async createResource(resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviews'>): Promise<Resource> {
    const id = `res-${Date.now()}`;
    const now = new Date().toISOString();
    
    const resource: Resource = {
      ...resourceData,
      id,
      rating: 0,
      reviews: 0,
      createdAt: now,
      updatedAt: now
    };

    this.resources.set(id, resource);
    console.log('✅ Resource created:', resource.title);
    return resource;
  }

  /**
   * Update resource
   */
  async updateResource(id: string, updates: Partial<Resource>): Promise<Resource | null> {
    const resource = this.resources.get(id);
    if (!resource) {
      return null;
    }

    const updatedResource = {
      ...resource,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.resources.set(id, updatedResource);
    console.log('✅ Resource updated:', updatedResource.title);
    return updatedResource;
  }

  /**
   * Delete resource
   */
  async deleteResource(id: string): Promise<boolean> {
    const deleted = this.resources.delete(id);
    if (deleted) {
      console.log('✅ Resource deleted:', id);
    }
    return deleted;
  }

  /**
   * Get all published announcements
   */
  async getPublishedAnnouncements(): Promise<Announcement[]> {
    const allAnnouncements = Array.from(this.announcements.values());
    return allAnnouncements
      .filter(announcement => announcement.isPublished)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Get all announcements (admin only)
   */
  async getAllAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Create new announcement
   */
  async createAnnouncement(announcementData: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement> {
    const id = `ann-${Date.now()}`;
    const now = new Date().toISOString();
    
    const announcement: Announcement = {
      ...announcementData,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.announcements.set(id, announcement);
    console.log('✅ Announcement created:', announcement.title);
    return announcement;
  }

  /**
   * Update announcement
   */
  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | null> {
    const announcement = this.announcements.get(id);
    if (!announcement) {
      return null;
    }

    const updatedAnnouncement = {
      ...announcement,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.announcements.set(id, updatedAnnouncement);
    console.log('✅ Announcement updated:', updatedAnnouncement.title);
    return updatedAnnouncement;
  }

  /**
   * Delete announcement
   */
  async deleteAnnouncement(id: string): Promise<boolean> {
    const deleted = this.announcements.delete(id);
    if (deleted) {
      console.log('✅ Announcement deleted:', id);
    }
    return deleted;
  }

  /**
   * Search resources
   */
  async searchResources(query: string, filters?: {
    type?: string;
    difficulty?: string;
    category?: string;
    isFree?: boolean;
    language?: string;
  }): Promise<Resource[]> {
    let results = Array.from(this.resources.values())
      .filter(resource => resource.isPublished);

    // Text search
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      results = results.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm) ||
        resource.description.toLowerCase().includes(searchTerm) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        resource.author.toLowerCase().includes(searchTerm)
      );
    }

    // Apply filters
    if (filters) {
      if (filters.type && filters.type !== 'all') {
        results = results.filter(resource => resource.type === filters.type);
      }
      if (filters.difficulty) {
        results = results.filter(resource => resource.difficulty === filters.difficulty);
      }
      if (filters.category) {
        results = results.filter(resource => resource.category === filters.category);
      }
      if (filters.isFree !== undefined) {
        results = results.filter(resource => resource.isFree === filters.isFree);
      }
      if (filters.language) {
        results = results.filter(resource => resource.language === filters.language);
      }
    }

    return results.sort((a, b) => b.rating - a.rating);
  }

  /**
   * Get resources by category
   */
  async getResourcesByCategory(category: string): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.isPublished && resource.category === category)
      .sort((a, b) => b.rating - a.rating);
  }

  /**
   * Get featured resources (high rating, recent)
   */
  async getFeaturedResources(limit: number = 5): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.isPublished && resource.rating >= 4.5)
      .sort((a, b) => {
        // Sort by rating first, then by update date
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .slice(0, limit);
  }

  /**
   * Rate a resource
   */
  async rateResource(resourceId: string, rating: number, userId: string): Promise<boolean> {
    const resource = this.resources.get(resourceId);
    if (!resource || rating < 1 || rating > 5) {
      return false;
    }

    // Simple rating calculation (in real app, would track individual ratings)
    const newRating = ((resource.rating * resource.reviews) + rating) / (resource.reviews + 1);
    
    const updatedResource = {
      ...resource,
      rating: Math.round(newRating * 10) / 10,
      reviews: resource.reviews + 1,
      updatedAt: new Date().toISOString()
    };

    this.resources.set(resourceId, updatedResource);
    console.log('✅ Resource rated:', resourceId, rating);
    return true;
  }
}

export const resourceManager = new ResourceManagerService();