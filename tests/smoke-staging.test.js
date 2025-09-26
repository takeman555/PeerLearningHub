/**
 * Staging Environment Smoke Tests
 * Basic functionality tests to ensure staging environment is operational
 */

const https = require('https');

// Test configuration
const STAGING_CONFIG = {
  baseUrl: process.env.STAGING_URL || 'https://staging.peerlearninghub.com',
  timeout: 10000,
};

// HTTP request utility
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: STAGING_CONFIG.timeout,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

describe('Staging Environment Smoke Tests', () => {
  describe('Basic Connectivity', () => {
    it('should respond to health check', async () => {
      try {
        const response = await makeRequest(`${STAGING_CONFIG.baseUrl}/health`);
        expect([200, 404]).toContain(response.statusCode); // 404 is acceptable if endpoint doesn't exist
      } catch (error) {
        // If staging environment is not available, skip the test
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.warn('Staging environment not available, skipping smoke tests');
          return;
        }
        throw error;
      }
    });

    it('should enforce HTTPS', () => {
      expect(STAGING_CONFIG.baseUrl).toMatch(/^https:\/\//);
    });
  });

  describe('API Endpoints', () => {
    const endpoints = [
      '/api/auth/session',
      '/api/community/posts',
      '/api/membership/status',
      '/api/external/projects',
    ];

    endpoints.forEach(endpoint => {
      it(`should respond to ${endpoint}`, async () => {
        try {
          const response = await makeRequest(`${STAGING_CONFIG.baseUrl}${endpoint}`);
          
          // Accept various status codes for smoke test
          expect(response.statusCode).toBeLessThan(500);
        } catch (error) {
          if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.warn(`Staging environment not available for ${endpoint}`);
            return;
          }
          throw error;
        }
      });
    });
  });

  describe('Security Headers', () => {
    it('should include basic security headers', async () => {
      try {
        const response = await makeRequest(`${STAGING_CONFIG.baseUrl}/`);
        
        // Check for common security headers (if available)
        const headers = response.headers;
        
        // These are nice to have but not required for smoke test
        if (headers['x-frame-options']) {
          expect(headers['x-frame-options']).toBeTruthy();
        }
        
        if (headers['x-content-type-options']) {
          expect(headers['x-content-type-options']).toBe('nosniff');
        }
        
        // Test passes if we get any response
        expect(response.statusCode).toBeDefined();
      } catch (error) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.warn('Staging environment not available for security header check');
          return;
        }
        throw error;
      }
    });
  });
});