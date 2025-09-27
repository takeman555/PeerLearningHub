/**
 * Application Phase Configuration
 * 
 * This file defines which features are available in each phase of the application.
 * Features are controlled based on user roles and phase settings.
 */

export interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  phase: 'current' | 'next';
  requiredRole?: 'user' | 'admin' | 'super_admin';
  status: 'available' | 'development' | 'coming_soon';
}

/**
 * All application features configuration
 */
export const FEATURES: FeatureConfig[] = [
  // Phase 1 - Current Features (Available to all users)
  {
    id: 'community',
    name: 'グローバルコミュニティ',
    description: '世界中の学習者やデジタルノマドとつながる',
    icon: '🌍',
    route: '/community',
    phase: 'current',
    status: 'available'
  },
  {
    id: 'search',
    name: '検索・発見',
    description: 'プロジェクト、リソース、宿泊施設を横断検索',
    icon: '🔍',
    route: '/search',
    phase: 'current',
    status: 'available'
  },
  {
    id: 'resources',
    name: 'リソース・情報',
    description: '学習リソースなどの有用情報と公式情報へのアクセス',
    icon: '📚',
    route: '/resources',
    phase: 'current',
    status: 'available'
  },

  // Phase 2 - Next Features (Super Admin only during development)
  {
    id: 'dashboard',
    name: 'ダッシュボード',
    description: 'ピアラーニングハブでの活動のナビゲーション',
    icon: '📊',
    route: '/learning-dashboard',
    phase: 'next',
    requiredRole: 'super_admin',
    status: 'development'
  },
  {
    id: 'projects',
    name: 'プロジェクト',
    description: '期限付き企画。関連セミナー・イベントへの参加',
    icon: '🚀',
    route: '/projects',
    phase: 'next',
    requiredRole: 'super_admin',
    status: 'development'
  },
  {
    id: 'peer_sessions',
    name: 'ピア学習セッション',
    description: '部活動や継続的なコミュニティへの参加',
    icon: '👥',
    route: '/peer-sessions',
    phase: 'next',
    requiredRole: 'super_admin',
    status: 'development'
  },
  {
    id: 'accommodation',
    name: '宿泊予約',
    description: 'ピアラーニングハブの公式施設の予約・履歴管理',
    icon: '🏨',
    route: '/accommodation',
    phase: 'next',
    requiredRole: 'super_admin',
    status: 'development'
  },
  {
    id: 'activity',
    name: '活動履歴・予定管理',
    description: 'ピアラーニングハブでの活動の履歴確認と予約管理',
    icon: '📅',
    route: '/activity',
    phase: 'next',
    requiredRole: 'super_admin',
    status: 'development'
  },
  {
    id: 'admin',
    name: '管理者ダッシュボード',
    description: 'システム管理とユーザー管理',
    icon: '⚙️',
    route: '/admin',
    phase: 'next',
    requiredRole: 'super_admin',
    status: 'development'
  }
];

/**
 * Get features available to a specific user role
 */
export function getAvailableFeatures(userRole?: string): FeatureConfig[] {
  return FEATURES.filter(feature => {
    // Current phase features are available to all users
    if (feature.phase === 'current') {
      return true;
    }
    
    // Next phase features require specific role
    if (feature.phase === 'next') {
      return feature.requiredRole === userRole;
    }
    
    return false;
  });
}

/**
 * Get current phase features only
 */
export function getCurrentPhaseFeatures(): FeatureConfig[] {
  return FEATURES.filter(feature => feature.phase === 'current');
}

/**
 * Get next phase features only
 */
export function getNextPhaseFeatures(): FeatureConfig[] {
  return FEATURES.filter(feature => feature.phase === 'next');
}

/**
 * Check if a feature is available to a user
 */
export function isFeatureAvailable(featureId: string, userRole?: string): boolean {
  const feature = FEATURES.find(f => f.id === featureId);
  if (!feature) return false;
  
  if (feature.phase === 'current') {
    return true;
  }
  
  if (feature.phase === 'next') {
    return feature.requiredRole === userRole;
  }
  
  return false;
}

/**
 * Get feature status text for UI display
 */
export function getFeatureStatusText(feature: FeatureConfig): string {
  switch (feature.status) {
    case 'available':
      return '';
    case 'development':
      return '🔧 開発中機能';
    case 'coming_soon':
      return '🚧 次期フェーズで提供予定';
    default:
      return '';
  }
}

/**
 * Get feature button style based on status
 */
export function getFeatureButtonStyle(feature: FeatureConfig): string {
  switch (feature.status) {
    case 'available':
      return 'available';
    case 'development':
      return 'development';
    case 'coming_soon':
      return 'coming_soon';
    default:
      return 'available';
  }
}