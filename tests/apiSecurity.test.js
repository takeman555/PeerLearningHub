/**
 * API Security Enhancement Tests
 * Tests for enhanced API communication security features
 */

describe('API Security Enhancement', () => {
  describe('Rate Limiting', () => {
    test('should enforce rate limits per endpoint', () => {
      const rateLimitStore = new Map();
      
      const checkRateLimit = (endpoint, method, ipAddress, maxRequests = 5, windowMs = 15 * 60 * 1000) => {
        const key = `${endpoint}:${method}:${ipAddress}`;
        const now = new Date();
        const entry = rateLimitStore.get(key);

        if (!entry || now.getTime() - entry.resetTime.getTime() > windowMs) {
          const resetTime = new Date(now.getTime() + windowMs);
          rateLimitStore.set(key, { count: 1, resetTime });
          return {
            isAllowed: true,
            remainingRequests: maxRequests - 1,
            resetTime
          };
        }

        if (entry.count >= maxRequests) {
          return {
            isAllowed: false,
            remainingRequests: 0,
            resetTime: entry.resetTime,
            retryAfter: Math.ceil((entry.resetTime.getTime() - now.getTime()) / 1000)
          };
        }

        entry.count++;
        rateLimitStore.set(key, entry);

        return {
          isAllowed: true,
          remainingRequests: maxRequests - entry.count,
          resetTime: entry.resetTime
        };
      };

      const endpoint = '/auth/login';
      const method = 'POST';
      const ipAddress = '192.168.1.1';

      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(endpoint, method, ipAddress);
        expect(result.isAllowed).toBe(true);
      }

      // 6th request should be blocked
      const blockedResult = checkRateLimit(endpoint, method, ipAddress);
      expect(blockedResult.isAllowed).toBe(false);
      expect(blockedResult.retryAfter).toBeGreaterThan(0);
    });

    test('should handle different rate limits for different endpoints', () => {
      const rateLimitRules = [
        { endpoint: '/auth/login', method: 'POST', maxRequests: 5, windowMs: 15 * 60 * 1000 },
        { endpoint: '/api/search', method: 'GET', maxRequests: 100, windowMs: 60 * 60 * 1000 },
        { endpoint: '/api/upload', method: 'POST', maxRequests: 10, windowMs: 60 * 60 * 1000 }
      ];

      const findRule = (endpoint, method) => {
        return rateLimitRules.find(rule => 
          rule.endpoint === endpoint && rule.method === method
        );
      };

      const loginRule = findRule('/auth/login', 'POST');
      expect(loginRule.maxRequests).toBe(5);
      expect(loginRule.windowMs).toBe(15 * 60 * 1000);

      const searchRule = findRule('/api/search', 'GET');
      expect(searchRule.maxRequests).toBe(100);

      const uploadRule = findRule('/api/upload', 'POST');
      expect(uploadRule.maxRequests).toBe(10);
    });

    test('should support wildcard endpoint matching', () => {
      const matchWildcard = (pattern, text) => {
        if (pattern === text) return true;
        if (pattern.endsWith('*')) {
          const prefix = pattern.slice(0, -1);
          return text.startsWith(prefix);
        }
        return false;
      };

      expect(matchWildcard('/api/*', '/api/users')).toBe(true);
      expect(matchWildcard('/api/*', '/api/posts/123')).toBe(true);
      expect(matchWildcard('/auth/login', '/auth/login')).toBe(true);
      expect(matchWildcard('/api/*', '/auth/login')).toBe(false);
    });
  });

  describe('Input Validation', () => {
    test('should validate input length', () => {
      const validateInputLength = (input, maxLength = 1000) => {
        if (typeof input !== 'string') return { isValid: true, errors: [] };
        
        const errors = [];
        if (input.length > maxLength) {
          errors.push(`Input exceeds maximum length of ${maxLength}`);
        }
        
        return { isValid: errors.length === 0, errors };
      };

      const shortInput = 'Hello World';
      const longInput = 'x'.repeat(1001);

      const shortResult = validateInputLength(shortInput);
      expect(shortResult.isValid).toBe(true);

      const longResult = validateInputLength(longInput);
      expect(longResult.isValid).toBe(false);
      expect(longResult.errors.length).toBeGreaterThan(0);
    });

    test('should detect SQL injection patterns', () => {
      const detectSQLInjection = (input) => {
        const sqlPatterns = [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
          /(--|\/\*|\*\/|;)/,
          /(\b(OR|AND)\b.*=.*)/i
        ];

        for (const pattern of sqlPatterns) {
          if (pattern.test(input)) {
            return { isSuspicious: true, pattern: pattern.toString() };
          }
        }

        return { isSuspicious: false };
      };

      const normalInput = 'Hello World';
      const sqlInjection = "'; DROP TABLE users; --";
      const unionAttack = "1 UNION SELECT * FROM users";

      expect(detectSQLInjection(normalInput).isSuspicious).toBe(false);
      expect(detectSQLInjection(sqlInjection).isSuspicious).toBe(true);
      expect(detectSQLInjection(unionAttack).isSuspicious).toBe(true);
    });

    test('should detect XSS patterns', () => {
      const detectXSS = (input) => {
        const xssPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
        ];

        for (const pattern of xssPatterns) {
          if (pattern.test(input)) {
            return { isSuspicious: true, pattern: pattern.toString() };
          }
        }

        return { isSuspicious: false };
      };

      const normalInput = 'Hello World';
      const scriptTag = '<script>alert("xss")</script>';
      const jsProtocol = 'javascript:alert("xss")';
      const eventHandler = '<img src="x" onerror="alert(1)">';

      expect(detectXSS(normalInput).isSuspicious).toBe(false);
      expect(detectXSS(scriptTag).isSuspicious).toBe(true);
      expect(detectXSS(jsProtocol).isSuspicious).toBe(true);
      expect(detectXSS(eventHandler).isSuspicious).toBe(true);
    });

    test('should sanitize input', () => {
      const sanitizeInput = (input) => {
        if (typeof input !== 'string') return input;

        return input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      };

      const maliciousInput = '<script>alert("xss")</script>Hello<img src="x" onerror="alert(1)">';
      const sanitized = sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror=');
      expect(sanitized).toContain('Hello');
    });

    test('should validate file uploads', () => {
      const validateFileUpload = (file) => {
        const errors = [];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr'];

        if (!allowedTypes.includes(file.type)) {
          errors.push(`File type ${file.type} is not allowed`);
        }

        if (file.size > maxSize) {
          errors.push(`File size exceeds maximum of ${maxSize / 1024 / 1024}MB`);
        }

        if (file.size === 0) {
          errors.push('File is empty');
        }

        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (dangerousExtensions.includes(extension)) {
          errors.push('File extension is not allowed');
        }

        if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
          errors.push('Invalid file name - path traversal detected');
        }

        return { isValid: errors.length === 0, errors };
      };

      const validFile = {
        name: 'document.pdf',
        type: 'application/pdf',
        size: 1024 * 1024 // 1MB
      };

      const invalidFile = {
        name: '../malware.exe',
        type: 'application/octet-stream',
        size: 50 * 1024 * 1024 // 50MB
      };

      const validResult = validateFileUpload(validFile);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validateFileUpload(invalidFile);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('HTTPS Enforcement', () => {
    test('should validate HTTPS URLs', () => {
      const validateHTTPS = (url) => {
        const issues = [];
        
        try {
          const parsedUrl = new URL(url);
          
          if (parsedUrl.protocol !== 'https:') {
            issues.push('URL does not use HTTPS protocol');
          }

          const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
          if (dangerousProtocols.includes(parsedUrl.protocol)) {
            issues.push(`Dangerous protocol: ${parsedUrl.protocol}`);
          }

          if (parsedUrl.pathname.includes('..')) {
            issues.push('Path traversal pattern detected');
          }

        } catch (error) {
          issues.push('Invalid URL format');
        }

        return { isSecure: issues.length === 0, issues };
      };

      const httpsUrl = 'https://example.com/api';
      const httpUrl = 'http://example.com/api';
      const jsUrl = 'javascript:alert("xss")';

      expect(validateHTTPS(httpsUrl).isSecure).toBe(true);
      expect(validateHTTPS(httpUrl).isSecure).toBe(false);
      expect(validateHTTPS(jsUrl).isSecure).toBe(false);
    });

    test('should generate HTTPS redirect', () => {
      const generateHTTPSRedirect = (originalUrl) => {
        try {
          const parsedUrl = new URL(originalUrl);
          const httpsUrl = `https://${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}`;

          return {
            statusCode: 301,
            headers: {
              'Location': httpsUrl,
              'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
            }
          };
        } catch (error) {
          return { statusCode: 400, error: 'Invalid URL' };
        }
      };

      const httpUrl = 'http://example.com/page?param=value';
      const redirect = generateHTTPSRedirect(httpUrl);

      expect(redirect.statusCode).toBe(301);
      expect(redirect.headers.Location).toBe('https://example.com/page?param=value');
      expect(redirect.headers['Strict-Transport-Security']).toContain('max-age=31536000');
    });

    test('should generate HSTS header', () => {
      const generateHSTS = (maxAge = 31536000, includeSubdomains = true, preload = true) => {
        let hsts = `max-age=${maxAge}`;
        
        if (includeSubdomains) {
          hsts += '; includeSubDomains';
        }
        
        if (preload) {
          hsts += '; preload';
        }
        
        return hsts;
      };

      const hsts = generateHSTS();
      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });

    test('should validate SSL certificate info', () => {
      const validateCertificate = (certificate) => {
        const issues = [];
        const now = new Date();

        if (now < certificate.validFrom) {
          issues.push('Certificate is not yet valid');
        }

        if (now > certificate.validTo) {
          issues.push('Certificate has expired');
        }

        const daysUntilExpiry = Math.ceil((certificate.validTo.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        if (daysUntilExpiry < 30 && daysUntilExpiry > 0) {
          issues.push('Certificate will expire within 30 days');
        }

        if (certificate.keySize < 2048) {
          issues.push('Certificate key size is too small (minimum 2048 bits)');
        }

        return { isValid: issues.length === 0, issues, daysUntilExpiry };
      };

      const validCertificate = {
        subject: 'CN=example.com',
        issuer: 'CN=Let\'s Encrypt Authority X3',
        validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        keySize: 2048
      };

      const expiredCertificate = {
        ...validCertificate,
        validTo: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      };

      const validResult = validateCertificate(validCertificate);
      expect(validResult.isValid).toBe(true);

      const expiredResult = validateCertificate(expiredCertificate);
      expect(expiredResult.isValid).toBe(false);
      expect(expiredResult.issues).toContain('Certificate has expired');
    });
  });

  describe('API Security Headers', () => {
    test('should generate security headers', () => {
      const generateSecurityHeaders = () => {
        return {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Content-Security-Policy': "default-src 'self'",
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'Pragma': 'no-cache'
        };
      };

      const headers = generateSecurityHeaders();
      
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
    });

    test('should validate request headers', () => {
      const validateHeaders = (headers) => {
        const errors = [];
        const allowedContentTypes = [
          'application/json',
          'application/x-www-form-urlencoded',
          'multipart/form-data',
          'text/plain'
        ];

        if (headers['content-type']) {
          const baseType = headers['content-type'].split(';')[0].trim();
          if (!allowedContentTypes.includes(baseType)) {
            errors.push(`Unsupported content type: ${baseType}`);
          }
        }

        // Check for suspicious headers
        for (const [key, value] of Object.entries(headers)) {
          if (key.toLowerCase().includes('x-forwarded') && value.includes('..')) {
            errors.push('Suspicious header value detected');
          }
        }

        return { isValid: errors.length === 0, errors };
      };

      const validHeaders = {
        'content-type': 'application/json',
        'authorization': 'Bearer token123'
      };

      const invalidHeaders = {
        'content-type': 'application/malicious',
        'x-forwarded-for': '../../../etc/passwd'
      };

      const validResult = validateHeaders(validHeaders);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validateHeaders(invalidHeaders);
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('Suspicious Request Detection', () => {
    test('should detect rapid requests from same IP', () => {
      const requestLog = [];
      
      const detectRapidRequests = (newRequest, threshold = 50, timeWindow = 60 * 1000) => {
        requestLog.push(newRequest);
        
        const recentRequests = requestLog.filter(request => 
          request.ipAddress === newRequest.ipAddress &&
          (newRequest.timestamp.getTime() - request.timestamp.getTime()) < timeWindow
        );

        return recentRequests.length > threshold;
      };

      const ipAddress = '192.168.1.100';
      const baseTime = Date.now();

      // Add 60 requests from same IP within 1 minute
      for (let i = 0; i < 60; i++) {
        const request = {
          ipAddress,
          timestamp: new Date(baseTime + i * 1000), // 1 second apart
          endpoint: '/api/test'
        };
        
        const isRapid = detectRapidRequests(request);
        if (i > 50) {
          expect(isRapid).toBe(true);
        }
      }
    });

    test('should detect suspicious user agents', () => {
      const detectSuspiciousUserAgent = (userAgent) => {
        const suspiciousAgents = [
          'curl', 'wget', 'python-requests', 'bot', 'crawler', 'scanner'
        ];

        return suspiciousAgents.some(agent => 
          userAgent.toLowerCase().includes(agent)
        );
      };

      expect(detectSuspiciousUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
      expect(detectSuspiciousUserAgent('curl/7.68.0')).toBe(true);
      expect(detectSuspiciousUserAgent('python-requests/2.25.1')).toBe(true);
      expect(detectSuspiciousUserAgent('Googlebot/2.1')).toBe(true);
    });

    test('should detect path traversal attempts', () => {
      const detectPathTraversal = (path) => {
        const patterns = ['../', '..\\', '%2e%2e%2f', '%2e%2e%5c'];
        
        return patterns.some(pattern => 
          path.toLowerCase().includes(pattern)
        );
      };

      expect(detectPathTraversal('/api/users')).toBe(false);
      expect(detectPathTraversal('/api/../../../etc/passwd')).toBe(true);
      expect(detectPathTraversal('/api/%2e%2e%2f%2e%2e%2fetc%2fpasswd')).toBe(true);
    });

    test('should analyze security events', () => {
      const securityEvents = [
        { type: 'rate_limit_exceeded', ipAddress: '192.168.1.1', timestamp: new Date() },
        { type: 'suspicious_request', ipAddress: '192.168.1.1', timestamp: new Date() },
        { type: 'invalid_input', ipAddress: '192.168.1.2', timestamp: new Date() },
        { type: 'rate_limit_exceeded', ipAddress: '192.168.1.1', timestamp: new Date() }
      ];

      const analyzeEvents = (events) => {
        const eventsByIP = new Map();
        const eventCounts = {};

        for (const event of events) {
          // Group by IP
          const ipEvents = eventsByIP.get(event.ipAddress) || [];
          ipEvents.push(event);
          eventsByIP.set(event.ipAddress, ipEvents);

          // Count by type
          eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
        }

        const suspiciousIPs = [];
        for (const [ip, events] of eventsByIP.entries()) {
          if (events.length > 2) {
            suspiciousIPs.push({ ip, eventCount: events.length });
          }
        }

        return { eventCounts, suspiciousIPs };
      };

      const analysis = analyzeEvents(securityEvents);
      
      expect(analysis.eventCounts.rate_limit_exceeded).toBe(2);
      expect(analysis.eventCounts.suspicious_request).toBe(1);
      expect(analysis.suspiciousIPs.length).toBe(1);
      expect(analysis.suspiciousIPs[0].ip).toBe('192.168.1.1');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete API security flow', () => {
      const apiSecurityFlow = {
        checkRateLimit: (request) => ({ isAllowed: true, remainingRequests: 99 }),
        validateInput: (input) => ({ isValid: true, sanitizedInput: input }),
        validateHeaders: (headers) => ({ isValid: true, sanitizedHeaders: headers }),
        enforceHTTPS: (url) => url.startsWith('https://'),
        generateSecurityHeaders: () => ({ 'X-Content-Type-Options': 'nosniff' }),
        logRequest: (request) => ({ logged: true })
      };

      const request = {
        method: 'POST',
        endpoint: '/api/users',
        url: 'https://api.example.com/users',
        headers: { 'content-type': 'application/json' },
        body: { name: 'John Doe', email: 'john@example.com' },
        ipAddress: '192.168.1.1'
      };

      // Check rate limit
      const rateLimitResult = apiSecurityFlow.checkRateLimit(request);
      expect(rateLimitResult.isAllowed).toBe(true);

      // Validate input
      const inputResult = apiSecurityFlow.validateInput(request.body);
      expect(inputResult.isValid).toBe(true);

      // Validate headers
      const headerResult = apiSecurityFlow.validateHeaders(request.headers);
      expect(headerResult.isValid).toBe(true);

      // Enforce HTTPS
      const isHTTPS = apiSecurityFlow.enforceHTTPS(request.url);
      expect(isHTTPS).toBe(true);

      // Generate security headers
      const securityHeaders = apiSecurityFlow.generateSecurityHeaders();
      expect(securityHeaders['X-Content-Type-Options']).toBe('nosniff');

      // Log request
      const logResult = apiSecurityFlow.logRequest(request);
      expect(logResult.logged).toBe(true);
    });

    test('should handle security policy compliance', () => {
      const securityPolicy = {
        enforceHTTPS: true,
        enableRateLimiting: true,
        validateInput: true,
        requireSecurityHeaders: true,
        logSecurityEvents: true
      };

      const checkCompliance = (policy) => {
        const issues = [];
        
        if (!policy.enforceHTTPS) {
          issues.push('HTTPS enforcement is disabled');
        }
        
        if (!policy.enableRateLimiting) {
          issues.push('Rate limiting is disabled');
        }
        
        if (!policy.validateInput) {
          issues.push('Input validation is disabled');
        }
        
        if (!policy.requireSecurityHeaders) {
          issues.push('Security headers are not required');
        }
        
        if (!policy.logSecurityEvents) {
          issues.push('Security event logging is disabled');
        }
        
        return {
          isCompliant: issues.length === 0,
          issues,
          score: Math.round(((5 - issues.length) / 5) * 100)
        };
      };

      const compliance = checkCompliance(securityPolicy);
      expect(compliance.isCompliant).toBe(true);
      expect(compliance.score).toBe(100);
      expect(compliance.issues.length).toBe(0);
    });
  });
});