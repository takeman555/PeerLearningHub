/**
 * Security Headers and Policies Tests
 * Tests for enhanced security headers and CSP implementation
 */

describe('Security Headers and Policies', () => {
  describe('Content Security Policy (CSP)', () => {
    test('should generate basic CSP header', () => {
      const generateCSP = (directives) => {
        const cspParts = [];
        
        for (const [directive, sources] of Object.entries(directives)) {
          if (Array.isArray(sources) && sources.length > 0) {
            const kebabDirective = directive.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            cspParts.push(`${kebabDirective} ${sources.join(' ')}`);
          }
        }
        
        return cspParts.join('; ');
      };

      const directives = {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"]
      };

      const csp = generateCSP(directives);

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain("object-src 'none'");
    });

    test('should add nonce to CSP directives', () => {
      const addNonceToCSP = (csp, nonce) => {
        const nonceDirective = `'nonce-${nonce}'`;
        
        // Add nonce to script-src
        if (csp.includes('script-src')) {
          csp = csp.replace(/script-src ([^;]+)/, `script-src $1 ${nonceDirective}`);
        }
        
        // Add nonce to style-src
        if (csp.includes('style-src')) {
          csp = csp.replace(/style-src ([^;]+)/, `style-src $1 ${nonceDirective}`);
        }
        
        return csp;
      };

      const baseCsp = "default-src 'self'; script-src 'self'; style-src 'self'";
      const nonce = 'abc123def456';
      const cspWithNonce = addNonceToCSP(baseCsp, nonce);

      expect(cspWithNonce).toContain(`'nonce-${nonce}'`);
      expect(cspWithNonce).toContain(`script-src 'self' 'nonce-${nonce}'`);
      expect(cspWithNonce).toContain(`style-src 'self' 'nonce-${nonce}'`);
    });

    test('should validate CSP for security issues', () => {
      const validateCSP = (csp) => {
        const issues = [];
        
        if (csp.includes("'unsafe-eval'")) {
          issues.push({
            severity: 'high',
            message: "CSP contains 'unsafe-eval'",
            recommendation: "Remove 'unsafe-eval' directive"
          });
        }
        
        if (csp.includes("'unsafe-inline'") && !csp.includes("'nonce-")) {
          issues.push({
            severity: 'medium',
            message: "CSP contains 'unsafe-inline' without nonces",
            recommendation: "Use nonces instead of 'unsafe-inline'"
          });
        }
        
        if (csp.includes('*') && !csp.includes('*.')) {
          issues.push({
            severity: 'medium',
            message: 'CSP contains wildcard sources',
            recommendation: 'Use specific domains instead of wildcards'
          });
        }
        
        if (!csp.includes('object-src')) {
          issues.push({
            severity: 'low',
            message: 'Missing object-src directive',
            recommendation: "Add 'object-src 'none''"
          });
        }
        
        return issues;
      };

      const unsafeCSP = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src *";
      const safeCSP = "default-src 'self'; script-src 'self' 'nonce-abc123'; object-src 'none'";

      const unsafeIssues = validateCSP(unsafeCSP);
      const safeIssues = validateCSP(safeCSP);

      expect(unsafeIssues.length).toBeGreaterThan(0);
      expect(unsafeIssues.some(issue => issue.severity === 'high')).toBe(true);
      expect(safeIssues.length).toBeLessThan(unsafeIssues.length);
    });

    test('should generate secure nonce', () => {
      const generateNonce = () => {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array));
      };

      const nonce1 = generateNonce();
      const nonce2 = generateNonce();

      expect(nonce1).toBeDefined();
      expect(nonce2).toBeDefined();
      expect(nonce1).not.toBe(nonce2);
      expect(nonce1.length).toBeGreaterThan(0);
      expect(/^[A-Za-z0-9+/=]+$/.test(nonce1)).toBe(true);
    });
  });

  describe('HTTP Strict Transport Security (HSTS)', () => {
    test('should generate HSTS header', () => {
      const generateHSTS = (maxAge, includeSubDomains = true, preload = true) => {
        let header = `max-age=${maxAge}`;
        
        if (includeSubDomains) {
          header += '; includeSubDomains';
        }
        
        if (preload) {
          header += '; preload';
        }
        
        return header;
      };

      const hsts = generateHSTS(31536000, true, true);

      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });

    test('should validate HSTS configuration', () => {
      const validateHSTS = (hsts) => {
        const issues = [];
        
        const maxAgeMatch = hsts.match(/max-age=(\d+)/);
        if (!maxAgeMatch) {
          issues.push({
            severity: 'high',
            message: 'Missing max-age directive'
          });
        } else {
          const maxAge = parseInt(maxAgeMatch[1]);
          if (maxAge < 31536000) { // 1 year
            issues.push({
              severity: 'medium',
              message: 'HSTS max-age is less than 1 year'
            });
          }
        }
        
        if (!hsts.includes('includeSubDomains')) {
          issues.push({
            severity: 'low',
            message: 'Missing includeSubDomains'
          });
        }
        
        return issues;
      };

      const weakHSTS = 'max-age=86400'; // 1 day
      const strongHSTS = 'max-age=31536000; includeSubDomains; preload';

      const weakIssues = validateHSTS(weakHSTS);
      const strongIssues = validateHSTS(strongHSTS);

      expect(weakIssues.length).toBeGreaterThan(0);
      expect(strongIssues.length).toBe(0);
    });
  });

  describe('Frame Options', () => {
    test('should generate X-Frame-Options header', () => {
      const generateFrameOptions = (policy, allowFrom) => {
        if (policy === 'ALLOW-FROM' && allowFrom) {
          return `ALLOW-FROM ${allowFrom}`;
        }
        return policy;
      };

      expect(generateFrameOptions('DENY')).toBe('DENY');
      expect(generateFrameOptions('SAMEORIGIN')).toBe('SAMEORIGIN');
      expect(generateFrameOptions('ALLOW-FROM', 'https://trusted.com')).toBe('ALLOW-FROM https://trusted.com');
    });

    test('should validate frame options policy', () => {
      const validateFrameOptions = (frameOptions) => {
        const validPolicies = ['DENY', 'SAMEORIGIN'];
        const isAllowFrom = frameOptions.startsWith('ALLOW-FROM ');
        
        if (!validPolicies.includes(frameOptions) && !isAllowFrom) {
          return { isValid: false, message: 'Invalid frame options policy' };
        }
        
        if (frameOptions === 'SAMEORIGIN') {
          return { 
            isValid: true, 
            warning: 'SAMEORIGIN allows framing from same origin - consider DENY for better security' 
          };
        }
        
        return { isValid: true };
      };

      expect(validateFrameOptions('DENY').isValid).toBe(true);
      expect(validateFrameOptions('SAMEORIGIN').warning).toBeDefined();
      expect(validateFrameOptions('INVALID').isValid).toBe(false);
    });
  });

  describe('Permissions Policy', () => {
    test('should generate Permissions Policy header', () => {
      const generatePermissionsPolicy = (policies) => {
        const policyParts = [];
        
        for (const [feature, allowlist] of Object.entries(policies)) {
          const kebabFeature = feature.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
          if (allowlist.length === 0) {
            policyParts.push(`${kebabFeature}=()`);
          } else {
            const sources = allowlist.map(source => 
              source === "'self'" ? 'self' : `"${source}"`
            ).join(' ');
            policyParts.push(`${kebabFeature}=(${sources})`);
          }
        }
        
        return policyParts.join(', ');
      };

      const policies = {
        geolocation: [],
        microphone: [],
        camera: [],
        notifications: ["'self'"],
        fullscreen: ["'self'"]
      };

      const permissionsPolicy = generatePermissionsPolicy(policies);

      expect(permissionsPolicy).toContain('geolocation=()');
      expect(permissionsPolicy).toContain('microphone=()');
      expect(permissionsPolicy).toContain('notifications=(self)');
      expect(permissionsPolicy).toContain('fullscreen=(self)');
    });

    test('should validate permissions policy configuration', () => {
      const validatePermissionsPolicy = (policy) => {
        const issues = [];
        
        // Check for overly permissive policies
        if (policy.includes('geolocation=*')) {
          issues.push({
            feature: 'geolocation',
            severity: 'medium',
            message: 'Geolocation allowed for all origins'
          });
        }
        
        if (policy.includes('microphone=*') || policy.includes('camera=*')) {
          issues.push({
            feature: 'media',
            severity: 'high',
            message: 'Media permissions allowed for all origins'
          });
        }
        
        // Check for missing important restrictions
        if (!policy.includes('geolocation=()')) {
          issues.push({
            feature: 'geolocation',
            severity: 'low',
            message: 'Consider restricting geolocation access'
          });
        }
        
        return issues;
      };

      const permissivePolicy = 'geolocation=*, microphone=*, camera=*';
      const restrictivePolicy = 'geolocation=(), microphone=(), camera=()';

      const permissiveIssues = validatePermissionsPolicy(permissivePolicy);
      const restrictiveIssues = validatePermissionsPolicy(restrictivePolicy);

      expect(permissiveIssues.length).toBeGreaterThan(0);
      expect(restrictiveIssues.length).toBe(0);
    });
  });

  describe('Cross-Origin Policies', () => {
    test('should generate cross-origin policy headers', () => {
      const generateCrossOriginHeaders = (config) => {
        return {
          'Cross-Origin-Embedder-Policy': config.embedderPolicy,
          'Cross-Origin-Opener-Policy': config.openerPolicy,
          'Cross-Origin-Resource-Policy': config.resourcePolicy
        };
      };

      const config = {
        embedderPolicy: 'require-corp',
        openerPolicy: 'same-origin',
        resourcePolicy: 'same-origin'
      };

      const headers = generateCrossOriginHeaders(config);

      expect(headers['Cross-Origin-Embedder-Policy']).toBe('require-corp');
      expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin');
      expect(headers['Cross-Origin-Resource-Policy']).toBe('same-origin');
    });

    test('should validate cross-origin policy values', () => {
      const validateCrossOriginPolicies = (headers) => {
        const issues = [];
        
        const validEmbedderPolicies = ['unsafe-none', 'require-corp'];
        const validOpenerPolicies = ['unsafe-none', 'same-origin-allow-popups', 'same-origin'];
        const validResourcePolicies = ['same-site', 'same-origin', 'cross-origin'];
        
        const embedderPolicy = headers['Cross-Origin-Embedder-Policy'];
        if (embedderPolicy && !validEmbedderPolicies.includes(embedderPolicy)) {
          issues.push({
            header: 'Cross-Origin-Embedder-Policy',
            message: 'Invalid embedder policy value'
          });
        }
        
        const openerPolicy = headers['Cross-Origin-Opener-Policy'];
        if (openerPolicy && !validOpenerPolicies.includes(openerPolicy)) {
          issues.push({
            header: 'Cross-Origin-Opener-Policy',
            message: 'Invalid opener policy value'
          });
        }
        
        const resourcePolicy = headers['Cross-Origin-Resource-Policy'];
        if (resourcePolicy && !validResourcePolicies.includes(resourcePolicy)) {
          issues.push({
            header: 'Cross-Origin-Resource-Policy',
            message: 'Invalid resource policy value'
          });
        }
        
        return issues;
      };

      const validHeaders = {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin'
      };

      const invalidHeaders = {
        'Cross-Origin-Embedder-Policy': 'invalid-policy',
        'Cross-Origin-Opener-Policy': 'invalid-policy',
        'Cross-Origin-Resource-Policy': 'invalid-policy'
      };

      const validIssues = validateCrossOriginPolicies(validHeaders);
      const invalidIssues = validateCrossOriginPolicies(invalidHeaders);

      expect(validIssues.length).toBe(0);
      expect(invalidIssues.length).toBe(3);
    });
  });

  describe('Security Headers Validation', () => {
    test('should validate complete security headers set', () => {
      const validateSecurityHeaders = (headers) => {
        const issues = [];
        let score = 100;
        
        const requiredHeaders = [
          'Content-Security-Policy',
          'Strict-Transport-Security',
          'X-Frame-Options',
          'X-Content-Type-Options',
          'Referrer-Policy'
        ];
        
        for (const header of requiredHeaders) {
          if (!headers[header]) {
            issues.push({
              header,
              severity: header === 'Content-Security-Policy' ? 'high' : 'medium',
              message: `Missing ${header} header`
            });
            score -= header === 'Content-Security-Policy' ? 20 : 10;
          }
        }
        
        // Check for additional security headers
        const optionalHeaders = [
          'Permissions-Policy',
          'Cross-Origin-Embedder-Policy',
          'Cross-Origin-Opener-Policy'
        ];
        
        for (const header of optionalHeaders) {
          if (!headers[header]) {
            score -= 5;
          }
        }
        
        return {
          isValid: issues.filter(i => i.severity === 'high').length === 0,
          score: Math.max(0, score),
          issues
        };
      };

      const completeHeaders = {
        'Content-Security-Policy': "default-src 'self'",
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=()',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      };

      const incompleteHeaders = {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff'
      };

      const completeResult = validateSecurityHeaders(completeHeaders);
      const incompleteResult = validateSecurityHeaders(incompleteHeaders);

      expect(completeResult.isValid).toBe(true);
      expect(completeResult.score).toBeGreaterThan(80);
      expect(incompleteResult.isValid).toBe(false);
      expect(incompleteResult.score).toBeLessThan(completeResult.score);
    });

    test('should calculate security score based on headers', () => {
      const calculateSecurityScore = (headers) => {
        let score = 0;
        
        const headerScores = {
          'Content-Security-Policy': 30,
          'Strict-Transport-Security': 20,
          'X-Frame-Options': 15,
          'X-Content-Type-Options': 10,
          'Referrer-Policy': 10,
          'Permissions-Policy': 10,
          'Cross-Origin-Embedder-Policy': 5
        };
        
        for (const [header, points] of Object.entries(headerScores)) {
          if (headers[header]) {
            score += points;
          }
        }
        
        return score;
      };

      const fullHeaders = {
        'Content-Security-Policy': "default-src 'self'",
        'Strict-Transport-Security': 'max-age=31536000',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=()',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      };

      const partialHeaders = {
        'Content-Security-Policy': "default-src 'self'",
        'X-Frame-Options': 'DENY'
      };

      const fullScore = calculateSecurityScore(fullHeaders);
      const partialScore = calculateSecurityScore(partialHeaders);

      expect(fullScore).toBe(100);
      expect(partialScore).toBe(45); // 30 + 15
    });
  });

  describe('CSP Report Handling', () => {
    test('should parse CSP violation reports', () => {
      const parseCSPReport = (report) => {
        return {
          documentUri: report['document-uri'],
          violatedDirective: report['violated-directive'],
          blockedUri: report['blocked-uri'],
          sourceFile: report['source-file'],
          lineNumber: report['line-number'],
          columnNumber: report['column-number'],
          timestamp: new Date()
        };
      };

      const mockReport = {
        'document-uri': 'https://example.com/page',
        'violated-directive': 'script-src',
        'blocked-uri': 'https://malicious.com/script.js',
        'source-file': 'https://example.com/page',
        'line-number': 42,
        'column-number': 15
      };

      const parsed = parseCSPReport(mockReport);

      expect(parsed.documentUri).toBe('https://example.com/page');
      expect(parsed.violatedDirective).toBe('script-src');
      expect(parsed.blockedUri).toBe('https://malicious.com/script.js');
      expect(parsed.timestamp).toBeInstanceOf(Date);
    });

    test('should analyze CSP violation patterns', () => {
      const analyzeViolations = (violations) => {
        const patterns = {
          byDirective: {},
          bySource: {},
          suspiciousPatterns: []
        };
        
        for (const violation of violations) {
          // Count by directive
          patterns.byDirective[violation.violatedDirective] = 
            (patterns.byDirective[violation.violatedDirective] || 0) + 1;
          
          // Count by source
          const domain = new URL(violation.blockedUri).hostname;
          patterns.bySource[domain] = (patterns.bySource[domain] || 0) + 1;
          
          // Detect suspicious patterns
          if (violation.blockedUri.includes('eval') || violation.blockedUri.includes('javascript:')) {
            patterns.suspiciousPatterns.push({
              type: 'code_injection',
              violation
            });
          }
        }
        
        return patterns;
      };

      const violations = [
        {
          violatedDirective: 'script-src',
          blockedUri: 'https://malicious.com/script.js'
        },
        {
          violatedDirective: 'script-src',
          blockedUri: 'javascript:alert(1)'
        },
        {
          violatedDirective: 'img-src',
          blockedUri: 'https://tracker.com/pixel.gif'
        }
      ];

      const analysis = analyzeViolations(violations);

      expect(analysis.byDirective['script-src']).toBe(2);
      expect(analysis.byDirective['img-src']).toBe(1);
      expect(analysis.suspiciousPatterns.length).toBe(1);
      expect(analysis.suspiciousPatterns[0].type).toBe('code_injection');
    });
  });

  describe('Integration Tests', () => {
    test('should generate complete security headers configuration', () => {
      const generateCompleteSecurityHeaders = () => {
        const headers = {};
        
        // CSP
        headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'nonce-abc123'; object-src 'none'";
        
        // HSTS
        headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
        
        // Frame Options
        headers['X-Frame-Options'] = 'DENY';
        
        // Content Type Options
        headers['X-Content-Type-Options'] = 'nosniff';
        
        // Referrer Policy
        headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
        
        // Permissions Policy
        headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()';
        
        // Cross-Origin Policies
        headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
        headers['Cross-Origin-Opener-Policy'] = 'same-origin';
        headers['Cross-Origin-Resource-Policy'] = 'same-origin';
        
        // Additional Security Headers
        headers['X-XSS-Protection'] = '1; mode=block';
        headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private';
        
        return headers;
      };

      const headers = generateCompleteSecurityHeaders();

      expect(Object.keys(headers).length).toBeGreaterThan(8);
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
      expect(headers['X-Frame-Options']).toBe('DENY');
    });

    test('should handle security headers for different environments', () => {
      const generateEnvironmentHeaders = (environment) => {
        const baseHeaders = {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        };
        
        if (environment === 'production') {
          baseHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
          baseHeaders['Content-Security-Policy'] = "default-src 'self'; script-src 'self'";
        } else if (environment === 'development') {
          baseHeaders['Content-Security-Policy-Report-Only'] = "default-src 'self'; script-src 'self' 'unsafe-inline'";
        }
        
        return baseHeaders;
      };

      const prodHeaders = generateEnvironmentHeaders('production');
      const devHeaders = generateEnvironmentHeaders('development');

      expect(prodHeaders['Strict-Transport-Security']).toBeDefined();
      expect(prodHeaders['Content-Security-Policy']).toBeDefined();
      expect(devHeaders['Content-Security-Policy-Report-Only']).toBeDefined();
      expect(devHeaders['Strict-Transport-Security']).toBeUndefined();
    });
  });
});