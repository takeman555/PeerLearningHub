/**
 * Enhanced Encryption Tests
 * Tests for the improved data encryption implementation
 */

import { encryptionService } from '../services/encryptionService';
import { keyManagementService } from '../services/keyManagementService';
import { transportSecurityService } from '../services/transportSecurityService';
import { securityService } from '../services/securityService';

describe('Enhanced Encryption Implementation', () => {
  beforeEach(() => {
    // Reset services for each test
    jest.clearAllMocks();
  });

  describe('EncryptionService', () => {
    test('should encrypt and decrypt data successfully', async () => {
      const testData = 'sensitive user information';
      
      const encrypted = await encryptionService.encryptData(testData);
      expect(encrypted).toBeDefined();
      expect(encrypted.data).not.toBe(testData);
      expect(encrypted.keyId).toBeDefined();
      expect(encrypted.algorithm).toBe('AES-256-GCM');
      expect(encrypted.iv).toBeDefined();

      const decrypted = await encryptionService.decryptData(encrypted);
      expect(decrypted).toBe(testData);
    });

    test('should encrypt and decrypt PII data', async () => {
      const piiData = {
        email: 'user@example.com',
        phone: '+1234567890',
        name: 'John Doe',
        address: '123 Main St, City, State',
      };

      const encrypted = await encryptionService.encryptPII(piiData);
      expect(encrypted.email).toBeDefined();
      expect(encrypted.phone).toBeDefined();
      expect(encrypted.name).toBeDefined();
      expect(encrypted.address).toBeDefined();

      const decrypted = await encryptionService.decryptPII(encrypted);
      expect(decrypted).toEqual(piiData);
    });

    test('should encrypt database fields with metadata', async () => {
      const tableName = 'users';
      const fieldName = 'email';
      const value = 'user@example.com';

      const encrypted = await encryptionService.encryptDatabaseField(tableName, fieldName, value);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');

      const decrypted = await encryptionService.decryptDatabaseField(encrypted);
      expect(decrypted).toBe(value);
    });

    test('should generate new encryption keys', async () => {
      const keyId = await encryptionService.generateNewKey();
      expect(keyId).toBeDefined();
      expect(typeof keyId).toBe('string');

      const keyInfo = encryptionService.getKeyInfo(keyId);
      expect(keyInfo).toBeDefined();
      expect(keyInfo?.keyId).toBe(keyId);
      expect(keyInfo?.algorithm).toBe('AES-256-GCM');
    });

    test('should rotate encryption keys', async () => {
      const initialStats = encryptionService.getEncryptionStats();
      const initialKeyId = initialStats.currentKeyId;

      const result = await encryptionService.rotateKeys();
      expect(result).toBeDefined();
      expect(result.oldKeyId).toBe(initialKeyId);
      expect(result.newKeyId).toBeDefined();
      expect(result.newKeyId).not.toBe(initialKeyId);

      const newStats = encryptionService.getEncryptionStats();
      expect(newStats.currentKeyId).toBe(result.newKeyId);
    });

    test('should detect when key rotation is needed', () => {
      const isNeeded = encryptionService.isKeyRotationNeeded();
      expect(typeof isNeeded).toBe('boolean');
    });

    test('should export and import keys securely', async () => {
      const keyId = await encryptionService.generateNewKey();
      const masterPassword = 'secure-master-password-123';

      const exportedKey = await encryptionService.exportKey(keyId, masterPassword);
      expect(exportedKey).toBeDefined();
      expect(typeof exportedKey).toBe('string');

      // Delete the key to test import
      await encryptionService.deleteKey(keyId);

      const importedKeyId = await encryptionService.importKey(exportedKey, masterPassword);
      expect(importedKeyId).toBe(keyId);
    });

    test('should validate encryption configuration', () => {
      const validation = encryptionService.validateConfiguration();
      expect(validation).toBeDefined();
      expect(validation.isValid).toBe(true);
      expect(Array.isArray(validation.errors)).toBe(true);
    });
  });

  describe('KeyManagementService', () => {
    test('should generate keys with proper metadata', async () => {
      const keyId = await keyManagementService.generateKey('encryption', 'AES-256-GCM');
      expect(keyId).toBeDefined();

      const metadata = keyManagementService.getKeyMetadata(keyId);
      expect(metadata).toBeDefined();
      expect(metadata?.purpose).toBe('encryption');
      expect(metadata?.algorithm).toBe('AES-256-GCM');
      expect(metadata?.status).toBe('active');
    });

    test('should list keys with filtering', async () => {
      await keyManagementService.generateKey('encryption');
      await keyManagementService.generateKey('signing');

      const allKeys = keyManagementService.listKeys();
      expect(allKeys.length).toBeGreaterThan(0);

      const encryptionKeys = keyManagementService.listKeys({ purpose: 'encryption' });
      expect(encryptionKeys.length).toBeGreaterThan(0);
      expect(encryptionKeys.every(k => k.purpose === 'encryption')).toBe(true);
    });

    test('should update key usage statistics', async () => {
      const keyId = await keyManagementService.generateKey('encryption');
      
      keyManagementService.updateKeyUsage(keyId, 'encrypt');
      keyManagementService.updateKeyUsage(keyId, 'decrypt');

      const metadata = keyManagementService.getKeyMetadata(keyId);
      expect(metadata?.usage.encryptionCount).toBe(1);
      expect(metadata?.usage.decryptionCount).toBe(1);
    });

    test('should rotate keys properly', async () => {
      const keyId = await keyManagementService.generateKey('encryption');
      const newKeyId = await keyManagementService.rotateKey(keyId);

      expect(newKeyId).toBeDefined();
      expect(newKeyId).not.toBe(keyId);

      const oldMetadata = keyManagementService.getKeyMetadata(keyId);
      expect(oldMetadata?.status).toBe('inactive');
      expect(oldMetadata?.rotatedAt).toBeDefined();
    });

    test('should handle key compromise', async () => {
      const keyId = await keyManagementService.generateKey('encryption');
      
      await keyManagementService.compromiseKey(keyId, 'Security breach detected');

      const metadata = keyManagementService.getKeyMetadata(keyId);
      expect(metadata?.status).toBe('compromised');
    });

    test('should backup and restore keys', async () => {
      const keyId = await keyManagementService.generateKey('encryption');
      const masterPassword = 'backup-password-123';

      const backups = await keyManagementService.backupKeys(masterPassword);
      expect(backups.length).toBeGreaterThan(0);
      expect(backups[0].keyId).toBeDefined();
      expect(backups[0].encryptedKey).toBeDefined();
      expect(backups[0].checksum).toBeDefined();

      // Test restoration would require more complex setup
      // This is a basic structure test
    });

    test('should generate key management report', () => {
      const report = keyManagementService.generateKeyManagementReport();
      expect(report).toBeDefined();
      expect(typeof report.totalKeys).toBe('number');
      expect(typeof report.activeKeys).toBe('number');
      expect(report.keyUsageStats).toBeDefined();
    });

    test('should validate key management configuration', () => {
      const validation = keyManagementService.validateConfiguration();
      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.errors)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });
  });

  describe('TransportSecurityService', () => {
    test('should generate proper security headers', () => {
      const headers = transportSecurityService.getSecurityHeaders();
      expect(headers).toBeDefined();
      expect(headers['Strict-Transport-Security']).toBeDefined();
      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['X-Frame-Options']).toBeDefined();
      expect(headers['X-Content-Type-Options']).toBeDefined();
    });

    test('should validate HTTPS enforcement', () => {
      const httpsUrl = 'https://example.com/api';
      const httpUrl = 'http://example.com/api';

      const httpsValidation = transportSecurityService.validateHTTPSEnforcement(httpsUrl);
      expect(httpsValidation.isSecure).toBe(true);
      expect(httpsValidation.issues.length).toBe(0);

      const httpValidation = transportSecurityService.validateHTTPSEnforcement(httpUrl);
      expect(httpValidation.isSecure).toBe(false);
      expect(httpValidation.issues.length).toBeGreaterThan(0);
    });

    test('should get TLS configuration', () => {
      const tlsConfig = transportSecurityService.getTLSConfiguration();
      expect(tlsConfig).toBeDefined();
      expect(tlsConfig.minVersion).toBeDefined();
      expect(tlsConfig.cipherSuites).toBeDefined();
      expect(Array.isArray(tlsConfig.cipherSuites)).toBe(true);
    });

    test('should validate TLS configuration', () => {
      const validation = transportSecurityService.validateTLSConfiguration();
      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    test('should generate CSP header', () => {
      const csp = transportSecurityService.generateCSP({
        allowInlineStyles: false,
        allowInlineScripts: false,
        allowEval: false,
      });
      expect(csp).toBeDefined();
      expect(typeof csp).toBe('string');
      expect(csp).toContain("default-src 'self'");
    });

    test('should validate CSP header', () => {
      const cspHeader = "default-src 'self'; script-src 'self'; style-src 'self'";
      const validation = transportSecurityService.validateCSP(cspHeader);
      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.warnings)).toBe(true);
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    test('should validate CORS configuration', () => {
      const validOrigin = 'https://peerlearninghub.com';
      const invalidOrigin = 'https://malicious-site.com';

      const validResult = transportSecurityService.validateCORSConfiguration(validOrigin);
      expect(validResult).toBe(true);

      const invalidResult = transportSecurityService.validateCORSConfiguration(invalidOrigin);
      expect(invalidResult).toBe(false);
    });

    test('should check for mixed content', () => {
      const httpsPage = 'https://example.com/page';
      const resources = [
        'https://example.com/secure.js',
        'http://example.com/insecure.js',
        'https://cdn.example.com/secure.css',
      ];

      const result = transportSecurityService.checkMixedContent(httpsPage, resources);
      expect(result).toBeDefined();
      expect(result.hasMixedContent).toBe(true);
      expect(result.insecureResources).toContain('http://example.com/insecure.js');
    });

    test('should generate transport security report', () => {
      const report = transportSecurityService.getTransportSecurityReport();
      expect(report).toBeDefined();
      expect(typeof report.httpsEnforced).toBe('boolean');
      expect(typeof report.hstsEnabled).toBe('boolean');
      expect(report.tlsVersion).toBeDefined();
      expect(report.securityHeaders).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Enhanced SecurityService Integration', () => {
    test('should encrypt and decrypt data using enhanced service', async () => {
      const testData = 'sensitive information';
      
      const encrypted = await securityService.encryptData(testData);
      expect(encrypted).toBeDefined();
      expect(encrypted.data).toBeDefined();
      expect(encrypted.keyId).toBeDefined();

      const decrypted = await securityService.decryptData(encrypted);
      expect(decrypted).toBe(testData);
    });

    test('should encrypt and decrypt PII data', async () => {
      const piiData = {
        email: 'user@example.com',
        phone: '+1234567890',
        name: 'John Doe',
      };

      const encrypted = await securityService.encryptPII(piiData);
      expect(encrypted).toBeDefined();
      expect(encrypted.email).toBeDefined();

      const decrypted = await securityService.decryptPII(encrypted);
      expect(decrypted.email).toBe(piiData.email);
    });

    test('should encrypt and decrypt database fields', async () => {
      const tableName = 'users';
      const fieldName = 'email';
      const value = 'user@example.com';

      const encrypted = await securityService.encryptDatabaseField(tableName, fieldName, value);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');

      const decrypted = await securityService.decryptDatabaseField(encrypted);
      expect(decrypted).toBe(value);
    });

    test('should perform comprehensive security scan', async () => {
      const scanResult = await securityService.performSecurityScan();
      expect(scanResult).toBeDefined();
      expect(scanResult.scanId).toBeDefined();
      expect(scanResult.timestamp).toBeDefined();
      expect(Array.isArray(scanResult.vulnerabilities)).toBe(true);
      expect(scanResult.overallRisk).toBeDefined();
    });

    test('should validate password with enhanced policy', () => {
      const strongPassword = 'StrongP@ssw0rd123!';
      const weakPassword = 'weak';

      const strongResult = securityService.validatePassword(strongPassword);
      expect(strongResult.isValid).toBe(true);
      expect(strongResult.strength).toBe('strong');

      const weakResult = securityService.validatePassword(weakPassword);
      expect(weakResult.isValid).toBe(false);
      expect(weakResult.errors.length).toBeGreaterThan(0);
    });

    test('should sanitize input properly', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = securityService.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Hello World');
    });

    test('should validate file uploads securely', () => {
      const validFile = {
        name: 'document.pdf',
        type: 'application/pdf',
        size: 1024 * 1024, // 1MB
      };

      const invalidFile = {
        name: 'malware.exe',
        type: 'application/octet-stream',
        size: 50 * 1024 * 1024, // 50MB
      };

      const validResult = securityService.validateFileUpload(validFile);
      expect(validResult.isValid).toBe(true);

      const invalidResult = securityService.validateFileUpload(invalidFile);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    test('should work together for end-to-end encryption', async () => {
      // Generate a new key
      const keyId = await keyManagementService.generateKey('encryption');
      
      // Encrypt some data
      const testData = 'end-to-end test data';
      const encrypted = await encryptionService.encryptData(testData, keyId);
      
      // Update usage statistics
      keyManagementService.updateKeyUsage(keyId, 'encrypt');
      
      // Decrypt the data
      const decrypted = await encryptionService.decryptData(encrypted);
      keyManagementService.updateKeyUsage(keyId, 'decrypt');
      
      expect(decrypted).toBe(testData);
      
      // Verify usage statistics
      const metadata = keyManagementService.getKeyMetadata(keyId);
      expect(metadata?.usage.encryptionCount).toBe(1);
      expect(metadata?.usage.decryptionCount).toBe(1);
    });

    test('should handle key rotation with active data', async () => {
      // Create initial key and encrypt data
      const initialKeyId = await keyManagementService.generateKey('encryption');
      const testData = 'data before rotation';
      const encrypted = await encryptionService.encryptData(testData, initialKeyId);
      
      // Rotate the key
      const newKeyId = await keyManagementService.rotateKey(initialKeyId);
      
      // Should still be able to decrypt with old key
      const decrypted = await encryptionService.decryptData(encrypted);
      expect(decrypted).toBe(testData);
      
      // New encryptions should use new key
      const newEncrypted = await encryptionService.encryptData('new data');
      expect(newEncrypted.keyId).toBe(newKeyId);
    });
  });
});