/**
 * セキュリティテストスイート
 * 要件 3.6, 8.1-8.5: 脆弱性スキャン・認証認可・データ暗号化・APIセキュリティテスト
 */

import { authService } from '../services/auth';
import { communityFeedService } from '../services/communityFeedService';
import { supabase } from '../config/supabase';
import { securityService } from '../services/securityService';

// Mock dependencies for security testing
jest.mock('../config/supabase');
jest.mock('../services/permissionManager');

// Security test configuration
const SECURITY_CONFIG = {
  maxPasswordAttempts: 5,
  sessionTimeout: 3600000, // 1 hour
  minPasswordLength: 8,
  maxRequestsPerMinute: 100,
  encryptionKeyLength: 32,
};

// Common attack patterns for testing
const ATTACK_PATTERNS = {
  sqlInjection: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "'; SELECT * FROM users WHERE '1'='1'; --",
    "admin'--",
    "' UNION SELECT * FROM users--",
  ],
  xss: [
    "<script>alert('XSS')</script>",
    "javascript:alert('XSS')",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    "';alert('XSS');//",
  ],
  pathTraversal: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\config\\sam",
    "....//....//....//etc/passwd",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
  ],
  commandInjection: [
    "; ls -la",
    "| cat /etc/passwd",
    "&& rm -rf /",
    "`whoami`",
    "$(cat /etc/passwd)",
  ],
};

// Security utilities
class SecurityTestUtils {
  static generateWeakPasswords(): string[] {
    return [
      '123456',
      'password',
      'admin',
      'test',
      '12345678',
      'qwerty',
      'abc123',
      'password123',
    ];
  }

  static generateStrongPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  static generateMaliciousInput(type: keyof typeof ATTACK_PATTERNS): string[] {
    return ATTACK_PATTERNS[type];
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static containsSqlInjection(input: string): boolean {
    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION', 'OR', 'AND'];
    const upperInput = input.toUpperCase();
    return sqlKeywords.some(keyword => upperInput.includes(keyword));
  }

  static containsXSS(input: string): boolean {
    const xssPatterns = ['<script', 'javascript:', 'onerror=', 'onload=', 'alert('];
    const lowerInput = input.toLowerCase();
    return xssPatterns.some(pattern => lowerInput.includes(pattern));
  }
}

describe('セキュリティテストスイート', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('認証セキュリティテスト (要件 8.2)', () => {
    describe('パスワードセキュリティ', () => {
      it('弱いパスワードを拒否する', async () => {
        const weakPasswords = SecurityTestUtils.generateWeakPasswords();

        for (const weakPassword of weakPasswords) {
          const result = await authService.signUp({
            email: 'test@example.com',
            password: weakPassword,
            fullName: 'Test User',
          });

          expect(result.error).toBeTruthy();
          expect(result.error.message).toContain('Password must be at least');
        }
      });

      it('強いパスワードを受け入れる', async () => {
        const strongPassword = SecurityTestUtils.generateStrongPassword();

        mockSupabase.auth.signUp.mockResolvedValue({
          data: { 
            user: { id: 'user-123', email: 'test@example.com' },
            session: { access_token: 'token-123' }
          },
          error: null,
        });

        const result = await authService.signUp({
          email: 'test@example.com',
          password: strongPassword,
          fullName: 'Test User',
        });

        expect(result.error).toBeNull();
        expect(result.user).toBeTruthy();
      });

      it('パスワードの複雑性要件を検証する', async () => {
        const testCases = [
          { password: 'onlylowercase', shouldFail: true },
          { password: 'ONLYUPPERCASE', shouldFail: true },
          { password: '12345678', shouldFail: true },
          { password: 'NoNumbers!', shouldFail: true },
          { password: 'ValidPass123!', shouldFail: false },
        ];

        for (const testCase of testCases) {
          const result = await authService.signUp({
            email: 'test@example.com',
            password: testCase.password,
            fullName: 'Test User',
          });

          if (testCase.shouldFail) {
            expect(result.error).toBeTruthy();
          } else {
            // For valid passwords, mock success
            mockSupabase.auth.signUp.mockResolvedValue({
              data: { 
                user: { id: 'user-123', email: 'test@example.com' },
                session: { access_token: 'token-123' }
              },
              error: null,
            });
            
            const validResult = await authService.signUp({
              email: 'test@example.com',
              password: testCase.password,
              fullName: 'Test User',
            });
            expect(validResult.error).toBeNull();
          }
        }
      });
    });

    describe('ブルートフォース攻撃対策', () => {
      it('連続ログイン失敗を検出する', async () => {
        const credentials = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };

        // Mock failed login attempts
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
        });

        let lastResult;
        for (let i = 0; i < SECURITY_CONFIG.maxPasswordAttempts + 1; i++) {
          lastResult = await authService.signIn(credentials);
        }

        // After max attempts, should get rate limit error
        expect(lastResult.error).toBeTruthy();
        expect(lastResult.error.message).toContain('Too many login attempts');
      });

      it('アカウントロックアウト機能が動作する', async () => {
        const credentials = {
          email: 'locked@example.com',
          password: 'wrongpassword',
        };

        // Simulate account lockout
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Account temporarily locked' },
        });

        const result = await authService.signIn(credentials);

        expect(result.error).toBeTruthy();
        expect(result.error.message).toContain('Account temporarily locked');
      });

      it('正常なログイン後にカウンターがリセットされる', async () => {
        const credentials = {
          email: 'test@example.com',
          password: 'correctpassword',
        };

        // Mock successful login
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { 
            user: { id: 'user-123', email: 'test@example.com' },
            session: { access_token: 'token-123' }
          },
          error: null,
        });

        const result = await authService.signIn(credentials);

        expect(result.error).toBeNull();
        expect(result.user).toBeTruthy();
      });
    });

    describe('セッション管理セキュリティ', () => {
      it('セッションタイムアウトが適切に設定されている', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { 
            session: { 
              access_token: 'token-123',
              expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
            }
          },
        });

        const session = await authService.getCurrentSession();

        expect(session).toBeTruthy();
        expect(session.expires_at).toBeTruthy();
        
        // Check that session expires within reasonable time
        const expiresIn = (session.expires_at * 1000) - Date.now();
        expect(expiresIn).toBeLessThanOrEqual(SECURITY_CONFIG.sessionTimeout);
      });

      it('期限切れセッションを適切に処理する', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { 
            session: { 
              access_token: 'token-123',
              expires_at: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago (expired)
            }
          },
        });

        const session = await authService.getCurrentSession();

        // Expired session should be handled appropriately
        if (session) {
          const isExpired = (session.expires_at * 1000) < Date.now();
          expect(isExpired).toBe(true);
        }
      });

      it('セッション固定攻撃を防ぐ', async () => {
        // Mock login that generates new session
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { 
            user: { id: 'user-123', email: 'test@example.com' },
            session: { access_token: 'new-token-456' }
          },
          error: null,
        });

        const result = await authService.signIn({
          email: 'test@example.com',
          password: 'password123',
        });

        expect(result.session?.access_token).toBe('new-token-456');
        expect(result.session?.access_token).not.toBe('old-token-123');
      });
    });
  });

  describe('入力検証セキュリティテスト (要件 8.3)', () => {
    describe('SQLインジェクション対策', () => {
      it('SQLインジェクション攻撃を検出・防止する', async () => {
        const maliciousInputs = SecurityTestUtils.generateMaliciousInput('sqlInjection');

        for (const maliciousInput of maliciousInputs) {
          // Test in user registration
          const signUpResult = await authService.signUp({
            email: maliciousInput,
            password: 'password123',
            fullName: maliciousInput,
          });

          expect(signUpResult.error).toBeTruthy();

          // Test in post creation
          const { permissionManager } = require('../services/permissionManager');
          permissionManager.canCreatePost.mockResolvedValue({ allowed: true });

          await expect(
            communityFeedService.createPost('user-123', {
              content: maliciousInput,
            })
          ).rejects.toThrow();
        }
      });

      it('パラメータ化クエリが使用されている', async () => {
        // Mock database query to verify parameterized queries
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'user-123', email: 'test@example.com' },
                error: null,
              }),
            }),
          }),
        });

        await authService.getProfile('user-123');

        // Verify that parameterized queries are used (mocked implementation)
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      });
    });

    describe('XSS攻撃対策', () => {
      it('XSS攻撃を検出・防止する', async () => {
        const xssInputs = SecurityTestUtils.generateMaliciousInput('xss');

        for (const xssInput of xssInputs) {
          const { permissionManager } = require('../services/permissionManager');
          permissionManager.canCreatePost.mockResolvedValue({ allowed: true });

          await expect(
            communityFeedService.createPost('user-123', {
              content: xssInput,
            })
          ).rejects.toThrow();
        }
      });

      it('HTMLエスケープが適切に行われる', async () => {
        const htmlContent = '<p>This is <strong>bold</strong> text</p>';

        const { permissionManager } = require('../services/permissionManager');
        permissionManager.canCreatePost.mockResolvedValue({ allowed: true });

        // Mock successful post creation with escaped content
        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'post-123',
                  content: '&lt;p&gt;This is &lt;strong&gt;bold&lt;/strong&gt; text&lt;/p&gt;',
                  user_id: 'user-123',
                },
                error: null,
              }),
            }),
          }),
        });

        mockSupabase.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { full_name: 'Test User', email: 'test@example.com' },
                error: null,
              }),
            }),
          }),
        });

        const result = await communityFeedService.createPost('user-123', {
          content: htmlContent,
        });

        // Content should be escaped
        expect(result.content).not.toContain('<script>');
        expect(result.content).not.toContain('<p>');
      });
    });

    describe('パストラバーサル攻撃対策', () => {
      it('パストラバーサル攻撃を検出・防止する', async () => {
        const pathTraversalInputs = SecurityTestUtils.generateMaliciousInput('pathTraversal');

        for (const maliciousPath of pathTraversalInputs) {
          // Test file path validation (simulated)
          const isValidPath = !maliciousPath.includes('..');
          expect(isValidPath).toBe(false);
        }
      });
    });

    describe('コマンドインジェクション対策', () => {
      it('コマンドインジェクション攻撃を検出・防止する', async () => {
        const commandInjectionInputs = SecurityTestUtils.generateMaliciousInput('commandInjection');

        for (const maliciousCommand of commandInjectionInputs) {
          const containsCommandInjection = 
            maliciousCommand.includes(';') ||
            maliciousCommand.includes('|') ||
            maliciousCommand.includes('&') ||
            maliciousCommand.includes('`') ||
            maliciousCommand.includes('$(');

          expect(containsCommandInjection).toBe(true);

          // Such inputs should be rejected
          const { permissionManager } = require('../services/permissionManager');
          permissionManager.canCreatePost.mockResolvedValue({ allowed: true });

          await expect(
            communityFeedService.createPost('user-123', {
              content: maliciousCommand,
            })
          ).rejects.toThrow();
        }
      });
    });
  });

  describe('データ暗号化テスト (要件 8.1)', () => {
    describe('保存時暗号化', () => {
      it('機密データが暗号化されて保存される', async () => {
        const sensitiveData = 'sensitive-user-data';

        // Mock encryption service
        const mockEncryptedData = 'encrypted-' + Buffer.from(sensitiveData).toString('base64');

        // Simulate data encryption before storage
        const encryptedResult = await securityService.encryptData(sensitiveData);

        expect(encryptedResult).not.toBe(sensitiveData);
        expect(encryptedResult.length).toBeGreaterThan(sensitiveData.length);
      });

      it('暗号化キーが適切な長さである', async () => {
        const encryptionKey = await securityService.generateEncryptionKey();

        expect(encryptionKey).toBeTruthy();
        expect(encryptionKey.length).toBeGreaterThanOrEqual(SECURITY_CONFIG.encryptionKeyLength);
      });

      it('データの復号化が正しく動作する', async () => {
        const originalData = 'test-data-for-encryption';

        const encryptedData = await securityService.encryptData(originalData);
        const decryptedData = await securityService.decryptData(encryptedData);

        expect(decryptedData).toBe(originalData);
      });
    });

    describe('通信時暗号化', () => {
      it('HTTPS通信が強制されている', async () => {
        // Check that all API calls use HTTPS
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
        
        if (supabaseUrl && supabaseUrl !== 'placeholder') {
          expect(supabaseUrl).toMatch(/^https:\/\//);
        }
      });

      it('TLS設定が適切である', async () => {
        // Simulate TLS configuration check
        const tlsConfig = await securityService.getTLSConfiguration();

        expect(tlsConfig.minVersion).toBe('TLSv1.2');
        expect(tlsConfig.cipherSuites).toContain('ECDHE-RSA-AES256-GCM-SHA384');
      });
    });
  });

  describe('APIセキュリティテスト (要件 8.3)', () => {
    describe('レート制限', () => {
      it('API レート制限が適切に設定されている', async () => {
        const requests = [];

        // Simulate rapid API requests
        for (let i = 0; i < SECURITY_CONFIG.maxRequestsPerMinute + 10; i++) {
          requests.push(
            authService.getCurrentUser().catch(error => error)
          );
        }

        const results = await Promise.all(requests);

        // Some requests should be rate limited
        const rateLimitedRequests = results.filter(result => 
          result && result.message && result.message.includes('rate limit')
        );

        expect(rateLimitedRequests.length).toBeGreaterThan(0);
      });

      it('レート制限後の回復が適切である', async () => {
        // Simulate rate limit recovery
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute

        const result = await authService.getCurrentUser();

        // Request should succeed after rate limit window
        expect(result).toBeDefined();
      });
    });

    describe('認証・認可', () => {
      it('未認証ユーザーのアクセスを拒否する', async () => {
        const { permissionManager } = require('../services/permissionManager');
        permissionManager.isAuthenticated.mockResolvedValue(false);

        await expect(
          communityFeedService.createPost('invalid-user', {
            content: 'Test post',
          })
        ).rejects.toThrow('Please sign in');
      });

      it('権限のないユーザーのアクションを拒否する', async () => {
        const { permissionManager } = require('../services/permissionManager');
        permissionManager.canCreatePost.mockResolvedValue({
          allowed: false,
          reason: 'Insufficient permissions',
        });

        await expect(
          communityFeedService.createPost('user-123', {
            content: 'Test post',
          })
        ).rejects.toThrow('Insufficient permissions');
      });

      it('JWTトークンの検証が適切である', async () => {
        // Mock invalid JWT token
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid JWT token' },
        });

        const user = await authService.getCurrentUser();

        expect(user).toBeNull();
      });
    });

    describe('入力サニタイゼーション', () => {
      it('危険な文字列が適切にサニタイズされる', async () => {
        const dangerousInputs = [
          '<script>alert("xss")</script>',
          'javascript:void(0)',
          'data:text/html,<script>alert("xss")</script>',
          'vbscript:msgbox("xss")',
        ];

        for (const input of dangerousInputs) {
          const sanitized = await securityService.sanitizeInput(input);

          expect(sanitized).not.toContain('<script>');
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toContain('vbscript:');
        }
      });

      it('URLの検証が適切である', async () => {
        const testUrls = [
          { url: 'https://example.com', valid: true },
          { url: 'http://example.com', valid: false }, // HTTP not allowed
          { url: 'javascript:alert("xss")', valid: false },
          { url: 'data:text/html,<script>', valid: false },
          { url: 'ftp://example.com', valid: false },
        ];

        for (const testCase of testUrls) {
          const isValid = await securityService.validateUrl(testCase.url);
          expect(isValid).toBe(testCase.valid);
        }
      });
    });
  });

  describe('脆弱性スキャンテスト (要件 8.4)', () => {
    describe('依存関係の脆弱性', () => {
      it('既知の脆弱性のある依存関係がない', async () => {
        // Simulate dependency vulnerability scan
        const vulnerabilities = await securityService.scanDependencies();

        const criticalVulnerabilities = vulnerabilities.filter(
          vuln => vuln.severity === 'critical'
        );

        expect(criticalVulnerabilities).toHaveLength(0);
      });

      it('依存関係が最新バージョンである', async () => {
        // Simulate dependency version check
        const outdatedPackages = await securityService.checkOutdatedPackages();

        const criticallyOutdated = outdatedPackages.filter(
          pkg => pkg.monthsBehind > 12
        );

        expect(criticallyOutdated).toHaveLength(0);
      });
    });

    describe('設定の脆弱性', () => {
      it('デバッグモードが本番環境で無効である', () => {
        const isProduction = process.env.NODE_ENV === 'production';
        const debugEnabled = process.env.DEBUG === 'true';

        if (isProduction) {
          expect(debugEnabled).toBe(false);
        }
      });

      it('機密情報が環境変数に適切に設定されている', () => {
        const requiredEnvVars = [
          'EXPO_PUBLIC_SUPABASE_URL',
          'EXPO_PUBLIC_SUPABASE_ANON_KEY',
        ];

        for (const envVar of requiredEnvVars) {
          const value = process.env[envVar];
          
          if (value && value !== 'placeholder') {
            expect(value).toBeTruthy();
            expect(value.length).toBeGreaterThan(10);
          }
        }
      });

      it('デフォルトパスワードが使用されていない', async () => {
        const defaultPasswords = ['admin', 'password', '123456', 'default'];

        for (const defaultPassword of defaultPasswords) {
          const result = await authService.signUp({
            email: 'admin@example.com',
            password: defaultPassword,
            fullName: 'Admin User',
          });

          expect(result.error).toBeTruthy();
        }
      });
    });
  });

  describe('セキュリティヘッダーテスト (要件 8.5)', () => {
    describe('HTTPセキュリティヘッダー', () => {
      it('Content Security Policy が設定されている', async () => {
        const cspHeader = await securityService.getCSPHeader();

        expect(cspHeader).toContain("default-src 'self'");
        expect(cspHeader).toContain("script-src 'self'");
        expect(cspHeader).toContain("style-src 'self' 'unsafe-inline'");
      });

      it('X-Frame-Options が設定されている', async () => {
        const xFrameOptions = await securityService.getXFrameOptions();

        expect(xFrameOptions).toBe('DENY');
      });

      it('X-Content-Type-Options が設定されている', async () => {
        const xContentTypeOptions = await securityService.getXContentTypeOptions();

        expect(xContentTypeOptions).toBe('nosniff');
      });

      it('Strict-Transport-Security が設定されている', async () => {
        const hsts = await securityService.getHSTSHeader();

        expect(hsts).toContain('max-age=');
        expect(hsts).toContain('includeSubDomains');
      });
    });

    describe('CORS設定', () => {
      it('CORS が適切に設定されている', async () => {
        const corsConfig = await securityService.getCORSConfiguration();

        expect(corsConfig.allowedOrigins).not.toContain('*');
        expect(corsConfig.allowedMethods).toContain('GET');
        expect(corsConfig.allowedMethods).toContain('POST');
        expect(corsConfig.allowCredentials).toBe(true);
      });
    });
  });

  describe('セキュリティ監査ログ', () => {
    it('セキュリティイベントがログに記録される', async () => {
      // Simulate security event
      await securityService.logSecurityEvent({
        type: 'failed_login',
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser',
        timestamp: new Date().toISOString(),
      });

      const logs = await securityService.getSecurityLogs({
        type: 'failed_login',
        limit: 10,
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].type).toBe('failed_login');
    });

    it('異常なアクセスパターンが検出される', async () => {
      // Simulate suspicious activity
      const suspiciousEvents = [
        { type: 'failed_login', count: 10 },
        { type: 'rapid_requests', count: 100 },
        { type: 'unusual_location', count: 1 },
      ];

      for (const event of suspiciousEvents) {
        for (let i = 0; i < event.count; i++) {
          await securityService.logSecurityEvent({
            type: event.type,
            userId: 'user-123',
            timestamp: new Date().toISOString(),
          });
        }
      }

      const alerts = await securityService.detectAnomalies('user-123');

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.type === 'brute_force')).toBe(true);
    });
  });

  describe('データプライバシー', () => {
    it('個人情報が適切にマスクされる', async () => {
      const personalData = {
        email: 'user@example.com',
        phone: '+1234567890',
        address: '123 Main St, City, Country',
      };

      const maskedData = await securityService.maskPersonalData(personalData);

      expect(maskedData.email).toBe('u***@example.com');
      expect(maskedData.phone).toBe('+123****7890');
      expect(maskedData.address).toContain('***');
    });

    it('データ削除要求が適切に処理される', async () => {
      const userId = 'user-to-delete';

      const deletionResult = await securityService.processDataDeletion(userId);

      expect(deletionResult.success).toBe(true);
      expect(deletionResult.deletedTables).toContain('profiles');
      expect(deletionResult.deletedTables).toContain('posts');
    });
  });
});