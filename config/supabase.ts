import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productionConfig, validateProductionConfig } from './production';

// Environment detection
const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';
const isStaging = process.env.EXPO_PUBLIC_ENVIRONMENT === 'staging';

// Supabase configuration with environment-specific fallbacks
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('Environment variables check:');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');

// Validate required configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Supabase configuration is missing. Please check environment variables.
    URL: ${supabaseUrl ? 'Set' : 'Missing'}
    Key: ${supabaseAnonKey ? 'Set' : 'Missing'}`);
}

// Validate production configuration
if (isProduction) {
  try {
    validateProductionConfig();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Production configuration validation failed:', errorMessage);
    throw error;
  }
}

// Create Supabase client with minimal configuration to avoid compatibility issues
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types for the PeerLearningHub schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          country: string | null;
          bio: string | null;
          skills: string[] | null;
          languages: string[] | null;
          timezone: string | null;
          date_of_birth: string | null;
          phone_number: string | null;
          social_links: Record<string, any> | null;
          preferences: Record<string, any> | null;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          country?: string | null;
          bio?: string | null;
          skills?: string[] | null;
          languages?: string[] | null;
          timezone?: string | null;
          date_of_birth?: string | null;
          phone_number?: string | null;
          social_links?: Record<string, any> | null;
          preferences?: Record<string, any> | null;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          country?: string | null;
          bio?: string | null;
          skills?: string[] | null;
          languages?: string[] | null;
          timezone?: string | null;
          date_of_birth?: string | null;
          phone_number?: string | null;
          social_links?: Record<string, any> | null;
          preferences?: Record<string, any> | null;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'user' | 'moderator' | 'admin' | 'super_admin';
          granted_by: string | null;
          granted_at: string;
          expires_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'user' | 'moderator' | 'admin' | 'super_admin';
          granted_by?: string | null;
          granted_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'user' | 'moderator' | 'admin' | 'super_admin';
          granted_by?: string | null;
          granted_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
      };
    };
    Functions: {
      has_role: {
        Args: { required_role: string };
        Returns: boolean;
      };
      has_any_role: {
        Args: { required_roles: string[] };
        Returns: boolean;
      };
    };
  };
}

// Type helpers for better TypeScript experience
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type UserRoleInsert = Database['public']['Tables']['user_roles']['Insert'];
export type UserRoleUpdate = Database['public']['Tables']['user_roles']['Update'];

export type UserRoleType = 'user' | 'moderator' | 'admin' | 'super_admin';