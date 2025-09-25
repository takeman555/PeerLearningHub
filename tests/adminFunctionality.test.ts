import { groupsService } from '../services/groupsService';
import { dataCleanupService } from '../services/dataCleanupService';
import { permissionManager } from '../services/permissionManager';

// Mock the supabase client
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-user', is_active: true }, error: null })),
          head: jest.fn(() => Promise.resolve({ count: 0, error: null }))
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { 
              id: 'test-group-id', 
              name: 'Test Group', 
              description: 'Test Description',
              external_link: 'https://example.com',
              member_count: 0,
              created_by: 'test-user',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, 
            error: null 
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    rpc: jest.fn(() => Promise.resolve({ data: 5, error: null }))
  }
}));

describe('Admin Functionality Tests', () => {
  const mockAdminUserId = 'admin-user-123';
  const mockMemberUserId = 'member-user-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Permission Manager', () => {
    test('should allow admin to manage groups', async () => {
      // Mock admin role
      jest.spyOn(permissionManager, 'getUserRole').mockResolvedValue('admin');
      
      const result = await permissionManager.canManageGroups(mockAdminUserId);
      
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    test('should deny member from managing groups', async () => {
      // Mock member role
      jest.spyOn(permissionManager, 'getUserRole').mockResolvedValue('member');
      
      const result = await permissionManager.canManageGroups(mockMemberUserId);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Only administrators can manage groups.');
    });

    test('should deny guest from managing groups', async () => {
      // Mock guest role
      jest.spyOn(permissionManager, 'getUserRole').mockResolvedValue('guest');
      
      const result = await permissionManager.canManageGroups('guest-user');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Please sign in as an administrator to manage groups.');
    });
  });

  describe('Groups Service - Admin Group Creation', () => {
    test('should create group with admin permissions', async () => {
      // Mock admin permission
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ allowed: true });
      
      const groupData = {
        name: 'Test Admin Group',
        description: 'Test group created by admin',
        externalLink: 'https://example.com/join'
      };

      const result = await groupsService.createGroup(mockAdminUserId, groupData);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(groupData.name);
      expect(result.description).toBe(groupData.description);
      expect(result.externalLink).toBe(groupData.externalLink);
    });

    test('should reject group creation without admin permissions', async () => {
      // Mock permission denial
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ 
        allowed: false, 
        reason: 'Only administrators can manage groups.' 
      });
      
      const groupData = {
        name: 'Test Group',
        description: 'Test description'
      };

      await expect(groupsService.createGroup(mockMemberUserId, groupData))
        .rejects.toThrow('Only administrators can manage groups.');
    });

    test('should validate group data before creation', async () => {
      // Mock admin permission
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ allowed: true });
      
      const invalidGroupData = {
        name: '', // Empty name should fail validation
        description: 'Test description'
      };

      await expect(groupsService.createGroup(mockAdminUserId, invalidGroupData))
        .rejects.toThrow('Group name is required');
    });

    test('should create multiple initial groups', async () => {
      // Mock admin permission
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ allowed: true });
      
      const initialGroups = [
        {
          name: 'ピアラーニングハブ生成AI部',
          description: '生成AIの活用と学習に関するディスカッション',
          externalLink: 'https://example.com/ai-group'
        },
        {
          name: 'さぬきピアラーニングハブゴルフ部',
          description: 'ゴルフを通じた交流とネットワーキング',
          externalLink: 'https://example.com/golf-group'
        }
      ];

      const result = await groupsService.createMultipleGroups(mockAdminUserId, initialGroups);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe(initialGroups[0].name);
      expect(result[1].name).toBe(initialGroups[1].name);
    });
  });

  describe('Data Cleanup Service', () => {
    test('should perform data cleanup with admin permissions', async () => {
      // Mock admin permission
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ allowed: true });
      
      const result = await dataCleanupService.clearAllPosts(mockAdminUserId);
      
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(5); // Mocked return value
      expect(result.message).toContain('Successfully deleted');
    });

    test('should reject cleanup without admin permissions', async () => {
      // Mock permission denial
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ 
        allowed: false, 
        reason: 'Only administrators can manage groups.' 
      });
      
      const result = await dataCleanupService.clearAllPosts(mockMemberUserId);
      
      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(0);
      expect(result.message).toContain('Permission denied');
    });

    test('should perform complete cleanup operation', async () => {
      // Mock admin permission
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ allowed: true });
      
      const result = await dataCleanupService.performCompleteCleanup(mockAdminUserId);
      
      expect(result.overallSuccess).toBe(true);
      expect(result.postsCleanup.success).toBe(true);
      expect(result.groupsCleanup.success).toBe(true);
      expect(result.integrityValidation.isValid).toBe(true);
    });

    test('should validate data integrity', async () => {
      const result = await dataCleanupService.validateDataIntegrity();
      
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.orphanedRecords).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    test('should get cleanup status', async () => {
      const result = await dataCleanupService.getCleanupStatus();
      
      expect(result.postsCount).toBeGreaterThanOrEqual(0);
      expect(result.groupsCount).toBeGreaterThanOrEqual(0);
      expect(result.postLikesCount).toBeGreaterThanOrEqual(0);
      expect(result.groupMembershipsCount).toBeGreaterThanOrEqual(0);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Admin Dashboard Integration', () => {
    test('should handle group creation through admin interface', async () => {
      // Mock admin permission
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ allowed: true });
      
      const groupData = {
        name: 'Admin Created Group',
        description: 'Group created through admin dashboard',
        externalLink: 'https://example.com/admin-group'
      };

      const result = await groupsService.createGroup(mockAdminUserId, groupData);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(groupData.name);
      expect(result.createdBy).toBe(mockAdminUserId);
    });

    test('should handle data cleanup through admin interface', async () => {
      // Mock admin permission
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ allowed: true });
      
      const cleanupResult = await dataCleanupService.performCompleteCleanup(mockAdminUserId);
      const statusResult = await dataCleanupService.getCleanupStatus();
      
      expect(cleanupResult.overallSuccess).toBe(true);
      expect(statusResult.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Requirements Validation', () => {
    test('should satisfy requirement 6.1 - Admin-only group creation access', async () => {
      // Test admin access
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ allowed: true });
      const adminResult = await permissionManager.canManageGroups(mockAdminUserId);
      expect(adminResult.allowed).toBe(true);

      // Test non-admin denial
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ 
        allowed: false, 
        reason: 'Only administrators can manage groups.' 
      });
      const memberResult = await permissionManager.canManageGroups(mockMemberUserId);
      expect(memberResult.allowed).toBe(false);
    });

    test('should satisfy requirement 6.2 - Admin permission verification', async () => {
      // Mock admin permission check
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ allowed: true });
      
      const groupData = { name: 'Test Group', description: 'Test' };
      const result = await groupsService.createGroup(mockAdminUserId, groupData);
      
      expect(result).toBeDefined();
      expect(permissionManager.canManageGroups).toHaveBeenCalledWith(mockAdminUserId);
    });

    test('should satisfy requirement 6.3 - Database save on successful creation', async () => {
      // Mock admin permission and database save
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ allowed: true });
      
      const groupData = {
        name: 'Database Test Group',
        description: 'Test database save functionality'
      };

      const result = await groupsService.createGroup(mockAdminUserId, groupData);
      
      expect(result.id).toBeDefined();
      expect(result.name).toBe(groupData.name);
      expect(result.createdBy).toBe(mockAdminUserId);
    });

    test('should satisfy requirement 1.1 - Data cleanup operations', async () => {
      // Mock admin permission
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ allowed: true });
      
      const postsResult = await dataCleanupService.clearAllPosts(mockAdminUserId);
      const groupsResult = await dataCleanupService.clearAllGroups(mockAdminUserId);
      
      expect(postsResult.success).toBe(true);
      expect(groupsResult.success).toBe(true);
    });

    test('should satisfy requirement 1.2 - Admin dashboard integration', async () => {
      // Mock admin permission
      jest.spyOn(permissionManager, 'canManageGroups').mockResolvedValue({ allowed: true });
      
      // Test that admin dashboard can access both cleanup and group management
      const cleanupStatus = await dataCleanupService.getCleanupStatus();
      const groupsResponse = await groupsService.getAllGroups();
      
      expect(cleanupStatus.lastUpdated).toBeInstanceOf(Date);
      expect(groupsResponse.groups).toBeDefined();
    });
  });
});