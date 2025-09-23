/**
 * External Systems Integration Service
 * Handles caching and synchronization of external project, session, and accommodation data
 */

import { supabase } from '../config/supabase';

// Types for external systems
export interface ExternalProject {
  id: string;
  external_id: string;
  source_system: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  tags: string[];
  start_date?: string;
  end_date?: string;
  max_participants?: number;
  current_participants: number;
  requirements?: string;
  skills_learned: string[];
  project_url?: string;
  repository_url?: string;
  contact_info?: any;
  metadata?: any;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface ExternalSession {
  id: string;
  external_id: string;
  source_system: string;
  title: string;
  description?: string;
  session_type: 'workshop' | 'seminar' | 'study_group' | 'mentoring';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  tags: string[];
  scheduled_at?: string;
  duration_minutes?: number;
  max_participants?: number;
  current_participants: number;
  language: string;
  session_url?: string;
  meeting_id?: string;
  password?: string;
  host_info?: any;
  requirements?: string;
  materials_url?: string;
  recording_url?: string;
  metadata?: any;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface ExternalAccommodation {
  id: string;
  external_id: string;
  source_system: string;
  name: string;
  description?: string;
  accommodation_type: 'apartment' | 'house' | 'room' | 'dormitory';
  status: 'available' | 'booked' | 'maintenance' | 'unavailable';
  location?: any;
  capacity?: number;
  amenities: string[];
  price_per_night?: number;
  currency: string;
  minimum_stay_nights: number;
  maximum_stay_nights?: number;
  check_in_time?: string;
  check_out_time?: string;
  house_rules: string[];
  cancellation_policy?: string;
  images_urls: string[];
  booking_url?: string;
  contact_info?: any;
  availability_calendar?: any;
  rating?: number;
  review_count: number;
  host_info?: any;
  metadata?: any;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserProjectParticipation {
  id: string;
  user_id: string;
  project_id: string;
  participation_status: 'interested' | 'applied' | 'accepted' | 'active' | 'completed' | 'withdrawn';
  role?: string;
  joined_at: string;
  completed_at?: string;
  notes?: string;
  metadata?: any;
}

export interface UserSessionRegistration {
  id: string;
  user_id: string;
  session_id: string;
  registration_status: 'registered' | 'attended' | 'no_show' | 'cancelled';
  registered_at: string;
  attended_at?: string;
  feedback_rating?: number;
  feedback_comment?: string;
  metadata?: any;
}

export interface UserAccommodationBooking {
  id: string;
  user_id: string;
  accommodation_id: string;
  booking_status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_price?: number;
  currency: string;
  external_booking_id?: string;
  booking_url?: string;
  special_requests?: string;
  booking_notes?: string;
  metadata?: any;
}

class ExternalSystemsService {
  // Projects
  async getExternalProjects(filters?: {
    source_system?: string;
    status?: string;
    category?: string;
    difficulty_level?: string;
  }): Promise<ExternalProject[]> {
    let query = supabase.from('external_projects_cache').select('*');

    if (filters?.source_system) {
      query = query.eq('source_system', filters.source_system);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.difficulty_level) {
      query = query.eq('difficulty_level', filters.difficulty_level);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching external projects:', error);
      throw error;
    }

    return data || [];
  }

  async getExternalProject(id: string): Promise<ExternalProject | null> {
    const { data, error } = await supabase
      .from('external_projects_cache')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching external project:', error);
      return null;
    }

    return data;
  }

  async cacheExternalProject(projectData: Omit<ExternalProject, 'id' | 'created_at' | 'updated_at' | 'last_synced_at'>): Promise<ExternalProject> {
    const { data, error } = await supabase
      .from('external_projects_cache')
      .upsert({
        ...projectData,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'external_id,source_system'
      })
      .select()
      .single();

    if (error) {
      console.error('Error caching external project:', error);
      throw error;
    }

    return data;
  }

  // Sessions
  async getExternalSessions(filters?: {
    source_system?: string;
    status?: string;
    category?: string;
    session_type?: string;
    upcoming_only?: boolean;
  }): Promise<ExternalSession[]> {
    let query = supabase.from('external_sessions_cache').select('*');

    if (filters?.source_system) {
      query = query.eq('source_system', filters.source_system);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.session_type) {
      query = query.eq('session_type', filters.session_type);
    }
    if (filters?.upcoming_only) {
      query = query.gte('scheduled_at', new Date().toISOString());
    }

    const { data, error } = await query.order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching external sessions:', error);
      throw error;
    }

    return data || [];
  }

  async getExternalSession(id: string): Promise<ExternalSession | null> {
    const { data, error } = await supabase
      .from('external_sessions_cache')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching external session:', error);
      return null;
    }

    return data;
  }

  async cacheExternalSession(sessionData: Omit<ExternalSession, 'id' | 'created_at' | 'updated_at' | 'last_synced_at'>): Promise<ExternalSession> {
    const { data, error } = await supabase
      .from('external_sessions_cache')
      .upsert({
        ...sessionData,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'external_id,source_system'
      })
      .select()
      .single();

    if (error) {
      console.error('Error caching external session:', error);
      throw error;
    }

    return data;
  }

  // Accommodations
  async getExternalAccommodations(filters?: {
    source_system?: string;
    status?: string;
    accommodation_type?: string;
    location?: string;
    max_price?: number;
  }): Promise<ExternalAccommodation[]> {
    let query = supabase.from('external_accommodations_cache').select('*');

    if (filters?.source_system) {
      query = query.eq('source_system', filters.source_system);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.accommodation_type) {
      query = query.eq('accommodation_type', filters.accommodation_type);
    }
    if (filters?.max_price) {
      query = query.lte('price_per_night', filters.max_price);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching external accommodations:', error);
      throw error;
    }

    return data || [];
  }

  async getExternalAccommodation(id: string): Promise<ExternalAccommodation | null> {
    const { data, error } = await supabase
      .from('external_accommodations_cache')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching external accommodation:', error);
      return null;
    }

    return data;
  }

  async cacheExternalAccommodation(accommodationData: Omit<ExternalAccommodation, 'id' | 'created_at' | 'updated_at' | 'last_synced_at'>): Promise<ExternalAccommodation> {
    const { data, error } = await supabase
      .from('external_accommodations_cache')
      .upsert({
        ...accommodationData,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'external_id,source_system'
      })
      .select()
      .single();

    if (error) {
      console.error('Error caching external accommodation:', error);
      throw error;
    }

    return data;
  }

  // User Participations and Bookings
  async getUserProjectParticipations(userId: string): Promise<UserProjectParticipation[]> {
    const { data, error } = await supabase
      .from('user_project_participations')
      .select(`
        *,
        external_projects_cache (*)
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching user project participations:', error);
      throw error;
    }

    return data || [];
  }

  async joinProject(userId: string, projectId: string, role?: string): Promise<UserProjectParticipation> {
    const { data, error } = await supabase
      .from('user_project_participations')
      .insert({
        user_id: userId,
        project_id: projectId,
        participation_status: 'interested',
        role: role
      })
      .select()
      .single();

    if (error) {
      console.error('Error joining project:', error);
      throw error;
    }

    return data;
  }

  async getUserSessionRegistrations(userId: string): Promise<UserSessionRegistration[]> {
    const { data, error } = await supabase
      .from('user_session_registrations')
      .select(`
        *,
        external_sessions_cache (*)
      `)
      .eq('user_id', userId)
      .order('registered_at', { ascending: false });

    if (error) {
      console.error('Error fetching user session registrations:', error);
      throw error;
    }

    return data || [];
  }

  async registerForSession(userId: string, sessionId: string): Promise<UserSessionRegistration> {
    const { data, error } = await supabase
      .from('user_session_registrations')
      .insert({
        user_id: userId,
        session_id: sessionId,
        registration_status: 'registered'
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering for session:', error);
      throw error;
    }

    return data;
  }

  async getUserAccommodationBookings(userId: string): Promise<UserAccommodationBooking[]> {
    const { data, error } = await supabase
      .from('user_accommodation_bookings')
      .select(`
        *,
        external_accommodations_cache (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user accommodation bookings:', error);
      throw error;
    }

    return data || [];
  }

  async bookAccommodation(
    userId: string, 
    accommodationId: string, 
    checkInDate: string, 
    checkOutDate: string, 
    guestCount: number,
    specialRequests?: string
  ): Promise<UserAccommodationBooking> {
    const { data, error } = await supabase
      .from('user_accommodation_bookings')
      .insert({
        user_id: userId,
        accommodation_id: accommodationId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guest_count: guestCount,
        special_requests: specialRequests,
        booking_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error booking accommodation:', error);
      throw error;
    }

    return data;
  }

  // Sync functions (to be called by background jobs)
  async syncAllExternalData(): Promise<void> {
    console.log('Starting external data sync...');
    
    try {
      // In a real implementation, these would call actual external APIs
      await this.syncExternalProjects();
      await this.syncExternalSessions();
      await this.syncExternalAccommodations();
      
      console.log('External data sync completed successfully');
    } catch (error) {
      console.error('Error during external data sync:', error);
      throw error;
    }
  }

  private async syncExternalProjects(): Promise<void> {
    // Mock implementation - in real app, this would call external APIs
    console.log('Syncing external projects...');
    
    // Example: Sync from GitHub, GitLab, etc.
    const mockProjects = [
      {
        external_id: 'github-123',
        source_system: 'github',
        title: 'React Native学習プロジェクト',
        description: 'React Nativeを使ったモバイルアプリ開発を学ぶプロジェクト',
        status: 'active' as const,
        difficulty_level: 'intermediate' as const,
        category: 'mobile_development',
        tags: ['React Native', 'JavaScript', 'Mobile'],
        max_participants: 10,
        current_participants: 3,
        skills_learned: ['React Native', 'Mobile UI/UX', 'API Integration'],
        repository_url: 'https://github.com/example/react-native-learning'
      }
    ];

    for (const project of mockProjects) {
      await this.cacheExternalProject(project);
    }
  }

  private async syncExternalSessions(): Promise<void> {
    // Mock implementation
    console.log('Syncing external sessions...');
    
    const mockSessions = [
      {
        external_id: 'zoom-456',
        source_system: 'zoom',
        title: 'JavaScript基礎ワークショップ',
        description: 'JavaScript の基本的な概念を学ぶワークショップ',
        session_type: 'workshop' as const,
        status: 'scheduled' as const,
        difficulty_level: 'beginner' as const,
        category: 'programming',
        tags: ['JavaScript', 'Programming', 'Beginner'],
        scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 120,
        max_participants: 20,
        current_participants: 8,
        language: 'ja',
        session_url: 'https://zoom.us/j/123456789'
      }
    ];

    for (const session of mockSessions) {
      await this.cacheExternalSession(session);
    }
  }

  private async syncExternalAccommodations(): Promise<void> {
    // Mock implementation
    console.log('Syncing external accommodations...');
    
    const mockAccommodations = [
      {
        external_id: 'airbnb-789',
        source_system: 'airbnb',
        name: '東京中心部のモダンアパート',
        description: '渋谷駅から徒歩5分の便利な立地',
        accommodation_type: 'apartment' as const,
        status: 'available' as const,
        location: {
          address: '東京都渋谷区',
          city: '東京',
          country: '日本',
          coordinates: { lat: 35.6580, lng: 139.7016 }
        },
        capacity: 4,
        amenities: ['WiFi', 'キッチン', '洗濯機', 'エアコン'],
        price_per_night: 8000,
        currency: 'JPY',
        minimum_stay_nights: 2,
        house_rules: ['禁煙', '静かに', 'ペット不可'],
        images_urls: ['https://example.com/image1.jpg'],
        rating: 4.8,
        review_count: 127
      }
    ];

    for (const accommodation of mockAccommodations) {
      await this.cacheExternalAccommodation(accommodation);
    }
  }
}

export const externalSystemsService = new ExternalSystemsService();
export default externalSystemsService;