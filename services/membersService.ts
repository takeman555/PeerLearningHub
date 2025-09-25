import { supabase } from '../config/supabase';
import { permissionManager } from './permissionManager';

// Member interfaces
export interface Member {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  joinedAt: Date;
  isActive: boolean;
  isOnline?: boolean;
  skills?: string[];
  mutualConnections?: number;
  roles: string[];
}

export interface MembersResponse {
  members: Member[];
  hasMore: boolean;
  total: number;
}

/**
 * Members Service
 * Handles member list retrieval and management
 * Requirements: 3.1, 3.2, 3.3, 3.4 - Display actual registered users
 */
class MembersService {
  /**
   * Get active members from database
   * Requirements: 3.1, 3.2 - Display actual registered users with proper filtering
   */
  async getActiveMembers(
    requestingUserId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<MembersResponse> {
    try {
      // Check if requesting user has permission to view members
      if (requestingUserId) {
        const permission = await permissionManager.canViewMembers(requestingUserId);
        if (!permission.allowed) {
          throw new Error(permission.reason || 'Permission denied');
        }
      }

      // Get active members (without JOIN to avoid schema cache issues)
      const { data: members, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          is_active,
          created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching members:', error);
        throw new Error('Failed to fetch members');
      }

      // Get total count for pagination
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get roles for each member separately
      const formattedMembers: Member[] = [];
      if (members) {
        for (const member of members) {
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role, is_active')
            .eq('user_id', member.id)
            .eq('is_active', true);
          
          const memberWithRoles = {
            ...member,
            user_roles: userRoles || []
          };
          
          formattedMembers.push(this.formatMember(memberWithRoles));
        }
      }

      return {
        members: formattedMembers,
        hasMore: (offset + limit) < (count || 0),
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getActiveMembers:', error);
      throw error;
    }
  }

  /**
   * Get member profile by user ID
   * Requirements: 3.2 - Display relevant profile data
   */
  async getMemberProfile(userId: string, requestingUserId?: string): Promise<Member | null> {
    try {
      // Check permission if requesting user is provided
      if (requestingUserId) {
        const permission = await permissionManager.canViewMembers(requestingUserId);
        if (!permission.allowed) {
          throw new Error(permission.reason || 'Permission denied');
        }
      }

      const { data: member, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          is_active,
          created_at,
          user_roles!inner (
            role,
            is_active
          )
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error || !member) {
        console.warn('Member profile not found:', userId);
        return null;
      }

      return this.formatMember(member);
    } catch (error) {
      console.error('Error in getMemberProfile:', error);
      throw error;
    }
  }

  /**
   * Search members by name or email
   */
  async searchMembers(
    query: string,
    requestingUserId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<MembersResponse> {
    try {
      // Check permission
      if (requestingUserId) {
        const permission = await permissionManager.canViewMembers(requestingUserId);
        if (!permission.allowed) {
          throw new Error(permission.reason || 'Permission denied');
        }
      }

      const searchTerm = `%${query.toLowerCase()}%`;

      const { data: members, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          is_active,
          created_at,
          user_roles!inner (
            role,
            is_active
          )
        `)
        .eq('is_active', true)
        .eq('user_roles.is_active', true)
        .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error searching members:', error);
        throw new Error('Failed to search members');
      }

      const formattedMembers = members ? members.map(member => this.formatMember(member)) : [];

      return {
        members: formattedMembers,
        hasMore: members ? members.length === limit : false,
        total: members ? members.length : 0
      };
    } catch (error) {
      console.error('Error in searchMembers:', error);
      throw error;
    }
  }

  /**
   * Get members by role
   */
  async getMembersByRole(
    role: string,
    requestingUserId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<MembersResponse> {
    try {
      // Check permission
      if (requestingUserId) {
        const permission = await permissionManager.canViewMembers(requestingUserId);
        if (!permission.allowed) {
          throw new Error(permission.reason || 'Permission denied');
        }
      }

      const { data: members, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          is_active,
          created_at,
          user_roles!inner (
            role,
            is_active
          )
        `)
        .eq('is_active', true)
        .eq('user_roles.role', role)
        .eq('user_roles.is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching members by role:', error);
        throw new Error('Failed to fetch members');
      }

      const formattedMembers = members ? members.map(member => this.formatMember(member)) : [];

      return {
        members: formattedMembers,
        hasMore: members ? members.length === limit : false,
        total: members ? members.length : 0
      };
    } catch (error) {
      console.error('Error in getMembersByRole:', error);
      throw error;
    }
  }

  /**
   * Get member statistics
   */
  async getMemberStats(): Promise<{
    totalMembers: number;
    activeMembers: number;
    membersByRole: Record<string, number>;
    recentJoins: number;
  }> {
    try {
      // Get total members count
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active members count
      const { count: activeMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get members by role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('is_active', true);

      const membersByRole: Record<string, number> = {};
      if (roleData) {
        roleData.forEach(item => {
          membersByRole[item.role] = (membersByRole[item.role] || 0) + 1;
        });
      }

      // Get recent joins (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentJoins } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('created_at', thirtyDaysAgo.toISOString());

      return {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        membersByRole,
        recentJoins: recentJoins || 0
      };
    } catch (error) {
      console.error('Error in getMemberStats:', error);
      throw error;
    }
  }

  /**
   * Format member data from database
   */
  private formatMember(member: any): Member {
    const activeRoles = member.user_roles
      .filter((ur: any) => ur.is_active)
      .map((ur: any) => ur.role);

    return {
      id: member.id,
      userId: member.id,
      displayName: member.full_name || this.extractNameFromEmail(member.email),
      email: member.email,
      avatarUrl: member.avatar_url,
      joinedAt: new Date(member.created_at),
      isActive: member.is_active,
      isOnline: false, // This would need real-time presence tracking
      skills: [], // This would come from a separate skills table if implemented
      mutualConnections: 0, // This would need a connections system
      roles: activeRoles
    };
  }

  /**
   * Extract display name from email if full name is not available
   */
  private extractNameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    return localPart
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  /**
   * Generate country flag emoji based on email domain or other criteria
   * This is a simple implementation - in a real app you'd have proper location data
   */
  private generateCountryFlag(email: string): string {
    const domain = email.split('@')[1]?.toLowerCase();
    const countryMap: Record<string, string> = {
      'gmail.com': '🌍',
      'yahoo.com': '🌍',
      'hotmail.com': '🌍',
      'outlook.com': '🌍',
      // Add more domain mappings as needed
    };
    
    return countryMap[domain || ''] || '🌍';
  }
}

// Lazy singleton instance
let _membersServiceInstance: MembersService | null = null;

export const membersService = {
  getInstance(): MembersService {
    if (!_membersServiceInstance) {
      _membersServiceInstance = new MembersService();
    }
    return _membersServiceInstance;
  },
  
  // Proxy methods for backward compatibility
  async getActiveMembers(requestingUserId?: string, limit: number = 20, offset: number = 0) {
    return this.getInstance().getActiveMembers(requestingUserId, limit, offset);
  },
  
  async getMemberProfile(userId: string, requestingUserId?: string) {
    return this.getInstance().getMemberProfile(userId, requestingUserId);
  },
  
  async searchMembers(query: string, requestingUserId?: string, limit: number = 20, offset: number = 0) {
    return this.getInstance().searchMembers(query, requestingUserId, limit, offset);
  },
  
  async getMembersByRole(role: string, requestingUserId?: string, limit: number = 20, offset: number = 0) {
    return this.getInstance().getMembersByRole(role, requestingUserId, limit, offset);
  },
  
  async getMemberStats() {
    return this.getInstance().getMemberStats();
  }
};

export default membersService;