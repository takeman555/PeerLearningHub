#!/usr/bin/env node

/**
 * Staging Environment Warmup Script
 */

const https = require('https');
const http = require('http');

class StagingWarmup {
  constructor() {
    this.stagingUrl = process.env.STAGING_API_URL || 'https://staging-api.peerlearninghub.com';
    this.endpoints = [
      '/health',
      '/api/auth/session',
      '/api/community/groups',
      '/api/resources',
      '/api/membership/status'
    ];
  }

  async warmup() {
    console.log('Warming up staging environment...');
    
    const results = [];
    
    for (const endpoint of this.endpoints) {
      try {
        const result = await this.makeRequest(endpoint);
        results.push({
          endpoint,
          status: 'success',
          responseTime: result.responseTime,
          statusCode: result.statusCode
        });
        console.log(`✅ ${endpoint} - ${result.statusCode} (${result.responseTime}ms)`);
      } catch (error) {
        results.push({
          endpoint,
          status: 'failed',
          error: error.message
        });
        console.error(`❌ ${endpoint} - ${error.message}`);
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`Warmup completed: ${successCount}/${this.endpoints.length} endpoints successful`);
    
    if (successCount < this.endpoints.length) {
      throw new Error(`Warmup failed for ${this.endpoints.length - successCount} endpoints`);
    }
    
    return results;
  }

  makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.stagingUrl);
      const startTime = Date.now();
      
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(url, {
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'StagingWarmup/1.0'
        }
      }, (res) => {
        const responseTime = Date.now() - startTime;
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            responseTime,
            data
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }
}

if (require.main === module) {
  const warmup = new StagingWarmup();
  
  warmup.warmup().then(() => {
    console.log('Staging warmup completed successfully');
  }).catch(error => {
    console.error('Staging warmup failed:', error);
    process.exit(1);
  });
}

module.exports = StagingWarmup;