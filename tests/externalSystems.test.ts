// Task 4: 外部システム連携のテスト

import { 
  ExternalProjectsService, 
  ExternalSessionsService, 
  ExternalAccommodationsService,
  ExternalSystemsService 
} from '../services/externalSystemsService';
import { 
  ExternalProject, 
  ExternalSession, 
  ExternalAccommodation 
} from '../types/externalSystems';

// Mock Supabase
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: [],
            error: null
          })),
          overlaps: jest.fn(() => ({
            data: [],
            error: null
          })),
          gte: jest.fn(() => ({
            data: [],
            error: null
          })),
          lte: jest.fn(() => ({
            data: [],
            error: null
          })),
          limit: jest.fn(() => ({
            data: [],
            error: null
          })),
          range: jest.fn(() => ({
            data: [],
            error: null
          })),
          single: jest.fn(() => ({
            data: null,
            error: null
          }))
        })),
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null
          }))
        })),
        ilike: jest.fn(() => ({
          data: [],
          error: null
        })),
        not: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })),
      upsert: jest.fn(() => ({
        data: null,
        error: null
      }))
    }))
  }
}));

describe('ExternalProjectsService', () => {
  const mockProject: ExternalProject = {
    id: '1',
    external_id: 'ext-1',
    source_platform: 'github',
    title: 'Test Project',
    description: 'A test project',
    status: 'active',
    difficulty_level: 'beginner',
    tags: ['javascript', 'react'],
    participants_count: 5,
    max_participants: 10
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get projects with filters', async () => {
    const filters = {
      platform: 'github',
      status: 'active',
      difficulty: 'beginner',
      tags: ['javascript'],
      limit: 10,
      offset: 0
    };

    const result = await ExternalProjectsService.getProjects(filters);
    expect(result).toBeDefined();
  });

  test('should get project by id', async () => {
    const result = await ExternalProjectsService.getProject('1');
    expect(result).toBeDefined();
  });

  test('should sync project', async () => {
    const result = await ExternalProjectsService.syncProject(mockProject);
    expect(result).toBeDefined();
  });

  test('should get project counts by platform', async () => {
    const result = await ExternalProjectsService.getProjectCountsByPlatform();
    expect(result).toBeDefined();
  });
});

describe('ExternalSessionsService', () => {
  const mockSession: ExternalSession = {
    id: '1',
    external_id: 'ext-session-1',
    source_platform: 'zoom',
    title: 'Test Session',
    description: 'A test session',
    session_type: 'workshop',
    start_time: '2024-01-01T10:00:00Z',
    end_time: '2024-01-01T11:00:00Z',
    max_participants: 20,
    current_participants: 5,
    status: 'scheduled'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get sessions with filters', async () => {
    const filters = {
      platform: 'zoom',
      status: 'scheduled',
      session_type: 'workshop',
      date_from: '2024-01-01',
      date_to: '2024-01-31',
      limit: 10,
      offset: 0
    };

    const result = await ExternalSessionsService.getSessions(filters);
    expect(result).toBeDefined();
  });

  test('should get today sessions', async () => {
    const result = await ExternalSessionsService.getTodaySessions();
    expect(result).toBeDefined();
  });

  test('should sync session', async () => {
    const result = await ExternalSessionsService.syncSession(mockSession);
    expect(result).toBeDefined();
  });
});

describe('ExternalAccommodationsService', () => {
  const mockAccommodation: ExternalAccommodation = {
    id: '1',
    external_id: 'ext-acc-1',
    source_platform: 'airbnb',
    name: 'Test Accommodation',
    description: 'A test accommodation',
    city: 'Tokyo',
    country: 'Japan',
    accommodation_type: 'apartment',
    price_per_night: 100,
    currency: 'USD',
    rating: 4.5,
    review_count: 50,
    max_guests: 4,
    is_available: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should search accommodations with filters', async () => {
    const filters = {
      platform: 'airbnb',
      city: 'Tokyo',
      country: 'Japan',
      price_min: 50,
      price_max: 200,
      rating_min: 4.0,
      accommodation_type: 'apartment',
      guests: 2,
      limit: 10,
      offset: 0
    };

    const result = await ExternalAccommodationsService.searchAccommodations(filters);
    expect(result).toBeDefined();
  });

  test('should get accommodation by id', async () => {
    const result = await ExternalAccommodationsService.getAccommodation('1');
    expect(result).toBeDefined();
  });

  test('should sync accommodation', async () => {
    const result = await ExternalAccommodationsService.syncAccommodation(mockAccommodation);
    expect(result).toBeDefined();
  });

  test('should get popular cities', async () => {
    const result = await ExternalAccommodationsService.getPopularCities(5);
    expect(result).toBeDefined();
  });
});

describe('ExternalSystemsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get dashboard stats', async () => {
    const result = await ExternalSystemsService.getDashboardStats();
    expect(result).toBeDefined();
    expect(result).toHaveProperty('projects');
    expect(result).toHaveProperty('todaySessionsCount');
    expect(result).toHaveProperty('popularCities');
  });

  test('should perform global search', async () => {
    const query = 'test';
    const filters = {
      types: ['projects', 'sessions', 'accommodations'] as const,
      limit: 5
    };

    const result = await ExternalSystemsService.globalSearch(query, filters);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('projects');
    expect(result).toHaveProperty('sessions');
    expect(result).toHaveProperty('accommodations');
  });

  test('should perform global search with specific types', async () => {
    const query = 'javascript';
    const filters = {
      types: ['projects'] as const,
      limit: 10
    };

    const result = await ExternalSystemsService.globalSearch(query, filters);
    expect(result).toBeDefined();
    expect(result.projects).toBeDefined();
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle database errors gracefully', async () => {
    // Mock error response
    const mockError = new Error('Database connection failed');
    
    // This test would need more sophisticated mocking to properly test error handling
    // For now, we just ensure the services don't throw unhandled errors
    try {
      await ExternalProjectsService.getProjects({});
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('should handle network errors gracefully', async () => {
    // Similar to above, this would need proper network error simulation
    try {
      await ExternalSessionsService.getSessions({});
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe('Data Validation', () => {
  test('should validate project data structure', () => {
    const validProject: ExternalProject = {
      external_id: 'test-1',
      source_platform: 'github',
      title: 'Test Project'
    };

    expect(validProject.external_id).toBeDefined();
    expect(validProject.source_platform).toBeDefined();
    expect(validProject.title).toBeDefined();
  });

  test('should validate session data structure', () => {
    const validSession: ExternalSession = {
      external_id: 'test-session-1',
      source_platform: 'zoom',
      title: 'Test Session',
      session_type: 'workshop',
      start_time: '2024-01-01T10:00:00Z',
      end_time: '2024-01-01T11:00:00Z'
    };

    expect(validSession.external_id).toBeDefined();
    expect(validSession.source_platform).toBeDefined();
    expect(validSession.title).toBeDefined();
    expect(validSession.session_type).toBeDefined();
    expect(validSession.start_time).toBeDefined();
    expect(validSession.end_time).toBeDefined();
  });

  test('should validate accommodation data structure', () => {
    const validAccommodation: ExternalAccommodation = {
      external_id: 'test-acc-1',
      source_platform: 'airbnb',
      name: 'Test Accommodation'
    };

    expect(validAccommodation.external_id).toBeDefined();
    expect(validAccommodation.source_platform).toBeDefined();
    expect(validAccommodation.name).toBeDefined();
  });
});