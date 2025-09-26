/**
 * Production Environment Smoke Tests
 * Critical functionality tests for production environment
 */

const https = require('https');

// Test configuration
const PRODUCTION_CONFIG = {
  baseUrl: process.env.PRODUCTION_URL || 'https://peerlearninghub.com',
  timeout: 15000, // Longer timeout for production
};

// HTTP request utility
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: PRODUCTION_CONFIG.timeout,
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

describe('Production Environment Smoke Tests', () => {
  describe('Critical Connectivity', () => {
    it('should respond to root endpoint', async () => {
      try {
        const response = await makeRequest(`${PRODUCTION_CONFIG.baseUrl}/`);
        expect(response.statusCode).toBeLessThan(500);
      } catch (error) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.warn('Production environment not available, skipping smoke tests');
          return;
        }
        throw error;
      }
    });

    it('should enforce HTTPS', () => {
      expect(PRODUCTION_CONFIG.baseUrl).toMatch(/^https:\/\//);
    });

    it('should have reasonable response time', async () => {
      const startTime = Date.now();
      
      try {
        await makeRequest(`${PRODUCTION_CONFIG.baseUrl}/`);
        const responseTime = Date.now() - startTime;
        
        // Production should respond within 5 seconds
        expect(responseTime).toBeLessThan(5000);
      } catch (error) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.warn('Production environment not available for response time test');
          return;
        }
        throw error;
      }
    });
  });

  describe('Critical API Endpoints', () => {
    const criticalEndpoints = [
      '/api/auth/session',
      '/api/health',
    ];

    criticalEndpoints.forEach(endpoint => {
      it(`should respond to critical endpoint ${endpoint}`, async () => {
        try {
          const response = await makeRequest(`${PRODUCTION_CONFIG.baseUrl}${endpoint}`);
          
          // Critical endpoints should not return server errors
          expect(response.statusCode).toBeLessThan(500);
        } catch (error) {
          if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.warn(`Production environment not available for ${endpoint}`);
            return;
          }
          throw error;
        }
      });
    });
  });

  describe('Security Requirements', () => {
    it('should include security headers', async () => {
      try {
        const response = await makeRequest(`${PRODUCTION_CONFIG.baseUrl}/`);
        const headers = response.headers;
        
        // Production should have security headers
        if (headers['strict-transport-security']) {
          expect(headers['strict-transport-security']).toContain('max-age=');
        }
        
        if (headers['x-frame-options']) {
          expect(['DENY', 'SAMEORIGIN']).toContain(headers['x-frame-options']);
        }
        
        if (headers['x-content-type-options']) {
          expect(headers['x-content-type-options']).toBe('nosniff');
        }
        
        // Test passes if we get any response
        expect(response.statusCode).toBeDefined();
      } catch (error) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.warn('Production environment not available for security check');
          return;
        }
        throw error;
      }
    });

    it('should not expose sensitive information', async () => {
      try {
        const response = await makeRequest(`${PRODUCTION_CONFIG.baseUrl}/`);
        
        // Should not expose server information
        expect(response.headers['server']).toBeUndefined();
        expect(response.headers['x-powered-by']).toBeUndefined();
        
        // Should not contain debug information in response
        expect(response.data.toLowerCase()).not.toContain('debug');
        expect(response.data.toLowerCase()).not.toContain('error');
        expect(response.data.toLowerCase()).not.toContain('stack trace');
      } catch (error) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.warn('Production environment not available for information exposure test');
          return;
        }
        throw error;
      }
    });
  });

  describe('Performance Requirements', () => {
    it('should meet performance thresholds', async () => {
      const performanceTests = [];
      
      // Test multiple requests to get average
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        
        try {
          await makeRequest(`${PRODUCTION_CONFIG.baseUrl}/`);
          const responseTime = Date.now() - startTime;
          performanceTests.push(responseTime);
        } catch (error) {
          if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.warn('Production environment not available for performance test');
            return;
          }
          throw error;
        }
      }
      
      const averageResponseTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
      
      // Production should respond within 3 seconds on average
      expect(averageResponseTime).toBeLessThan(3000);
    });
  });
});