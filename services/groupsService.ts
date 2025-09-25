import { supabase } from '../config/supabase';
import { permissionManager } from './permissionManager';

// Group interfaces
export interface Group {
  id: string;
  name: string;
  description?: string;
  externalLink?: string;
  memberCount: number;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Creator information from join
  creatorName?: string;
  creatorEmail?: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  externalLink?: string;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  externalLink?: string;
  isActive?: boolean;
}

export interface GroupsResponse {
  groups: Group[];
  total: number;
}

/**
 * Groups Service
 * Handles group management with proper permission checks and external link validation
 * Requirements: 5.2, 5.3, 6.5 - Group CRUD operations, external link management, data validation
 */
class GroupsService {
  /**
   * Create a new group with permission validation
   * Requirements: 6.1, 6.2, 6.5 - Only admins can create groups
   */
  async createGroup(userId: string, groupData: CreateGroupData): Promise<Group> {
    try {
      // Check permission first
      const permission = await permissionManager.canManageGroups(userId);
      if (!permission.allowed) {
        throw new Error(permission.reason || 'Permission denied');
      }

      // Validate group data
      const validationError = this.validateGroupData(groupData);
      if (validationError) {
        throw new Error(validationError);
      }

      // Validate external link if provided
      if (groupData.externalLink) {
        const linkValidation = this.validateExternalLink(groupData.externalLink);
        if (!linkValidation.isValid) {
          throw new Error(linkValidation.error || 'Invalid external link');
        }
      }

      // Insert group into database
      const { data: group, error } = await supabase
        .from('groups')
        .insert({
          name: groupData.name.trim(),
          description: groupData.description?.trim() || null,
          external_link: groupData.externalLink?.trim() || null,
          created_by: userId
        })
        .select(`
          id,
          name,
          description,
          external_link,
          member_count,
          created_by,
          is_active,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        console.error('Error creating group:', error);
        
        // Handle specific database errors
        if (error.code === 'PGRST200' || error.code === 'PGRST205') {
          throw new Error('Groups table is not available. Please contact the administrator to set up the database properly.');
        }
        
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('A group with this name already exists.');
        }
        
        throw new Error('Failed to create group. Please try again.');
      }

      // Get creator profile separately to avoid JOIN issues
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();

      const groupWithCreator = {
        ...group,
        profiles: profile || { full_name: null, email: null }
      };

      return this.formatGroup(groupWithCreator);
    } catch (error) {
      console.error('Error in createGroup:', error);
      throw error;
    }
  }

  /**
   * Get all active groups
   * Requirements: 4.1, 4.2, 5.3 - Display groups from database with external links
   */
  async getAllGroups(): Promise<GroupsResponse> {
    try {
      // Check if groups table is accessible
      const { error: tableCheckError } = await supabase
        .from('groups')
        .select('count', { count: 'exact', head: true });

      if (tableCheckError) {
        console.error('Groups table not accessible:', tableCheckError);
        return {
          groups: [],
          total: 0
        };
      }

      // Get groups without JOIN to avoid schema cache issues
      const { data: groups, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          external_link,
          member_count,
          created_by,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching groups:', error);
        
        if (error.code === 'PGRST205') {
          console.warn('Groups table schema cache issue - returning empty result');
          return {
            groups: [],
            total: 0
          };
        }
        
        throw new Error('Failed to fetch groups');
      }

      // Get creator information for each group separately
      const formattedGroups: Group[] = [];
      if (groups) {
        for (const group of groups) {
          // Get creator profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', group.created_by)
            .single();

          const groupWithCreator = {
            ...group,
            profiles: profile || { full_name: null, email: null }
          };

          formattedGroups.push(this.formatGroup(groupWithCreator));
        }
      }

      return {
        groups: formattedGroups,
        total: formattedGroups.length
      };
    } catch (error) {
      console.error('Error in getAllGroups:', error);
      throw error;
    }
  }

  /**
   * Get a specific group by ID
   */
  async getGroupById(groupId: string): Promise<Group | null> {
    try {
      const { data: group, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          external_link,
          member_count,
          created_by,
          is_active,
          created_at,
          updated_at
        `)
        .eq('id', groupId)
        .eq('is_active', true)
        .single();

      if (error || !group) {
        console.warn('Group not found:', groupId);
        return null;
      }

      // Get creator profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', group.created_by)
        .single();

      const groupWithCreator = {
        ...group,
        profiles: profile || { full_name: null, email: null }
      };

      return this.formatGroup(groupWithCreator);
    } catch (error) {
      console.error('Error in getGroupById:', error);
      throw error;
    }
  }

  /**
   * Update a group with permission validation
   * Requirements: 6.1, 6.2 - Only admins can update groups
   */
  async updateGroup(userId: string, groupId: string, updates: UpdateGroupData): Promise<Group> {
    try {
      // Check permission first
      const permission = await permissionManager.canManageGroups(userId);
      if (!permission.allowed) {
        throw new Error(permission.reason || 'Permission denied');
      }

      // Validate updates
      if (updates.name !== undefined) {
        if (!updates.name || updates.name.trim().length === 0) {
          throw new Error('Group name cannot be empty');
        }
        if (updates.name.trim().length > 255) {
          throw new Error('Group name cannot exceed 255 characters');
        }
      }

      if (updates.description !== undefined && updates.description && updates.description.length > 2000) {
        throw new Error('Group description cannot exceed 2000 characters');
      }

      // Validate external link if provided
      if (updates.externalLink !== undefined && updates.externalLink) {
        const linkValidation = this.validateExternalLink(updates.externalLink);
        if (!linkValidation.isValid) {
          throw new Error(linkValidation.error || 'Invalid external link');
        }
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) {
        updateData.name = updates.name.trim();
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description?.trim() || null;
      }
      if (updates.externalLink !== undefined) {
        updateData.external_link = updates.externalLink?.trim() || null;
      }
      if (updates.isActive !== undefined) {
        updateData.is_active = updates.isActive;
      }

      // Update group in database
      const { data: group, error } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', groupId)
        .select(`
          id,
          name,
          description,
          external_link,
          member_count,
          created_by,
          is_active,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        console.error('Error updating group:', error);
        
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('A group with this name already exists.');
        }
        
        throw new Error('Failed to update group. Please try again.');
      }

      if (!group) {
        throw new Error('Group not found');
      }

      // Get creator profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', group.created_by)
        .single();

      const groupWithCreator = {
        ...group,
        profiles: profile || { full_name: null, email: null }
      };

      return this.formatGroup(groupWithCreator);
    } catch (error) {
      console.error('Error in updateGroup:', error);
      throw error;
    }
  }

  /**
   * Delete a group (soft delete) with permission validation
   * Requirements: 6.1, 6.2 - Only admins can delete groups
   */
  async deleteGroup(userId: string, groupId: string): Promise<void> {
    try {
      // Check permission first
      const permission = await permissionManager.canManageGroups(userId);
      if (!permission.allowed) {
        throw new Error(permission.reason || 'Permission denied');
      }

      // Soft delete the group
      const { error } = await supabase
        .from('groups')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', groupId);

      if (error) {
        console.error('Error deleting group:', error);
        throw new Error('Failed to delete group');
      }
    } catch (error) {
      console.error('Error in deleteGroup:', error);
      throw error;
    }
  }

  /**
   * Create multiple groups in batch
   * Requirements: 5.1, 5.2 - Create the 8 specified groups
   */
  async createMultipleGroups(userId: string, groupsData: CreateGroupData[]): Promise<Group[]> {
    try {
      // Check permission first
      const permission = await permissionManager.canManageGroups(userId);
      if (!permission.allowed) {
        throw new Error(permission.reason || 'Permission denied');
      }

      const createdGroups: Group[] = [];
      
      // Create groups one by one to handle individual validation and errors
      for (const groupData of groupsData) {
        try {
          const group = await this.createGroup(userId, groupData);
          createdGroups.push(group);
        } catch (error) {
          console.error(`Error creating group "${groupData.name}":`, error);
          // Continue with other groups, but log the error
        }
      }

      return createdGroups;
    } catch (error) {
      console.error('Error in createMultipleGroups:', error);
      throw error;
    }
  }

  /**
   * Validate group data
   * Requirements: 6.5 - Group data validation
   */
  private validateGroupData(groupData: CreateGroupData): string | null {
    if (!groupData.name || groupData.name.trim().length === 0) {
      return 'Group name is required';
    }

    if (groupData.name.trim().length > 255) {
      return 'Group name cannot exceed 255 characters';
    }

    if (groupData.description && groupData.description.length > 2000) {
      return 'Group description cannot exceed 2000 characters';
    }

    return null;
  }

  /**
   * Validate external link format and accessibility
   * Requirements: 4.4 - External link validation
   */
  private validateExternalLink(url: string): { isValid: boolean; error?: string } {
    try {
      // Basic URL format validation
      const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
      if (!urlPattern.test(url)) {
        return {
          isValid: false,
          error: 'External link must be a valid HTTP or HTTPS URL'
        };
      }

      // Check URL length
      if (url.length > 2000) {
        return {
          isValid: false,
          error: 'External link URL is too long'
        };
      }

      // Additional validation for common platforms
      const validDomains = [
        'discord.gg',
        'discord.com',
        't.me',
        'telegram.me',
        'slack.com',
        'teams.microsoft.com',
        'zoom.us',
        'meet.google.com',
        'facebook.com',
        'fb.com',
        'whatsapp.com',
        'line.me',
        'github.com',
        'gitlab.com'
      ];

      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check if it's a known safe domain or allow any HTTPS URL
      const isKnownDomain = validDomains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );

      if (!isKnownDomain && !url.startsWith('https://')) {
        return {
          isValid: false,
          error: 'For security reasons, external links must use HTTPS or be from known platforms'
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid URL format'
      };
    }
  }

  /**
   * Format group data from database
   */
  private formatGroup(group: any): Group {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      externalLink: group.external_link,
      memberCount: group.member_count || 0,
      createdBy: group.created_by,
      isActive: group.is_active,
      createdAt: new Date(group.created_at),
      updatedAt: new Date(group.updated_at),
      creatorName: group.profiles?.full_name || 'Unknown User',
      creatorEmail: group.profiles?.email
    };
  }

  /**
   * Search groups by name or description
   */
  async searchGroups(query: string): Promise<GroupsResponse> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      
      const { data: groups, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          external_link,
          member_count,
          created_by,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching groups:', error);
        throw new Error('Failed to search groups');
      }

      // Get creator information for each group separately
      const formattedGroups: Group[] = [];
      if (groups) {
        for (const group of groups) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', group.created_by)
            .single();

          const groupWithCreator = {
            ...group,
            profiles: profile || { full_name: null, email: null }
          };

          formattedGroups.push(this.formatGroup(groupWithCreator));
        }
      }

      return {
        groups: formattedGroups,
        total: formattedGroups.length
      };
    } catch (error) {
      console.error('Error in searchGroups:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const groupsService = new GroupsService();
export default groupsService;