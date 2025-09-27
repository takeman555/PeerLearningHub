/**
 * Enhanced Encryption Service
 * Provides robust data encryption and key management for PeerLearningHub
 */

import { productionSecurityConfig } from '../config/security';

export interface EncryptionKeyInfo {
  keyId: string;
  algorithm: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface EncryptedData {
  data: string;
  keyId: string;
  algorithm: string;
  iv: string;
  timestamp: Date;
}

export interface KeyRotationResult {
  oldKeyId: string;
  newKeyId: string;
  rotatedAt: Date;
  affectedRecords: number;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private keys: Map<string, CryptoKey | null> = new Map();
  private keyInfo: Map<string, EncryptionKeyInfo> = new Map();
  private currentKeyId: string | null = null;
  private readonly supportsWebCrypto: boolean;

  private constructor() {
    this.supportsWebCrypto = typeof globalThis !== 'undefined' &&
      typeof globalThis.crypto !== 'undefined' &&
      !!globalThis.crypto.subtle;

    if (!this.supportsWebCrypto) {
      console.warn('crypto.subtle not available, falling back to mock encryption.');
    }

    this.initializeEncryption();
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Initialize encryption system
   */
  private async initializeEncryption(): Promise<void> {
    try {
      // Generate initial encryption key if none exists
      if (this.keys.size === 0) {
        await this.generateNewKey();
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw new Error('Encryption initialization failed');
    }
  }

  /**
   * Generate a new encryption key
   */
  async generateNewKey(): Promise<string> {
    try {
      const keyId = this.generateKeyId();
      let key: CryptoKey | null = null;

      if (this.supportsWebCrypto) {
        key = await crypto.subtle.generateKey(
          {
            name: 'AES-GCM',
            length: 256, // 256-bit key
          },
          true, // extractable
          ['encrypt', 'decrypt']
        );
      }

      const keyInfo: EncryptionKeyInfo = {
        keyId,
        algorithm: this.supportsWebCrypto ? 'AES-256-GCM' : 'MOCK-NO-ENCRYPTION',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + productionSecurityConfig.encryption.keyRotationInterval * 24 * 60 * 60 * 1000),
        isActive: true,
      };

      this.keys.set(keyId, key);
      this.keyInfo.set(keyId, keyInfo);

      // Set as current key if it's the first one
      if (!this.currentKeyId) {
        this.currentKeyId = keyId;
      }

      return keyId;
    } catch (error) {
      console.error('Failed to generate encryption key:', error);
      throw new Error('Key generation failed');
    }
  }

  /**
   * Generate unique key ID
   */
  private generateKeyId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `key_${timestamp}_${random}`;
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(data: string, keyId?: string): Promise<EncryptedData> {
    try {
      const useKeyId = keyId || this.currentKeyId;
      if (!useKeyId) {
        throw new Error('No encryption key available');
      }

      const key = this.keys.get(useKeyId);
      if (!this.supportsWebCrypto) {
        return {
          data: this.encodeBase64(data),
          keyId: useKeyId,
          algorithm: 'MOCK-NO-ENCRYPTION',
          iv: '',
          timestamp: new Date(),
        };
      }

      if (!key) {
        throw new Error(`Encryption key not found: ${useKeyId}`);
      }

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        dataBuffer
      );

      const encryptedArray = new Uint8Array(encrypted);
      const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
      const ivBase64 = btoa(String.fromCharCode(...iv));

      return {
        data: encryptedBase64,
        keyId: useKeyId,
        algorithm: 'AES-256-GCM',
        iv: ivBase64,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Data encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: EncryptedData): Promise<string> {
    try {
      const key = this.keys.get(encryptedData.keyId);
      if (!this.supportsWebCrypto) {
        return this.decodeBase64(encryptedData.data);
      }

      if (!key) {
        throw new Error(`Decryption key not found: ${encryptedData.keyId}`);
      }

      const encryptedBuffer = new Uint8Array(
        atob(encryptedData.data).split('').map(char => char.charCodeAt(0))
      );
      const iv = new Uint8Array(
        atob(encryptedData.iv).split('').map(char => char.charCodeAt(0))
      );

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Data decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  private encodeBase64(value: string): string {
    if (typeof btoa === 'function') {
      return btoa(unescape(encodeURIComponent(value)));
    }

    const maybeBuffer = (globalThis as any).Buffer;
    if (maybeBuffer?.from) {
      return maybeBuffer.from(value, 'utf-8').toString('base64');
    }

    throw new Error('No base64 encoder available in this environment');
  }

  private decodeBase64(value: string): string {
    if (typeof atob === 'function') {
      return decodeURIComponent(escape(atob(value)));
    }

    const maybeBuffer = (globalThis as any).Buffer;
    if (maybeBuffer?.from) {
      return maybeBuffer.from(value, 'base64').toString('utf-8');
    }

    throw new Error('No base64 decoder available in this environment');
  }

  /**
   * Encrypt personal identifiable information (PII)
   */
  async encryptPII(piiData: {
    email?: string;
    phone?: string;
    address?: string;
    name?: string;
  }): Promise<{ [key: string]: EncryptedData }> {
    const encrypted: { [key: string]: EncryptedData } = {};

    for (const [field, value] of Object.entries(piiData)) {
      if (value && typeof value === 'string') {
        encrypted[field] = await this.encryptData(value);
      }
    }

    return encrypted;
  }

  /**
   * Decrypt personal identifiable information (PII)
   */
  async decryptPII(encryptedPII: { [key: string]: EncryptedData }): Promise<{
    email?: string;
    phone?: string;
    address?: string;
    name?: string;
  }> {
    const decrypted: any = {};

    for (const [field, encryptedData] of Object.entries(encryptedPII)) {
      try {
        decrypted[field] = await this.decryptData(encryptedData);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Continue with other fields
      }
    }

    return decrypted;
  }

  /**
   * Encrypt database field
   */
  async encryptDatabaseField(tableName: string, fieldName: string, value: string): Promise<string> {
    try {
      const encryptedData = await this.encryptData(value);
      
      // Store encryption metadata for database field
      const metadata = {
        table: tableName,
        field: fieldName,
        keyId: encryptedData.keyId,
        algorithm: encryptedData.algorithm,
        timestamp: encryptedData.timestamp.toISOString(),
      };

      // Return encrypted value with metadata
      return JSON.stringify({
        encrypted: encryptedData.data,
        iv: encryptedData.iv,
        meta: metadata,
      });
    } catch (error) {
      console.error('Database field encryption failed:', error);
      throw new Error('Failed to encrypt database field');
    }
  }

  /**
   * Decrypt database field
   */
  async decryptDatabaseField(encryptedValue: string): Promise<string> {
    try {
      const parsed = JSON.parse(encryptedValue);
      
      const encryptedData: EncryptedData = {
        data: parsed.encrypted,
        keyId: parsed.meta.keyId,
        algorithm: parsed.meta.algorithm,
        iv: parsed.iv,
        timestamp: new Date(parsed.meta.timestamp),
      };

      return await this.decryptData(encryptedData);
    } catch (error) {
      console.error('Database field decryption failed:', error);
      throw new Error('Failed to decrypt database field');
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(): Promise<KeyRotationResult> {
    try {
      const oldKeyId = this.currentKeyId;
      if (!oldKeyId) {
        throw new Error('No current key to rotate');
      }

      // Generate new key
      const newKeyId = await this.generateNewKey();
      
      // Mark old key as inactive
      const oldKeyInfo = this.keyInfo.get(oldKeyId);
      if (oldKeyInfo) {
        oldKeyInfo.isActive = false;
        this.keyInfo.set(oldKeyId, oldKeyInfo);
      }

      // Set new key as current
      this.currentKeyId = newKeyId;

      // In a real implementation, you would re-encrypt data with the new key
      // For now, we'll return a mock result
      const result: KeyRotationResult = {
        oldKeyId,
        newKeyId,
        rotatedAt: new Date(),
        affectedRecords: 0, // Would be calculated during actual re-encryption
      };

      console.log('Key rotation completed:', result);
      return result;
    } catch (error) {
      console.error('Key rotation failed:', error);
      throw new Error('Failed to rotate encryption keys');
    }
  }

  /**
   * Check if key rotation is needed
   */
  isKeyRotationNeeded(): boolean {
    if (!this.currentKeyId) {
      return true;
    }

    const keyInfo = this.keyInfo.get(this.currentKeyId);
    if (!keyInfo) {
      return true;
    }

    const now = new Date();
    const rotationThreshold = new Date(
      keyInfo.createdAt.getTime() + 
      (productionSecurityConfig.encryption.keyRotationInterval * 24 * 60 * 60 * 1000)
    );

    return now >= rotationThreshold;
  }

  /**
   * Get encryption key information
   */
  getKeyInfo(keyId?: string): EncryptionKeyInfo | null {
    const useKeyId = keyId || this.currentKeyId;
    if (!useKeyId) {
      return null;
    }

    return this.keyInfo.get(useKeyId) || null;
  }

  /**
   * List all encryption keys
   */
  listKeys(): EncryptionKeyInfo[] {
    return Array.from(this.keyInfo.values());
  }

  /**
   * Securely delete encryption key
   */
  async deleteKey(keyId: string): Promise<boolean> {
    try {
      // Don't delete the current active key
      if (keyId === this.currentKeyId) {
        throw new Error('Cannot delete the current active key');
      }

      // Remove key and info
      this.keys.delete(keyId);
      this.keyInfo.delete(keyId);

      console.log(`Encryption key deleted: ${keyId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete encryption key:', error);
      return false;
    }
  }

  /**
   * Export key for backup (encrypted)
   */
  async exportKey(keyId: string, masterPassword: string): Promise<string> {
    try {
      const key = this.keys.get(keyId);
      if (!key) {
        throw new Error(`Key not found: ${keyId}`);
      }

      // Export the key
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      const keyArray = new Uint8Array(exportedKey);
      const keyBase64 = btoa(String.fromCharCode(...keyArray));

      // Encrypt the exported key with master password
      const encryptedKey = await this.encryptWithPassword(keyBase64, masterPassword);

      const keyInfo = this.keyInfo.get(keyId);
      const exportData = {
        keyId,
        encryptedKey,
        keyInfo,
        exportedAt: new Date().toISOString(),
      };

      return JSON.stringify(exportData);
    } catch (error) {
      console.error('Key export failed:', error);
      throw new Error('Failed to export encryption key');
    }
  }

  /**
   * Import key from backup
   */
  async importKey(exportedData: string, masterPassword: string): Promise<string> {
    try {
      const parsed = JSON.parse(exportedData);
      
      // Decrypt the key with master password
      const keyBase64 = await this.decryptWithPassword(parsed.encryptedKey, masterPassword);
      const keyArray = new Uint8Array(
        atob(keyBase64).split('').map(char => char.charCodeAt(0))
      );

      // Import the key
      const key = await crypto.subtle.importKey(
        'raw',
        keyArray,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );

      // Restore key info
      this.keys.set(parsed.keyId, key);
      this.keyInfo.set(parsed.keyId, parsed.keyInfo);

      console.log(`Encryption key imported: ${parsed.keyId}`);
      return parsed.keyId;
    } catch (error) {
      console.error('Key import failed:', error);
      throw new Error('Failed to import encryption key');
    }
  }

  /**
   * Encrypt data with password (for key backup)
   */
  private async encryptWithPassword(data: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive key from password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(data)
    );

    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...result));
  }

  /**
   * Decrypt data with password (for key backup)
   */
  private async decryptWithPassword(encryptedData: string, password: string): Promise<string> {
    const decoder = new TextDecoder();
    const data = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );

    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);

    // Derive key from password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  }

  /**
   * Validate encryption configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.supportsWebCrypto) {
      errors.push('WebCrypto API is not available; running with mock encryption.');
      return {
        isValid: false,
        errors,
      };
    }

    if (!productionSecurityConfig.encryption.enableDataEncryption) {
      errors.push('Data encryption is not enabled');
    }

    if (productionSecurityConfig.encryption.encryptionAlgorithm !== 'AES-256-GCM') {
      errors.push('Encryption algorithm should be AES-256-GCM');
    }

    if (productionSecurityConfig.encryption.keyRotationInterval < 30) {
      errors.push('Key rotation interval should be at least 30 days');
    }

    if (this.keys.size === 0) {
      errors.push('No encryption keys available');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get encryption statistics
   */
  getEncryptionStats(): {
    totalKeys: number;
    activeKeys: number;
    currentKeyId: string | null;
    keyRotationNeeded: boolean;
    lastRotation: Date | null;
  } {
    const activeKeys = Array.from(this.keyInfo.values()).filter(info => info.isActive);
    const lastRotation = activeKeys.length > 0 
      ? new Date(Math.max(...activeKeys.map(info => info.createdAt.getTime())))
      : null;

    return {
      totalKeys: this.keys.size,
      activeKeys: activeKeys.length,
      currentKeyId: this.currentKeyId,
      keyRotationNeeded: this.isKeyRotationNeeded(),
      lastRotation,
    };
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();
export default encryptionService;
