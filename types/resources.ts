/**
 * Resource and Content Types
 */

export interface Resource {
  id: string;
  title: string;
  description: string;
  content: string;
  category: ResourceCategory;
  type: ResourceType;
  level: LearningLevel;
  tags: string[];
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  featured: boolean;
  views: number;
  likes: number;
  downloads?: number;
  file_url?: string;
  thumbnail_url?: string;
  duration?: number; // for videos in minutes
  language: string;
}

export type ResourceCategory = 
  | 'language_learning'
  | 'culture'
  | 'business'
  | 'technology'
  | 'lifestyle'
  | 'travel'
  | 'education'
  | 'career';

export type ResourceType = 
  | 'article'
  | 'video'
  | 'audio'
  | 'document'
  | 'link'
  | 'course'
  | 'quiz'
  | 'worksheet';

export type LearningLevel = 
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'all_levels';

export interface ResourceFilter {
  category?: ResourceCategory;
  type?: ResourceType;
  level?: LearningLevel;
  language?: string;
  search?: string;
  featured?: boolean;
  published?: boolean;
}

export interface CreateResourceRequest {
  title: string;
  description: string;
  content: string;
  category: ResourceCategory;
  type: ResourceType;
  level: LearningLevel;
  tags: string[];
  language: string;
  published?: boolean;
  featured?: boolean;
  file_url?: string;
  thumbnail_url?: string;
  duration?: number;
}

export interface UpdateResourceRequest extends Partial<CreateResourceRequest> {
  id: string;
}