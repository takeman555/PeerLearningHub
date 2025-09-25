/**
 * Example: Integrating Structured Logging in PeerLearningHub
 * This file shows how to use the structured logging system
 */

import { useStructuredLogging, usePerformanceLogging } from '../hooks/useStructuredLogging';
import LoggingInitializer from '../services/loggingInitializer';

// Example 1: Using logging in a React component
export const ExampleComponent = () => {
  const { logInfo, logError, logAuth } = useStructuredLogging('ExampleComponent');
  const { measurePerformance } = usePerformanceLogging('ExampleComponent');

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await measurePerformance('user_login', async () => {
        // Your login logic here
        return await authService.signIn(email, password);
      });

      logAuth('login', true, {
        userId: result.user?.id,
        email: result.user?.email,
        method: 'email_password'
      });

      return result;
    } catch (error) {
      logAuth('login', false, {
        email,
        method: 'email_password',
        error: error as Error
      });
      throw error;
    }
  };

  return (
    // Your component JSX
    <div>Example Component</div>
  );
};

// Example 2: Initializing logging in App.tsx
export const initializeAppLogging = async (userId?: string) => {
  const loggingInitializer = LoggingInitializer.getInstance();
  
  try {
    await loggingInitializer.initialize();
    
    if (userId) {
      loggingInitializer.setUserContext(userId);
    }
    
    console.log('Structured logging initialized successfully');
  } catch (error) {
    console.error('Failed to initialize logging:', error);
  }
};

// Example 3: Service-level logging
export class ExampleService {
  private logger = useStructuredLogging('ExampleService');

  async fetchData(id: string) {
    const startTime = Date.now();
    
    try {
      this.logger.logInfo('api', 'Fetching data', { id });
      
      const response = await fetch(`/api/data/${id}`);
      const duration = Date.now() - startTime;
      
      this.logger.logApiRequest('GET', `/api/data/${id}`, {
        statusCode: response.status,
        duration
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.logApiRequest('GET', `/api/data/${id}`, {
        duration,
        error: error as Error
      });
      
      throw error;
    }
  }
}
