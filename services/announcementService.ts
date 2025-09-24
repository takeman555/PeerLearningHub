import { supabase } from '../config/supabase';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'news' | 'update' | 'event' | 'maintenance';
  priority: 'high' | 'medium' | 'low';
  published: boolean;
  featured: boolean;
  author_id?: string;
  author_name: string;
  published_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  type: 'news' | 'update' | 'event' | 'maintenance';
  priority: 'high' | 'medium' | 'low';
  published?: boolean;
  featured?: boolean;
  expires_at?: string;
}

export interface UpdateAnnouncementRequest extends CreateAnnouncementRequest {
  id: string;
}

export interface AnnouncementFilters {
  published?: boolean;
  type?: string;
  priority?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

class AnnouncementService {
  /**
   * Get published announcements for public display
   */
  async getPublishedAnnouncements(limit: number = 50, offset: number = 0): Promise<Announcement[]> {
    try {
      // First try using the RPC function
      const { data, error } = await supabase
        .rpc('get_published_announcements', {
          limit_count: limit,
          offset_count: offset
        });

      if (error) {
        // If RPC function doesn't exist, fall back to direct table query
        if (error.code === 'PGRST202') {
          console.log('RPC function not found, falling back to direct query');
          return await this.getPublishedAnnouncementsFallback(limit, offset);
        }
        console.log('RPC error, trying fallback:', error.message);
        return await this.getPublishedAnnouncementsFallback(limit, offset);
      }

      return data || [];
    } catch (error) {
      console.log('Database not available, using static announcements:', error.message);
      // Return static data as fallback
      return this.getStaticAnnouncements();
    }
  }

  /**
   * Fallback method using direct table query
   */
  private async getPublishedAnnouncementsFallback(limit: number, offset: number): Promise<Announcement[]> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('published', true)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('featured', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        console.log('Table query failed, announcements table may not exist:', error.message);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.log('Direct table access failed:', error.message);
      throw error;
    }
  }

  /**
   * Static announcements as fallback when database is not available
   */
  private getStaticAnnouncements(): Announcement[] {
    return [
      {
        id: '1',
        title: '新機能リリース: AI学習アシスタント',
        content: 'AI技術を活用した学習アシスタント機能をリリースしました。個人の学習進度に合わせたカスタマイズされた学習プランを提供します。',
        type: 'news',
        priority: 'high',
        published: true,
        featured: true,
        author_name: 'システム管理者',
        published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        title: 'グローバル学習イベント開催のお知らせ',
        content: '2024年2月15日〜17日に開催される国際的な学習イベントの参加者を募集しています。世界中の学習者と交流する絶好の機会です。',
        type: 'event',
        priority: 'medium',
        published: true,
        featured: false,
        author_name: 'イベント担当',
        published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        title: 'アプリアップデート v2.1.0',
        content: 'パフォーマンスの向上とバグ修正を含むアップデートをリリースしました。新しいダークモードテーマも追加されています。',
        type: 'update',
        priority: 'medium',
        published: true,
        featured: false,
        author_name: '開発チーム',
        published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        title: 'システムメンテナンスのお知らせ',
        content: '2024年1月20日 2:00-4:00（JST）にシステムメンテナンスを実施します。この間、一部機能がご利用いただけません。',
        type: 'maintenance',
        priority: 'high',
        published: true,
        featured: true,
        author_name: 'システム管理者',
        published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  /**
   * Get all announcements (admin only)
   */
  async getAllAnnouncements(filters: AnnouncementFilters = {}): Promise<Announcement[]> {
    try {
      let query = supabase
        .from('announcements')
        .select('*');

      // Apply filters
      if (filters.published !== undefined) {
        query = query.eq('published', filters.published);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      // Order by featured first, then by created date
      query = query.order('featured', { ascending: false })
                   .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all announcements:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllAnnouncements:', error);
      throw error;
    }
  }

  /**
   * Get announcement by ID
   */
  async getAnnouncementById(id: string): Promise<Announcement | null> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error fetching announcement by ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getAnnouncementById:', error);
      throw error;
    }
  }

  /**
   * Create new announcement (admin only)
   */
  async createAnnouncement(
    announcementData: CreateAnnouncementRequest,
    authorId: string,
    authorName: string
  ): Promise<Announcement> {
    try {
      const newAnnouncement = {
        ...announcementData,
        author_id: authorId,
        author_name: authorName,
        published_at: announcementData.published ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('announcements')
        .insert(newAnnouncement)
        .select()
        .single();

      if (error) {
        console.error('Error creating announcement:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createAnnouncement:', error);
      throw error;
    }
  }

  /**
   * Update announcement (admin only)
   */
  async updateAnnouncement(announcementData: UpdateAnnouncementRequest): Promise<Announcement> {
    try {
      const updateData = {
        title: announcementData.title,
        content: announcementData.content,
        type: announcementData.type,
        priority: announcementData.priority,
        published: announcementData.published,
        featured: announcementData.featured,
        expires_at: announcementData.expires_at,
        updated_at: new Date().toISOString()
      };

      // Set published_at if publishing for the first time
      const currentAnnouncement = await this.getAnnouncementById(announcementData.id);
      if (announcementData.published && currentAnnouncement && !currentAnnouncement.published_at) {
        (updateData as any).published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('announcements')
        .update(updateData)
        .eq('id', announcementData.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating announcement:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateAnnouncement:', error);
      throw error;
    }
  }

  /**
   * Delete announcement (admin only)
   */
  async deleteAnnouncement(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting announcement:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteAnnouncement:', error);
      throw error;
    }
  }

  /**
   * Toggle announcement published status (admin only)
   */
  async togglePublished(id: string): Promise<Announcement> {
    try {
      const currentAnnouncement = await this.getAnnouncementById(id);
      if (!currentAnnouncement) {
        throw new Error('Announcement not found');
      }

      const updateData: any = {
        published: !currentAnnouncement.published,
        updated_at: new Date().toISOString()
      };

      // Set published_at if publishing for the first time
      if (!currentAnnouncement.published && !currentAnnouncement.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('announcements')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling announcement published status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in togglePublished:', error);
      throw error;
    }
  }

  /**
   * Toggle announcement featured status (admin only)
   */
  async toggleFeatured(id: string): Promise<Announcement> {
    try {
      const currentAnnouncement = await this.getAnnouncementById(id);
      if (!currentAnnouncement) {
        throw new Error('Announcement not found');
      }

      const { data, error } = await supabase
        .from('announcements')
        .update({
          featured: !currentAnnouncement.featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling announcement featured status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in toggleFeatured:', error);
      throw error;
    }
  }

  /**
   * Get announcement statistics (admin only)
   */
  async getAnnouncementStats(): Promise<{
    total: number;
    published: number;
    featured: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('type, priority, published, featured');

      if (error) {
        console.error('Error fetching announcement stats:', error);
        throw error;
      }

      const stats = {
        total: data.length,
        published: data.filter(a => a.published).length,
        featured: data.filter(a => a.featured).length,
        byType: {} as Record<string, number>,
        byPriority: {} as Record<string, number>
      };

      // Count by type
      data.forEach(announcement => {
        stats.byType[announcement.type] = (stats.byType[announcement.type] || 0) + 1;
        stats.byPriority[announcement.priority] = (stats.byPriority[announcement.priority] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error in getAnnouncementStats:', error);
      throw error;
    }
  }
}

export const announcementService = new AnnouncementService();
export default announcementService;