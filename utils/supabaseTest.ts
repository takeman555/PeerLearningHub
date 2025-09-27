import { supabase } from '../config/supabase';

/**
 * Test Supabase connection and configuration
 */
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      // If profiles table doesn't exist yet, that's expected
      if (error.message.includes('relation "public.profiles" does not exist')) {
        return {
          success: true,
          message: 'Supabase connection successful! Database tables need to be created.',
          details: { connectionStatus: 'connected', tablesStatus: 'not_created' }
        };
      }
      
      return {
        success: false,
        message: `Supabase connection error: ${error.message}`,
        details: error
      };
    }

    return {
      success: true,
      message: 'Supabase connection and database tables are working!',
      details: { connectionStatus: 'connected', tablesStatus: 'ready' }
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
};

/**
 * Get Supabase project information
 */
export const getSupabaseInfo = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  // Debug logging
  console.log('getSupabaseInfo - URL:', url);
  console.log('getSupabaseInfo - Key:', key ? 'Present' : 'Missing');
  
  const hasValidUrl = url && url !== 'https://your-project.supabase.co' && url.includes('supabase.co');
  const hasValidKey = key && key !== 'your-anon-key' && key.length > 50;

  return {
    url: url || 'Not configured',
    hasValidUrl,
    hasValidKey,
    isConfigured: hasValidUrl && hasValidKey
  };
};