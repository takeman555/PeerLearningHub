import { groupsService, CreateGroupData } from './groupsService';

/**
 * Initial Groups Service
 * Handles the creation of the specified groups for the community
 * Requirements: 5.1, 5.2 - Create the specified groups with proper metadata
 * Note: Requirements document lists 7 groups, not 8 as mentioned in task description
 */
class InitialGroupsService {
  /**
   * The specified groups to be created
   * Requirements: 5.1 - Create these specific groups
   */
  private readonly INITIAL_GROUPS: CreateGroupData[] = [
    {
      name: 'ピアラーニングハブ生成AI部',
      description: '生成AI技術について学び、実践的なプロジェクトに取り組むコミュニティです。ChatGPT、Claude、Midjourney等の最新AI技術を活用した学習とディスカッションを行います。',
      externalLink: 'https://discord.gg/ai-learning-hub'
    },
    {
      name: 'さぬきピアラーニングハブゴルフ部',
      description: '香川県内でゴルフを楽しみながら、ネットワーキングと学習を組み合わせたユニークなコミュニティです。初心者から上級者まで歓迎します。',
      externalLink: 'https://discord.gg/sanuki-golf-club'
    },
    {
      name: 'さぬきピアラーニングハブ英語部',
      description: '英語学習を通じて国際的な視野を広げるコミュニティです。英会話練習、TOEIC対策、ビジネス英語など様々な学習活動を行います。',
      externalLink: 'https://discord.gg/sanuki-english-club'
    },
    {
      name: 'WAOJEさぬきピアラーニングハブ交流会参加者',
      description: 'WAOJE（和僑会）との連携による国際的なビジネス交流会の参加者コミュニティです。グローバルなビジネスネットワーキングと学習機会を提供します。',
      externalLink: 'https://discord.gg/waoje-sanuki-exchange'
    },
    {
      name: '香川イノベーションベース',
      description: '香川県を拠点とした起業家、イノベーター、クリエイターのためのコミュニティです。新しいビジネスアイデアの創出と実現をサポートします。',
      externalLink: 'https://discord.gg/kagawa-innovation-base'
    },
    {
      name: 'さぬきピアラーニングハブ居住者',
      description: 'さぬきピアラーニングハブの居住者専用コミュニティです。共同生活を通じた学習体験と日常的な情報共有を行います。',
      externalLink: 'https://discord.gg/sanuki-residents'
    },
    {
      name: '英語キャンプ卒業者',
      description: '英語キャンプを修了したメンバーのアルムナイコミュニティです。継続的な英語学習サポートと卒業生同士のネットワーキングを提供します。',
      externalLink: 'https://discord.gg/english-camp-alumni'
    }
  ];

  /**
   * Create all initial groups
   * Requirements: 5.1, 5.2 - Batch creation of the 8 specified groups
   */
  async createInitialGroups(adminUserId: string): Promise<{
    success: boolean;
    createdGroups: any[];
    errors: string[];
    summary: string;
  }> {
    try {
      console.log('Starting creation of initial groups...');
      
      const createdGroups: any[] = [];
      const errors: string[] = [];

      // Create each group individually to handle errors gracefully
      for (let i = 0; i < this.INITIAL_GROUPS.length; i++) {
        const groupData = this.INITIAL_GROUPS[i];
        
        try {
          console.log(`Creating group ${i + 1}/8: ${groupData.name}`);
          
          const group = await groupsService.createGroup(adminUserId, groupData);
          createdGroups.push(group);
          
          console.log(`✓ Successfully created: ${groupData.name}`);
        } catch (error) {
          const errorMessage = `Failed to create "${groupData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          console.error(`✗ ${errorMessage}`);
        }
      }

      const success = createdGroups.length > 0;
      const summary = this.generateSummary(createdGroups.length, errors.length);

      console.log('\n' + summary);

      return {
        success,
        createdGroups,
        errors,
        summary
      };
    } catch (error) {
      console.error('Error in createInitialGroups:', error);
      
      return {
        success: false,
        createdGroups: [],
        errors: [`Critical error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        summary: 'Failed to initialize group creation process'
      };
    }
  }

  /**
   * Check if initial groups already exist
   * Helps prevent duplicate creation
   */
  async checkExistingGroups(): Promise<{
    existingGroups: string[];
    missingGroups: string[];
    allExist: boolean;
  }> {
    try {
      const { groups } = await groupsService.getAllGroups();
      const existingNames = groups.map(g => g.name);
      const requiredNames = this.INITIAL_GROUPS.map(g => g.name);

      const existingGroups = requiredNames.filter(name => existingNames.includes(name));
      const missingGroups = requiredNames.filter(name => !existingNames.includes(name));

      return {
        existingGroups,
        missingGroups,
        allExist: missingGroups.length === 0
      };
    } catch (error) {
      console.error('Error checking existing groups:', error);
      return {
        existingGroups: [],
        missingGroups: this.INITIAL_GROUPS.map(g => g.name),
        allExist: false
      };
    }
  }

  /**
   * Create only missing groups (smart creation)
   * Requirements: 5.2 - Efficient group creation avoiding duplicates
   */
  async createMissingGroups(adminUserId: string): Promise<{
    success: boolean;
    createdGroups: any[];
    skippedGroups: string[];
    errors: string[];
    summary: string;
  }> {
    try {
      console.log('Checking for existing groups...');
      
      const { existingGroups, missingGroups } = await this.checkExistingGroups();
      
      if (missingGroups.length === 0) {
        const summary = 'All initial groups already exist. No action needed.';
        console.log(summary);
        
        return {
          success: true,
          createdGroups: [],
          skippedGroups: existingGroups,
          errors: [],
          summary
        };
      }

      console.log(`Found ${existingGroups.length} existing groups, creating ${missingGroups.length} missing groups...`);

      const groupsToCreate = this.INITIAL_GROUPS.filter(g => missingGroups.includes(g.name));
      const createdGroups: any[] = [];
      const errors: string[] = [];

      // Create missing groups
      for (let i = 0; i < groupsToCreate.length; i++) {
        const groupData = groupsToCreate[i];
        
        try {
          console.log(`Creating missing group ${i + 1}/${groupsToCreate.length}: ${groupData.name}`);
          
          const group = await groupsService.createGroup(adminUserId, groupData);
          createdGroups.push(group);
          
          console.log(`✓ Successfully created: ${groupData.name}`);
        } catch (error) {
          const errorMessage = `Failed to create "${groupData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          console.error(`✗ ${errorMessage}`);
        }
      }

      const success = errors.length === 0;
      const summary = this.generateSmartSummary(createdGroups.length, existingGroups.length, errors.length);

      console.log('\n' + summary);

      return {
        success,
        createdGroups,
        skippedGroups: existingGroups,
        errors,
        summary
      };
    } catch (error) {
      console.error('Error in createMissingGroups:', error);
      
      return {
        success: false,
        createdGroups: [],
        skippedGroups: [],
        errors: [`Critical error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        summary: 'Failed to initialize smart group creation process'
      };
    }
  }

  /**
   * Get the list of initial groups (for reference)
   */
  getInitialGroupsList(): CreateGroupData[] {
    return [...this.INITIAL_GROUPS];
  }

  /**
   * Validate that all required groups exist
   * Requirements: 5.1, 5.2 - Verification of group creation
   */
  async validateInitialGroups(): Promise<{
    isValid: boolean;
    existingCount: number;
    missingGroups: string[];
    report: string;
  }> {
    try {
      const { existingGroups, missingGroups, allExist } = await this.checkExistingGroups();
      
      const report = allExist 
        ? `✓ All ${this.INITIAL_GROUPS.length} initial groups are present and active.`
        : `⚠ Missing ${missingGroups.length} groups: ${missingGroups.join(', ')}`;

      return {
        isValid: allExist,
        existingCount: existingGroups.length,
        missingGroups,
        report
      };
    } catch (error) {
      console.error('Error validating initial groups:', error);
      
      return {
        isValid: false,
        existingCount: 0,
        missingGroups: this.INITIAL_GROUPS.map(g => g.name),
        report: `Error validating groups: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate summary for batch creation
   */
  private generateSummary(created: number, errors: number): string {
    const total = this.INITIAL_GROUPS.length;
    
    if (created === total && errors === 0) {
      return `🎉 Successfully created all ${total} initial groups!`;
    } else if (created > 0 && errors === 0) {
      return `✓ Successfully created ${created}/${total} groups.`;
    } else if (created > 0 && errors > 0) {
      return `⚠ Partially successful: Created ${created}/${total} groups, ${errors} failed.`;
    } else {
      return `❌ Failed to create any groups. ${errors} errors occurred.`;
    }
  }

  /**
   * Generate summary for smart creation
   */
  private generateSmartSummary(created: number, existing: number, errors: number): string {
    const total = this.INITIAL_GROUPS.length;
    
    if (existing === total) {
      return `✓ All ${total} initial groups already exist.`;
    } else if (created + existing === total && errors === 0) {
      return `🎉 Setup complete! Created ${created} new groups, ${existing} already existed.`;
    } else if (errors === 0) {
      return `✓ Created ${created} new groups, ${existing} already existed.`;
    } else {
      return `⚠ Created ${created} groups, ${existing} already existed, ${errors} failed.`;
    }
  }
}

// Export singleton instance
export const initialGroupsService = new InitialGroupsService();
export default initialGroupsService;