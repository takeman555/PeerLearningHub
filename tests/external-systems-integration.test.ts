/**
 * 外部システム連携テスト
 * 要件 3.3: 外部システム連携のテスト（宿泊予約・学習リソース）
 */

import { externalSystemsService } from '../services/externalSystemsService';
import { supabase } from '../config/supabase';

// Mock Supabase
jest.mock('../config/supabase');

describe('外部システム連携テスト', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('外部プロジェクト連携', () => {
    const mockProject = {
      id: 'project-1',
      external_id: 'github-123',
      source_system: 'github',
      title: 'React Native学習プロジェクト',
      description: 'React Nativeを使ったモバイルアプリ開発を学ぶプロジェクト',
      status: 'active' as const,
      difficulty_level: 'intermediate' as const,
      category: 'mobile_development',
      tags: ['React Native', 'JavaScript', 'Mobile'],
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      max_participants: 10,
      current_participants: 3,
      requirements: 'JavaScript基礎知識',
      skills_learned: ['React Native', 'Mobile UI/UX', 'API Integration'],
      project_url: 'https://example.com/project',
      repository_url: 'https://github.com/example/react-native-learning',
      contact_info: { email: 'contact@example.com' },
      metadata: { difficulty_score: 7 },
      last_synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('外部プロジェクト一覧を取得できる', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockProject],
              error: null,
            }),
          }),
          order: jest.fn().mockResolvedValue({
            data: [mockProject],
            error: null,
          }),
        }),
      });

      const projects = await externalSystemsService.getExternalProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0]).toEqual(mockProject);
      expect(mockSupabase.from).toHaveBeenCalledWith('external_projects_cache');
    });

    it('フィルター条件で外部プロジェクトを検索できる', async () => {
      const filters = {
        source_system: 'github',
        status: 'active',
        category: 'mobile_development',
        difficulty_level: 'intermediate',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [mockProject],
            error: null,
          }),
        }),
      });

      const projects = await externalSystemsService.getExternalProjects(filters);

      expect(projects).toHaveLength(1);
      expect(projects[0].source_system).toBe('github');
      expect(projects[0].status).toBe('active');
    });

    it('特定の外部プロジェクトを取得できる', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProject,
              error: null,
            }),
          }),
        }),
      });

      const project = await externalSystemsService.getExternalProject('project-1');

      expect(project).toEqual(mockProject);
    });

    it('存在しないプロジェクトでnullを返す', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Project not found' },
            }),
          }),
        }),
      });

      const project = await externalSystemsService.getExternalProject('nonexistent');

      expect(project).toBeNull();
    });

    it('外部プロジェクトをキャッシュできる', async () => {
      const projectData = {
        external_id: 'github-456',
        source_system: 'github',
        title: '新しいプロジェクト',
        description: 'テスト用プロジェクト',
        status: 'active' as const,
        difficulty_level: 'beginner' as const,
        tags: ['test'],
        current_participants: 0,
        skills_learned: ['Testing'],
      };

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...projectData, id: 'project-2' },
              error: null,
            }),
          }),
        }),
      });

      const cachedProject = await externalSystemsService.cacheExternalProject(projectData);

      expect(cachedProject.external_id).toBe('github-456');
      expect(cachedProject.title).toBe('新しいプロジェクト');
    });

    it('プロジェクト参加機能が動作する', async () => {
      const mockParticipation = {
        id: 'participation-1',
        user_id: mockUserId,
        project_id: 'project-1',
        participation_status: 'interested' as const,
        role: 'developer',
        joined_at: new Date().toISOString(),
        notes: null,
        metadata: null,
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockParticipation,
              error: null,
            }),
          }),
        }),
      });

      const participation = await externalSystemsService.joinProject(
        mockUserId,
        'project-1',
        'developer'
      );

      expect(participation.user_id).toBe(mockUserId);
      expect(participation.project_id).toBe('project-1');
      expect(participation.participation_status).toBe('interested');
      expect(participation.role).toBe('developer');
    });

    it('ユーザーのプロジェクト参加履歴を取得できる', async () => {
      const mockParticipations = [
        {
          id: 'participation-1',
          user_id: mockUserId,
          project_id: 'project-1',
          participation_status: 'active',
          role: 'developer',
          joined_at: new Date().toISOString(),
          external_projects_cache: mockProject,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockParticipations,
              error: null,
            }),
          }),
        }),
      });

      const participations = await externalSystemsService.getUserProjectParticipations(mockUserId);

      expect(participations).toHaveLength(1);
      expect(participations[0].user_id).toBe(mockUserId);
      expect(participations[0].external_projects_cache).toEqual(mockProject);
    });
  });

  describe('外部セッション連携', () => {
    const mockSession = {
      id: 'session-1',
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
      session_url: 'https://zoom.us/j/123456789',
      meeting_id: '123456789',
      password: 'password123',
      host_info: { name: 'ホスト太郎', email: 'host@example.com' },
      requirements: 'JavaScript基礎知識',
      materials_url: 'https://example.com/materials',
      recording_url: null,
      metadata: { zoom_room_id: '123456789' },
      last_synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('外部セッション一覧を取得できる', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockSession],
              error: null,
            }),
          }),
          gte: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockSession],
              error: null,
            }),
          }),
          order: jest.fn().mockResolvedValue({
            data: [mockSession],
            error: null,
          }),
        }),
      });

      const sessions = await externalSystemsService.getExternalSessions();

      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toEqual(mockSession);
      expect(mockSupabase.from).toHaveBeenCalledWith('external_sessions_cache');
    });

    it('今後のセッションのみを取得できる', async () => {
      const filters = { upcoming_only: true };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockSession],
              error: null,
            }),
          }),
        }),
      });

      const sessions = await externalSystemsService.getExternalSessions(filters);

      expect(sessions).toHaveLength(1);
      expect(new Date(sessions[0].scheduled_at!)).toBeInstanceOf(Date);
    });

    it('セッションタイプでフィルタリングできる', async () => {
      const filters = {
        session_type: 'workshop',
        status: 'scheduled',
        category: 'programming',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [mockSession],
            error: null,
          }),
        }),
      });

      const sessions = await externalSystemsService.getExternalSessions(filters);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].session_type).toBe('workshop');
    });

    it('特定の外部セッションを取得できる', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSession,
              error: null,
            }),
          }),
        }),
      });

      const session = await externalSystemsService.getExternalSession('session-1');

      expect(session).toEqual(mockSession);
    });

    it('外部セッションをキャッシュできる', async () => {
      const sessionData = {
        external_id: 'zoom-789',
        source_system: 'zoom',
        title: '新しいワークショップ',
        description: 'テスト用ワークショップ',
        session_type: 'seminar' as const,
        status: 'scheduled' as const,
        difficulty_level: 'intermediate' as const,
        tags: ['test'],
        current_participants: 0,
        language: 'en',
      };

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...sessionData, id: 'session-2' },
              error: null,
            }),
          }),
        }),
      });

      const cachedSession = await externalSystemsService.cacheExternalSession(sessionData);

      expect(cachedSession.external_id).toBe('zoom-789');
      expect(cachedSession.title).toBe('新しいワークショップ');
    });

    it('セッション登録機能が動作する', async () => {
      const mockRegistration = {
        id: 'registration-1',
        user_id: mockUserId,
        session_id: 'session-1',
        registration_status: 'registered' as const,
        registered_at: new Date().toISOString(),
        attended_at: null,
        feedback_rating: null,
        feedback_comment: null,
        metadata: null,
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockRegistration,
              error: null,
            }),
          }),
        }),
      });

      const registration = await externalSystemsService.registerForSession(
        mockUserId,
        'session-1'
      );

      expect(registration.user_id).toBe(mockUserId);
      expect(registration.session_id).toBe('session-1');
      expect(registration.registration_status).toBe('registered');
    });

    it('ユーザーのセッション登録履歴を取得できる', async () => {
      const mockRegistrations = [
        {
          id: 'registration-1',
          user_id: mockUserId,
          session_id: 'session-1',
          registration_status: 'registered',
          registered_at: new Date().toISOString(),
          external_sessions_cache: mockSession,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockRegistrations,
              error: null,
            }),
          }),
        }),
      });

      const registrations = await externalSystemsService.getUserSessionRegistrations(mockUserId);

      expect(registrations).toHaveLength(1);
      expect(registrations[0].user_id).toBe(mockUserId);
      expect(registrations[0].external_sessions_cache).toEqual(mockSession);
    });
  });

  describe('外部宿泊施設連携', () => {
    const mockAccommodation = {
      id: 'accommodation-1',
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
      maximum_stay_nights: 30,
      check_in_time: '15:00',
      check_out_time: '11:00',
      house_rules: ['禁煙', '静かに', 'ペット不可'],
      cancellation_policy: '24時間前まで無料キャンセル',
      images_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      booking_url: 'https://airbnb.com/rooms/123',
      contact_info: { host_name: 'ホスト花子', phone: '+81-90-1234-5678' },
      availability_calendar: { available_dates: [] },
      rating: 4.8,
      review_count: 127,
      host_info: { name: 'ホスト花子', response_rate: 95 },
      metadata: { airbnb_listing_id: '123456' },
      last_synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('外部宿泊施設一覧を取得できる', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockAccommodation],
              error: null,
            }),
          }),
          lte: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockAccommodation],
              error: null,
            }),
          }),
          order: jest.fn().mockResolvedValue({
            data: [mockAccommodation],
            error: null,
          }),
        }),
      });

      const accommodations = await externalSystemsService.getExternalAccommodations();

      expect(accommodations).toHaveLength(1);
      expect(accommodations[0]).toEqual(mockAccommodation);
      expect(mockSupabase.from).toHaveBeenCalledWith('external_accommodations_cache');
    });

    it('価格でフィルタリングできる', async () => {
      const filters = {
        max_price: 10000,
        status: 'available',
        accommodation_type: 'apartment',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockAccommodation],
              error: null,
            }),
          }),
        }),
      });

      const accommodations = await externalSystemsService.getExternalAccommodations(filters);

      expect(accommodations).toHaveLength(1);
      expect(accommodations[0].price_per_night).toBeLessThanOrEqual(10000);
    });

    it('特定の外部宿泊施設を取得できる', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAccommodation,
              error: null,
            }),
          }),
        }),
      });

      const accommodation = await externalSystemsService.getExternalAccommodation('accommodation-1');

      expect(accommodation).toEqual(mockAccommodation);
    });

    it('外部宿泊施設をキャッシュできる', async () => {
      const accommodationData = {
        external_id: 'airbnb-999',
        source_system: 'airbnb',
        name: '新しいアパート',
        description: 'テスト用宿泊施設',
        accommodation_type: 'room' as const,
        status: 'available' as const,
        amenities: ['WiFi'],
        price_per_night: 5000,
        currency: 'JPY',
        minimum_stay_nights: 1,
        house_rules: ['禁煙'],
        images_urls: [],
        rating: 4.0,
        review_count: 10,
      };

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...accommodationData, id: 'accommodation-2' },
              error: null,
            }),
          }),
        }),
      });

      const cachedAccommodation = await externalSystemsService.cacheExternalAccommodation(accommodationData);

      expect(cachedAccommodation.external_id).toBe('airbnb-999');
      expect(cachedAccommodation.name).toBe('新しいアパート');
    });

    it('宿泊施設予約機能が動作する', async () => {
      const checkInDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const checkOutDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const mockBooking = {
        id: 'booking-1',
        user_id: mockUserId,
        accommodation_id: 'accommodation-1',
        booking_status: 'pending' as const,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guest_count: 2,
        total_price: 24000,
        currency: 'JPY',
        external_booking_id: null,
        booking_url: null,
        special_requests: 'レイトチェックイン希望',
        booking_notes: null,
        metadata: null,
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            }),
          }),
        }),
      });

      const booking = await externalSystemsService.bookAccommodation(
        mockUserId,
        'accommodation-1',
        checkInDate,
        checkOutDate,
        2,
        'レイトチェックイン希望'
      );

      expect(booking.user_id).toBe(mockUserId);
      expect(booking.accommodation_id).toBe('accommodation-1');
      expect(booking.guest_count).toBe(2);
      expect(booking.special_requests).toBe('レイトチェックイン希望');
    });

    it('ユーザーの宿泊予約履歴を取得できる', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          user_id: mockUserId,
          accommodation_id: 'accommodation-1',
          booking_status: 'confirmed',
          check_in_date: '2024-01-15',
          check_out_date: '2024-01-18',
          guest_count: 2,
          external_accommodations_cache: mockAccommodation,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockBookings,
              error: null,
            }),
          }),
        }),
      });

      const bookings = await externalSystemsService.getUserAccommodationBookings(mockUserId);

      expect(bookings).toHaveLength(1);
      expect(bookings[0].user_id).toBe(mockUserId);
      expect(bookings[0].external_accommodations_cache).toEqual(mockAccommodation);
    });
  });

  describe('データ同期機能', () => {
    it('全外部データの同期が成功する', async () => {
      // Mock successful sync operations
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {},
              error: null,
            }),
          }),
        }),
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await expect(
        externalSystemsService.syncAllExternalData()
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Starting external data sync...');
      expect(consoleSpy).toHaveBeenCalledWith('External data sync completed successfully');

      consoleSpy.mockRestore();
    });

    it('同期エラーを適切に処理する', async () => {
      // Mock sync error
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Sync failed')),
          }),
        }),
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        externalSystemsService.syncAllExternalData()
      ).rejects.toThrow('Sync failed');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error during external data sync:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('エラーハンドリング', () => {
    it('データベースエラーを適切に処理する', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        }),
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        externalSystemsService.getExternalProjects()
      ).rejects.toThrow('Database connection failed');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching external projects:',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('ネットワークエラーを適切に処理する', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Network timeout')),
          }),
        }),
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        externalSystemsService.joinProject(mockUserId, 'project-1')
      ).rejects.toThrow('Network timeout');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error joining project:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('無効なデータでのキャッシュエラーを処理する', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Invalid data format' },
            }),
          }),
        }),
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const invalidProjectData = {
        external_id: '',
        source_system: '',
        title: '',
        status: 'invalid' as any,
        difficulty_level: 'invalid' as any,
        tags: [],
        current_participants: -1,
        skills_learned: [],
      };

      await expect(
        externalSystemsService.cacheExternalProject(invalidProjectData)
      ).rejects.toThrow('Invalid data format');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error caching external project:',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量の外部データ取得が適切な時間内に完了する', async () => {
      const startTime = Date.now();

      // Mock large dataset
      const mockLargeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        external_id: `ext-${i}`,
        source_system: 'test',
        title: `Item ${i}`,
        status: 'active',
        created_at: new Date().toISOString(),
      }));

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockLargeDataset,
            error: null,
          }),
        }),
      });

      const projects = await externalSystemsService.getExternalProjects();
      const endTime = Date.now();

      expect(projects).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('複数の同時リクエストを適切に処理する', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const promises = [
        externalSystemsService.getExternalProjects(),
        externalSystemsService.getExternalSessions(),
        externalSystemsService.getExternalAccommodations(),
      ];

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(3);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});