/**
 * Resource Management Service
 */

import { Resource, CreateResourceRequest, UpdateResourceRequest, ResourceFilter } from '../types/resources';

// Mock data storage
let mockResources: Resource[] = [
  {
    id: '1',
    title: '日本語の基本的な挨拶',
    description: '日本語での基本的な挨拶表現を学びましょう',
    content: `# 日本語の基本的な挨拶

## おはよう系の挨拶
- おはよう (カジュアル)
- おはようございます (丁寧)

## こんにちは系の挨拶
- こんにちは
- こんばんは

## 初対面の挨拶
- はじめまして
- よろしくお願いします`,
    category: 'language_learning',
    type: 'article',
    level: 'beginner',
    tags: ['挨拶', '基本', '日本語'],
    author_id: 'admin-1',
    author_name: '管理者 一郎',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    published: true,
    featured: true,
    views: 245,
    likes: 18,
    language: 'ja'
  },
  {
    id: '2',
    title: 'Japanese Business Etiquette',
    description: 'Learn essential business etiquette in Japanese culture',
    content: `# Japanese Business Etiquette

## Business Cards (Meishi)
- Always receive with both hands
- Read the card carefully
- Place it respectfully on the table

## Bowing
- Slight bow for greetings
- Deeper bow for apologies
- Practice proper posture`,
    category: 'business',
    type: 'article',
    level: 'intermediate',
    tags: ['business', 'etiquette', 'culture'],
    author_id: 'admin-1',
    author_name: '管理者 一郎',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    published: true,
    featured: false,
    views: 156,
    likes: 12,
    language: 'en'
  },
  {
    id: '3',
    title: 'プログラミング入門：JavaScript基礎',
    description: 'JavaScriptの基本的な概念と文法を学習します',
    content: `# JavaScript基礎

## 変数の宣言
\`\`\`javascript
let name = "太郎";
const age = 25;
var city = "東京";
\`\`\`

## 関数の定義
\`\`\`javascript
function greet(name) {
  return "こんにちは、" + name + "さん！";
}
\`\`\``,
    category: 'technology',
    type: 'course',
    level: 'beginner',
    tags: ['プログラミング', 'JavaScript', '入門'],
    author_id: 'dev-1',
    author_name: 'Developer User',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    published: true,
    featured: true,
    views: 89,
    likes: 7,
    language: 'ja'
  }
];

class ResourceService {
  /**
   * Get all resources with optional filtering
   */
  async getResources(filter?: ResourceFilter): Promise<Resource[]> {
    let filteredResources = [...mockResources];

    if (filter) {
      if (filter.category) {
        filteredResources = filteredResources.filter(r => r.category === filter.category);
      }
      if (filter.type) {
        filteredResources = filteredResources.filter(r => r.type === filter.type);
      }
      if (filter.level) {
        filteredResources = filteredResources.filter(r => r.level === filter.level);
      }
      if (filter.language) {
        filteredResources = filteredResources.filter(r => r.language === filter.language);
      }
      if (filter.featured !== undefined) {
        filteredResources = filteredResources.filter(r => r.featured === filter.featured);
      }
      if (filter.published !== undefined) {
        filteredResources = filteredResources.filter(r => r.published === filter.published);
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredResources = filteredResources.filter(r => 
          r.title.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower) ||
          r.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
    }

    // Sort by created_at descending
    return filteredResources.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Get a single resource by ID
   */
  async getResource(id: string): Promise<Resource | null> {
    const resource = mockResources.find(r => r.id === id);
    if (resource) {
      // Increment view count
      resource.views += 1;
    }
    return resource || null;
  }

  /**
   * Create a new resource
   */
  async createResource(data: CreateResourceRequest, authorId: string, authorName: string): Promise<Resource> {
    const newResource: Resource = {
      id: Date.now().toString(),
      ...data,
      author_id: authorId,
      author_name: authorName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published: data.published || false,
      featured: data.featured || false,
      views: 0,
      likes: 0
    };

    mockResources.push(newResource);
    console.log('✅ Resource created:', newResource.title);
    return newResource;
  }

  /**
   * Update an existing resource
   */
  async updateResource(data: UpdateResourceRequest): Promise<Resource | null> {
    const index = mockResources.findIndex(r => r.id === data.id);
    if (index === -1) {
      return null;
    }

    const updatedResource = {
      ...mockResources[index],
      ...data,
      updated_at: new Date().toISOString()
    };

    mockResources[index] = updatedResource;
    console.log('✅ Resource updated:', updatedResource.title);
    return updatedResource;
  }

  /**
   * Delete a resource
   */
  async deleteResource(id: string): Promise<boolean> {
    const index = mockResources.findIndex(r => r.id === id);
    if (index === -1) {
      return false;
    }

    mockResources.splice(index, 1);
    console.log('✅ Resource deleted:', id);
    return true;
  }

  /**
   * Toggle like on a resource
   */
  async toggleLike(id: string): Promise<Resource | null> {
    const resource = mockResources.find(r => r.id === id);
    if (!resource) {
      return null;
    }

    // Simple toggle (in real app, would track user likes)
    resource.likes += 1;
    return resource;
  }

  /**
   * Get featured resources
   */
  async getFeaturedResources(): Promise<Resource[]> {
    return this.getResources({ featured: true, published: true });
  }

  /**
   * Get resources by author
   */
  async getResourcesByAuthor(authorId: string): Promise<Resource[]> {
    return mockResources.filter(r => r.author_id === authorId);
  }
}

export const resourceService = new ResourceService();
export default resourceService;