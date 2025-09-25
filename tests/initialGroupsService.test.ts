import { initialGroupsService } from '../services/initialGroupsService';
import { groupsService } from '../services/groupsService';
import { permissionManager } from '../services/permissionManager';

// Mock the dependencies
jest.mock('../services/groupsService');
jest.mock('../services/permissionManager');

const mockGroupsService = groupsService as jest.Mocked<typeof groupsService>;
const mockPermissionManager = permissionManager as jest.Mocked<typeof permissionManager>;

describe('InitialGroupsService', () => {
  const mockAdminUserId = 'admin-user-123';
  const mockNonAdminUserId = 'user-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInitialGroups', () => {
    it('should successfully create all initial groups for admin user', async () => {
      // Mock permission check to allow admin
      mockPermissionManager.canManageGroups.mockResolvedValue({
        allowed: true,
        reason: 'User is admin'
      });

      // Mock successful group creation
      const mockGroups = [
        { id: '1', name: 'ピアラーニングハブ生成AI部', createdAt: new Date() },
        { id: '2', name: 'さぬきピアラーニングハブゴルフ部', createdAt: new Date() },
        { id: '3', name: 'さぬきピアラーニングハブ英語部', createdAt: new Date() },
        { id: '4', name: 'WAOJEさぬきピアラーニングハブ交流会参加者', createdAt: new Date() },
        { id: '5', name: '香川イノベーションベース', createdAt: new Date() },
        { id: '6', name: 'さぬきピアラーニングハブ居住者', createdAt: new Date() },
        { id: '7', name: '英語キャンプ卒業者', createdAt: new Date() }
      ];

      mockGroupsService.createGroup
        .mockResolvedValueOnce(mockGroups[0] as any)
        .mockResolvedValueOnce(mockGroups[1] as any)
        .mockResolvedValueOnce(mockGroups[2] as any)
        .mockResolvedValueOnce(mockGroups[3] as any)
        .mockResolvedValueOnce(mockGroups[4] as any)
        .mockResolvedValueOnce(mockGroups[5] as any)
        .mockResolvedValueOnce(mockGroups[6] as any);

      const result = await initialGroupsService.createInitialGroups(mockAdminUserId);

      expect(result.success).toBe(true);
      expect(result.createdGroups).toHaveLength(7);
      expect(result.errors).toHaveLength(0);
      expect(result.summary).toContain('Successfully created all 7 initial groups');
      expect(mockGroupsService.createGroup).toHaveBeenCalledTimes(7);
    });

    it('should handle permission denied for non-admin user', async () => {
      // Mock permission check to deny non-admin
      mockPermissionManager.canManageGroups.mockResolvedValue({
        allowed: false,
        reason: 'User is not admin'
      });

      mockGroupsService.createGroup.mockRejectedValue(new Error('Permission denied'));

      const result = await initialGroupsService.createInitialGroups(mockNonAdminUserId);

      expect(result.success).toBe(false);
      expect(result.createdGroups).toHaveLength(0);
      expect(result.errors).toHaveLength(7);
      expect(result.errors[0]).toContain('Permission denied');
    });

    it('should handle partial failures gracefully', async () => {
      // Mock permission check to allow admin
      mockPermissionManager.canManageGroups.mockResolvedValue({
        allowed: true,
        reason: 'User is admin'
      });

      // Mock some successful and some failed group creations
      const mockGroup1 = { id: '1', name: 'ピアラーニングハブ生成AI部', createdAt: new Date() };
      const mockGroup2 = { id: '2', name: 'さぬきピアラーニングハブゴルフ部', createdAt: new Date() };

      mockGroupsService.createGroup
        .mockResolvedValueOnce(mockGroup1 as any)
        .mockResolvedValueOnce(mockGroup2 as any)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockRejectedValueOnce(new Error('Duplicate name'))
        .mockResolvedValueOnce({ id: '5', name: '香川イノベーションベース', createdAt: new Date() } as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ id: '7', name: '英語キャンプ卒業者', createdAt: new Date() } as any);

      const result = await initialGroupsService.createInitialGroups(mockAdminUserId);

      expect(result.success).toBe(true); // Success if at least one group was created
      expect(result.createdGroups).toHaveLength(4);
      expect(result.errors).toHaveLength(3);
      expect(result.summary).toContain('Partially successful: Created 4/7 groups, 3 failed');
    });

    it('should handle complete failure', async () => {
      // Mock permission check to allow admin
      mockPermissionManager.canManageGroups.mockResolvedValue({
        allowed: true,
        reason: 'User is admin'
      });

      // Mock all group creations to fail
      mockGroupsService.createGroup.mockRejectedValue(new Error('Database unavailable'));

      const result = await initialGroupsService.createInitialGroups(mockAdminUserId);

      expect(result.success).toBe(false);
      expect(result.createdGroups).toHaveLength(0);
      expect(result.errors).toHaveLength(7);
      expect(result.summary).toContain('Failed to create any groups');
    });
  });

  describe('checkExistingGroups', () => {
    it('should correctly identify existing and missing groups', async () => {
      const existingGroups = [
        { name: 'ピアラーニングハブ生成AI部' },
        { name: 'さぬきピアラーニングハブゴルフ部' },
        { name: '香川イノベーションベース' }
      ];

      mockGroupsService.getAllGroups.mockResolvedValue({
        groups: existingGroups as any,
        total: existingGroups.length
      });

      const result = await initialGroupsService.checkExistingGroups();

      expect(result.existingGroups).toHaveLength(3);
      expect(result.missingGroups).toHaveLength(4);
      expect(result.allExist).toBe(false);
      expect(result.existingGroups).toContain('ピアラーニングハブ生成AI部');
      expect(result.missingGroups).toContain('さぬきピアラーニングハブ英語部');
    });

    it('should handle case when all groups exist', async () => {
      const allGroups = [
        { name: 'ピアラーニングハブ生成AI部' },
        { name: 'さぬきピアラーニングハブゴルフ部' },
        { name: 'さぬきピアラーニングハブ英語部' },
        { name: 'WAOJEさぬきピアラーニングハブ交流会参加者' },
        { name: '香川イノベーションベース' },
        { name: 'さぬきピアラーニングハブ居住者' },
        { name: '英語キャンプ卒業者' }
      ];

      mockGroupsService.getAllGroups.mockResolvedValue({
        groups: allGroups as any,
        total: allGroups.length
      });

      const result = await initialGroupsService.checkExistingGroups();

      expect(result.existingGroups).toHaveLength(7);
      expect(result.missingGroups).toHaveLength(0);
      expect(result.allExist).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockGroupsService.getAllGroups.mockRejectedValue(new Error('Database error'));

      const result = await initialGroupsService.checkExistingGroups();

      expect(result.existingGroups).toHaveLength(0);
      expect(result.missingGroups).toHaveLength(7);
      expect(result.allExist).toBe(false);
    });
  });

  describe('createMissingGroups', () => {
    it('should create only missing groups', async () => {
      // Mock existing groups check
      const existingGroups = [
        { name: 'ピアラーニングハブ生成AI部' },
        { name: '香川イノベーションベース' }
      ];

      mockGroupsService.getAllGroups.mockResolvedValue({
        groups: existingGroups as any,
        total: existingGroups.length
      });

      // Mock permission check
      mockPermissionManager.canManageGroups.mockResolvedValue({
        allowed: true,
        reason: 'User is admin'
      });

      // Mock successful creation of missing groups
      const mockCreatedGroups = [
        { id: '2', name: 'さぬきピアラーニングハブゴルフ部' },
        { id: '3', name: 'さぬきピアラーニングハブ英語部' },
        { id: '4', name: 'WAOJEさぬきピアラーニングハブ交流会参加者' },
        { id: '6', name: 'さぬきピアラーニングハブ居住者' },
        { id: '7', name: '英語キャンプ卒業者' }
      ];

      mockGroupsService.createGroup
        .mockResolvedValueOnce(mockCreatedGroups[0] as any)
        .mockResolvedValueOnce(mockCreatedGroups[1] as any)
        .mockResolvedValueOnce(mockCreatedGroups[2] as any)
        .mockResolvedValueOnce(mockCreatedGroups[3] as any)
        .mockResolvedValueOnce(mockCreatedGroups[4] as any);

      const result = await initialGroupsService.createMissingGroups(mockAdminUserId);

      expect(result.success).toBe(true);
      expect(result.createdGroups).toHaveLength(5);
      expect(result.skippedGroups).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.summary).toContain('Setup complete! Created 5 new groups, 2 already existed');
    });

    it('should handle case when all groups already exist', async () => {
      const allGroups = [
        { name: 'ピアラーニングハブ生成AI部' },
        { name: 'さぬきピアラーニングハブゴルフ部' },
        { name: 'さぬきピアラーニングハブ英語部' },
        { name: 'WAOJEさぬきピアラーニングハブ交流会参加者' },
        { name: '香川イノベーションベース' },
        { name: 'さぬきピアラーニングハブ居住者' },
        { name: '英語キャンプ卒業者' }
      ];

      mockGroupsService.getAllGroups.mockResolvedValue({
        groups: allGroups as any,
        total: allGroups.length
      });

      const result = await initialGroupsService.createMissingGroups(mockAdminUserId);

      expect(result.success).toBe(true);
      expect(result.createdGroups).toHaveLength(0);
      expect(result.skippedGroups).toHaveLength(7);
      expect(result.errors).toHaveLength(0);
      expect(result.summary).toContain('All initial groups already exist');
    });
  });

  describe('validateInitialGroups', () => {
    it('should validate that all groups exist', async () => {
      const allGroups = [
        { name: 'ピアラーニングハブ生成AI部' },
        { name: 'さぬきピアラーニングハブゴルフ部' },
        { name: 'さぬきピアラーニングハブ英語部' },
        { name: 'WAOJEさぬきピアラーニングハブ交流会参加者' },
        { name: '香川イノベーションベース' },
        { name: 'さぬきピアラーニングハブ居住者' },
        { name: '英語キャンプ卒業者' }
      ];

      mockGroupsService.getAllGroups.mockResolvedValue({
        groups: allGroups as any,
        total: allGroups.length
      });

      const result = await initialGroupsService.validateInitialGroups();

      expect(result.isValid).toBe(true);
      expect(result.existingCount).toBe(7);
      expect(result.missingGroups).toHaveLength(0);
      expect(result.report).toContain('All 7 initial groups are present and active');
    });

    it('should identify missing groups', async () => {
      const partialGroups = [
        { name: 'ピアラーニングハブ生成AI部' },
        { name: '香川イノベーションベース' }
      ];

      mockGroupsService.getAllGroups.mockResolvedValue({
        groups: partialGroups as any,
        total: partialGroups.length
      });

      const result = await initialGroupsService.validateInitialGroups();

      expect(result.isValid).toBe(false);
      expect(result.existingCount).toBe(2);
      expect(result.missingGroups).toHaveLength(5);
      expect(result.report).toContain('Missing 5 groups');
    });
  });

  describe('getInitialGroupsList', () => {
    it('should return the list of initial groups', () => {
      const groups = initialGroupsService.getInitialGroupsList();

      expect(groups).toHaveLength(7);
      expect(groups[0].name).toBe('ピアラーニングハブ生成AI部');
      expect(groups[1].name).toBe('さぬきピアラーニングハブゴルフ部');
      expect(groups[6].name).toBe('英語キャンプ卒業者');
      
      // Verify all groups have required properties
      groups.forEach(group => {
        expect(group.name).toBeDefined();
        expect(group.description).toBeDefined();
        expect(group.externalLink).toBeDefined();
        expect(group.externalLink).toMatch(/^https?:\/\//);
      });
    });
  });
});